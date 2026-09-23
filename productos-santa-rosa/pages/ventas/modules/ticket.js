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
            ? (operation.estadoConsignacion === "ACTIVA" ? "TICKET DE VENTA · ABIERTA" : "TICKET DE VENTA")
            : "TICKET DE VENTA",
        operation,
        items,
        total: type === "CONSIGNACION"
            ? items.reduce((t,i)=>t + (operation.estadoConsignacion === "ACTIVA" ? i.entregado : i.vendido) * i.precio, 0)
            : Number(operation.total || items.reduce((t,i)=>t+i.subtotal,0))
    };
}

function renderTicket(data, extra = {}){
    const {operation, items, total, type, title} = data;
    const isConsignacion = type === "CONSIGNACION";
    const activa = isConsignacion && operation.estadoConsignacion === "ACTIVA";
    const consignacion = operation._consignacionSnapshot || (operation.consignacionId ? LocalDB.getConsignationById(operation.consignacionId) : null);
    const tieneVentasParciales = activa && Array.isArray(consignacion?.ventasParciales) && consignacion.ventasParciales.length > 0;
    const fecha = operation.fecha || operation.createdAt || new Date().toLocaleString();
    const cliente = operation.cliente || extra.cliente || "Público en general";

    const entregados = (consignacion?.items || []).filter(i => Number(i.cantidadEntregada || 0) > 0);
    const vendidos = [];
    (consignacion?.ventasParciales || []).forEach(v => {
        if(v.tipo !== "VENTA_PARCIAL") return;
        (v.items || []).forEach(item => {
            const existente = vendidos.find(x => x.productId === item.productId && Number(x.price) === Number(item.price));
            if(existente){ existente.quantity += Number(item.quantity || 0); }
            else { vendidos.push({...item, quantity:Number(item.quantity || 0)}); }
        });
    });

    const productos = getProductsMap();
    const vendidoRows = vendidos.map(item => {
        const p=productos.get(item.productId);
        const qty=Number(item.quantity || 0), price=Number(item.price || 0);
        return `<tr><td>${escapeHtml(p?.nombre || "Producto")}</td><td>${qty}</td><td>${money(price)}</td><td>${money(qty*price)}</td></tr>`;
    }).join("");
    const entregadoRows = entregados.map(item => {
        const p=productos.get(item.productId);
        const qty=Number(item.cantidadEntregada || 0), price=Number(item.precio || p?.precio || 0);
        return `<tr><td>${escapeHtml(p?.nombre || "Producto")}</td><td>${qty}</td><td>${money(price)}</td><td>${money(qty*price)}</td></tr>`;
    }).join("");

    const totalEntregado = entregados.reduce((s,i)=>s+Number(i.cantidadEntregada||0)*Number(i.precio||productos.get(i.productId)?.precio||0),0);
    const cantidadEntregada = entregados.reduce((s,i)=>s+Number(i.cantidadEntregada||0),0);
    const totalVendido = vendidos.reduce((s,i)=>s+Number(i.quantity||0)*Number(i.price||0),0);
    const cantidadVendida = vendidos.reduce((s,i)=>s+Number(i.quantity||0),0);

    let body = "";
    let totalLabel = "TOTAL";
    let totalValue = total;

    if(isConsignacion && activa && !tieneVentasParciales){
        body = `<table class="ticket-table"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>${entregadoRows}</tbody></table>`;
        totalLabel = "TOTAL ESTIMADO";
        totalValue = totalEntregado;
    }else if(isConsignacion && activa && tieneVentasParciales){
        body = `
            <h3 class="ticket-section-title">ENTREGADO</h3>
            <table class="ticket-table"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>${entregadoRows || `<tr><td colspan="4">Sin productos entregados</td></tr>`}</tbody></table>
            <div class="ticket-subtotal">Total entregado: ${cantidadEntregada} piezas — ${money(totalEntregado)}</div>
            <h3 class="ticket-section-title">VENDIDO</h3>
            <table class="ticket-table"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>${vendidoRows || `<tr><td colspan="4">Sin ventas registradas</td></tr>`}</tbody></table>
            <div class="ticket-subtotal">Total vendido: ${cantidadVendida} piezas — ${money(totalVendido)}</div>`;
        totalLabel = "TOTAL ESTIMADO";
        totalValue = totalEntregado + totalVendido;
    }else if(isConsignacion){
        const cerrados = (consignacion?.items || []).map(item=>{
            const p=productos.get(item.productId);
            const precio=Number(item.precio || p?.precio || 0);
            const vendido=Number(item.cantidadVendida || 0);
            const devuelto=Number(item.cantidadDevuelta || 0);
            return {nombre:p?.nombre||"Producto",precio,vendido,devuelto};
        });
        const vendidoFinal=cerrados.filter(x=>x.vendido>0).map(x=>`<tr><td>${escapeHtml(x.nombre)}</td><td>${x.vendido}</td><td>${money(x.precio)}</td><td>${money(x.vendido*x.precio)}</td></tr>`).join("");
        const devueltoFinal=cerrados.filter(x=>x.devuelto>0).map(x=>`<tr><td>${escapeHtml(x.nombre)}</td><td>${x.devuelto}</td><td>${money(x.precio)}</td><td>-${money(x.devuelto*x.precio)}</td></tr>`).join("");
        const tv=cerrados.reduce((s,x)=>s+x.vendido*x.precio,0);
        const td=cerrados.reduce((s,x)=>s+x.devuelto*x.precio,0);
        const cv=cerrados.reduce((s,x)=>s+x.vendido,0);
        const cd=cerrados.reduce((s,x)=>s+x.devuelto,0);
        body=`
            <h3 class="ticket-section-title">VENDIDO</h3>
            <table class="ticket-table"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>${vendidoFinal || `<tr><td colspan="4">Sin ventas registradas</td></tr>`}</tbody></table>
            <div class="ticket-subtotal">Total vendido: ${cv} piezas — ${money(tv)}</div>
            <h3 class="ticket-section-title">DEVUELTO</h3>
            <table class="ticket-table"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>${devueltoFinal || `<tr><td colspan="4">Sin devoluciones registradas</td></tr>`}</tbody></table>
            <div class="ticket-subtotal">Total devuelto: ${cd} piezas — -${money(td)}</div>`;
        totalValue=tv;
    }else{
        body=`<table class="ticket-table"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>${items.map(item=>`<tr><td>${escapeHtml(item.nombre)}</td><td>${item.cantidad}</td><td>${money(item.precio)}</td><td>${money(item.subtotal)}</td></tr>`).join("")}</tbody></table>`;
    }

    return `
        <div class="ticket-overlay" id="ticketOverlay">
            <div class="ticket-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
                <div class="ticket-actions no-print"><button type="button" id="cerrarTicketBtn">✕</button><button type="button" id="imprimirTicketBtn">🖨️ Imprimir</button></div>
                <div class="ticket-paper">
                    <header class="ticket-header"><h2>Productos Santa Rosa</h2><p>${title}</p></header>
                    <div class="ticket-meta"><div><span>Fecha</span><strong>${escapeHtml(fecha)}</strong></div><div><span>Nombre</span><strong>${escapeHtml(cliente)}</strong></div></div>
                    ${isConsignacion && operation.consignacionId ? `<p class="ticket-id">Folio: ${escapeHtml(operation.consignacionId)}</p>` : ""}
                    ${isConsignacion && operation.estadoConsignacion ? `<p class="ticket-id">Estado: ${operation.estadoConsignacion === "ACTIVA" ? "ABIERTA" : "CERRADA"}</p>` : ""}
                    ${body}
                    <div class="ticket-total"><span>${totalLabel}</span><strong>${money(totalValue)}</strong></div>
                    <footer class="ticket-footer"><p>Gracias por su preferencia</p><small>Documento generado por el sistema</small></footer>
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
