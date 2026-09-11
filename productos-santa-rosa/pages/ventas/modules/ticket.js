import LocalDB from "../../../core/storage/local-db.js";

function escapeHtml(value){
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function money(value){
    return `$${Number(value || 0).toFixed(2)}`;
}

function getProductsMap(){
    return new Map(LocalDB.getProducts().map(p => [p.id, p]));
}

function normalizeSaleItems(sale){
    const map = getProductsMap();
    const isConsignacion = sale.tipoOperacion === "CONSIGNACION" || sale.consignacion || sale.consignacionId;
    if(isConsignacion && sale.consignacionId){
        const c = sale._consignacionSnapshot || LocalDB.getConsignationById(sale.consignacionId);
        if(c?.items?.length){
            const activa = sale.estadoConsignacion === "ACTIVA" || c.estado === "ACTIVA";
            return c.items.map(item=>{
                const p=map.get(item.productId);
                const entregado=Number(item.cantidadEntregada||0);
                const devuelto=Number(item.cantidadDevuelta||0);
                // Mientras está abierta todavía no hay venta ni devolución final.
                const vendido=activa ? 0 : Number(item.cantidadVendida ?? Math.max(0,entregado-devuelto));
                const precio=Number(item.precio ?? p?.precio ?? 0);
                return {nombre:p?.nombre||"Producto",cantidad:vendido,precio,subtotal:vendido*precio,entregado,devuelto,vendido};
            });
        }
    }
    if(Array.isArray(sale.items) && sale.items.length){
        return sale.items.map(item => {
            const p = map.get(item.productId);
            const quantity = Number(item.quantity ?? item.cantidad ?? 0);
            const price = Number(item.price ?? item.precio ?? p?.precio ?? 0);
            return {nombre:p?.nombre || sale.producto || "Producto",cantidad:quantity,precio:price,subtotal:quantity*price};
        });
    }
    return [{nombre:sale.producto||"Producto",cantidad:Number(sale.cantidad||0),precio:Number(sale.precio||0),subtotal:Number(sale.total||0)}];
}

function buildTicketData(operation){
    const type = operation.tipoOperacion || (operation.consignacion ? "CONSIGNACION" : "DIRECTA");
    const items = normalizeSaleItems(operation);
    return {
        type,
        title: type === "CONSIGNACION"
            ? (operation.estadoConsignacion === "ACTIVA" ? "TICKET DE CONSIGNACIÓN · ABIERTA" : "TICKET DE CONSIGNACIÓN")
            : "NOTA DE VENTA",
        operation,
        items,
        total: Number(operation.total || items.reduce((t,i)=>t+i.subtotal,0))
    };
}

function renderTicket(data, extra = {}){
    const {operation, items, total, type, title} = data;
    const isConsignacion = type === "CONSIGNACION";
    const fecha = operation.fecha || operation.createdAt || new Date().toLocaleString();
    const cliente = operation.cliente || extra.cliente || "Público en general";

    let consignationSummary = "";
    if(isConsignacion){
        const c = extra.consignacion || LocalDB.getConsignationById(operation.consignacionId);
        if(c){
            const resumen = Array.isArray(c.items) ? c.items.reduce((acc,item)=>{
                const entregado = Number(item.cantidadEntregada || 0);
                const activo = c.estado === "ACTIVA";
                const vendido = activo ? 0 : Number(item.cantidadVendida ?? 0);
                const devuelto = activo ? 0 : Number(item.cantidadDevuelta ?? (entregado - vendido));
                acc.entregado += entregado;
                acc.vendido += vendido;
                acc.devuelto += Math.max(0, devuelto);
                return acc;
            }, {entregado:0,vendido:0,devuelto:0}) : null;
            if(resumen){
                consignationSummary = `
                    <div class="ticket-consigna-resumen">
                        <div><span>Entregado</span><strong>${resumen.entregado}</strong></div>
                        <div><span>Devuelto</span><strong>${resumen.devuelto}</strong></div>
                        <div><span>Vendido</span><strong>${resumen.vendido}</strong></div>
                    </div>`;
            }
        }
    }

    return `
        <div class="ticket-overlay" id="ticketOverlay">
            <div class="ticket-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
                <div class="ticket-actions no-print">
                    <button type="button" id="cerrarTicketBtn">✕</button>
                    <button type="button" id="imprimirTicketBtn">🖨️ Imprimir</button>
                </div>
                <div class="ticket-paper">
                    <header class="ticket-header">
                        <h2>Productos Santa Rosa</h2>
                        <p>${title}</p>
                    </header>
                    <div class="ticket-meta">
                        <div><span>Fecha</span><strong>${escapeHtml(fecha)}</strong></div>
                        <div><span>Cliente</span><strong>${escapeHtml(cliente)}</strong></div>
                    </div>
                    ${isConsignacion && operation.consignacionId ? `<p class="ticket-id">Consignación: ${escapeHtml(operation.consignacionId)}</p>` : ""}
                    ${isConsignacion && operation.estadoConsignacion ? `<p class="ticket-id">Estado: ${operation.estadoConsignacion === "ACTIVA" ? "ABIERTA" : "CERRADA"}</p>` : ""}
                    <table class="ticket-table">
                        <thead>${isConsignacion ? `<tr><th>Producto</th><th>Ent.</th><th>Dev.</th><th>Vend.</th><th>Importe</th></tr>` : `<tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr>`}</thead>
                        <tbody>
                            ${items.map(item => isConsignacion
                                ? `<tr><td>${escapeHtml(item.nombre)}</td><td>${item.entregado}</td><td>${item.devuelto}</td><td>${item.vendido}</td><td>${money(item.subtotal)}</td></tr>`
                                : `<tr><td>${escapeHtml(item.nombre)}</td><td>${item.cantidad}</td><td>${money(item.precio)}</td><td>${money(item.subtotal)}</td></tr>`).join("")}
                        </tbody>
                    </table>
                    ${consignationSummary}
                    <div class="ticket-total"><span>TOTAL</span><strong>${money(total)}</strong></div>
                    <footer class="ticket-footer">
                        <p>Gracias por su preferencia</p>
                        <small>Documento generado por el sistema</small>
                    </footer>
                </div>
            </div>
        </div>`;
}

let ticketWindow = null;

export function mostrarTicketOperacion(operation, extra = {}){
    if(!operation) return;

    const ticketHtml = renderTicket(buildTicketData(operation), extra);
    const cssUrl = new URL("../ticket.css", import.meta.url).href;

    // El ticket se abre en una ventana independiente.
    // Así no forma parte del DOM de Clientes/Visitas/Ventas y al imprimir
    // únicamente se imprime el ticket.
    if(ticketWindow && !ticketWindow.closed){
        ticketWindow.focus();
    }else{
        ticketWindow = window.open("about:blank", "psr_ticket", "width=520,height=760,resizable=yes,scrollbars=yes");
    }

    if(!ticketWindow){
        alert("El navegador bloqueó la ventana del ticket. Permite ventanas emergentes para este sitio.");
        return;
    }

    ticketWindow.document.open();
    ticketWindow.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket · Productos Santa Rosa</title>
<link rel="stylesheet" href="${cssUrl}">
</head>
<body>${ticketHtml}</body>
</html>`);
    ticketWindow.document.close();

    ticketWindow.document.getElementById("cerrarTicketBtn")?.addEventListener("click", () => ticketWindow.close());
    ticketWindow.document.getElementById("imprimirTicketBtn")?.addEventListener("click", () => {
        ticketWindow.focus();
        ticketWindow.print();
    });
    ticketWindow.document.getElementById("ticketOverlay")?.addEventListener("click", e => {
        if(e.target.id === "ticketOverlay") ticketWindow.close();
    });

    ticketWindow.onbeforeunload = () => { ticketWindow = null; };
    ticketWindow.focus();
}

export function mostrarTicketConsignacion(consignacion){
    if(!consignacion) return;

    // La consignación es la fuente de verdad mientras está abierta y también
    // al cerrarse. No dependemos de que exista todavía una venta en el historial.
    const cliente = LocalDB.getRouteClients?.().find(c => c.id === consignacion.clienteId);
    const esActiva = consignacion.estado === "ACTIVA";

    const operacion = {
        id: `CONSIGNACION-${consignacion.id}`,
        tipoOperacion: "CONSIGNACION",
        consignacion: true,
        consignacionId: consignacion.id,
        cliente: cliente?.nombre || consignacion.cliente || "Público en general",
        fecha: consignacion.fecha,
        estadoConsignacion: consignacion.estado,
        _consignacionSnapshot: consignacion,
        items: (consignacion.items || []).map(item => ({
            productId: item.productId,
            quantity: Number(item.cantidadEntregada || 0),
            price: Number(item.precio || 0)
        })),
        total: (consignacion.items || []).reduce(
            (total, item) => total + Number(item.cantidadEntregada || 0) * Number(item.precio || 0),
            0
        )
    };

    mostrarTicketOperacion(operacion, {
        consignacion,
        activo: esActiva
    });
}
