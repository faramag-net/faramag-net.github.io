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
    const tipo = sale.tipoOperacion || "";

    // Una VENTA PARCIAL consultada desde Historial debe mostrar
    // únicamente los productos de ESA venta, no toda la consignación.
    if(tipo === "CONSIGNACION_PARCIAL"){
        if(Array.isArray(sale.items) && sale.items.length){
            const vendidos = sale.items.map(item => {
                const p = map.get(item.productId);
                const quantity = Number(item.quantity ?? item.cantidad ?? 0);
                const price = Number(item.price ?? item.precio ?? p?.precio ?? 0);
                return {
                    productId: item.productId,
                    nombre: p?.nombre || item.nombre || sale.producto || "Producto",
                    vendido: quantity,
                    precio: price,
                    importeVendido: quantity * price
                };
            }).filter(item => item.vendido > 0);

            // Si por compatibilidad algún registro antiguo tiene cantidades
            // inválidas en items, usamos la cantidad/total de la operación
            // solamente cuando es una venta de un solo producto.
            if(vendidos.length) return { entregados:[], vendidos, devueltos:[] };
        }

        return {
            entregados:[],
            vendidos:[{
                nombre:sale.producto || "Producto",
                vendido:Number(sale.cantidad || 0),
                precio:Number(sale.precio || 0),
                importeVendido:Number(sale.total || 0)
            }].filter(item => item.vendido > 0),
            devueltos:[]
        };
    }

    const isConsignacion = tipo === "CONSIGNACION" || sale.consignacion;

    // El ticket de una CONSIGNACIÓN representa el estado completo de la
    // consignación. Siempre obtenemos la versión actual para que el ticket
    // de cierre incluya también las ventas parciales anteriores.
    if(isConsignacion && sale.consignacionId){
        const c = LocalDB.getConsignationById?.(sale.consignacionId) || sale._consignacionSnapshot;
        if(c?.items?.length){
            const entregados = c.items
                .filter(item => Number(item.cantidadEntregada || 0) > 0)
                .map(item => {
                    const p = map.get(item.productId);
                    const cantidad = Number(item.cantidadEntregada || 0);
                    const precio = Number(item.precio ?? p?.precio ?? 0);
                    return {
                        productId:item.productId,
                        nombre:p?.nombre || "Producto",
                        entregado:cantidad,
                        precio,
                        importeEntregado:cantidad * precio
                    };
                });

            const devueltos = c.items
                .filter(item => Number(item.cantidadDevuelta || 0) > 0)
                .map(item => {
                    const p = map.get(item.productId);
                    const cantidad = Number(item.cantidadDevuelta || 0);
                    const precio = Number(item.precio ?? p?.precio ?? 0);
                    return {
                        productId:item.productId,
                        nombre:p?.nombre || "Producto",
                        devuelto:cantidad,
                        precio,
                        importeDevuelto:-(cantidad * precio)
                    };
                });

            const soldMap = new Map();
            const addSold = (item) => {
                const p = map.get(item.productId);
                const cantidad = Number(item.quantity ?? item.cantidad ?? 0);
                if(cantidad <= 0) return;
                const precio = Number(item.price ?? item.precio ?? p?.precio ?? 0);
                const key = `${item.productId}::${precio}`;
                const current = soldMap.get(key);
                if(current){
                    current.vendido += cantidad;
                    current.importeVendido += cantidad * precio;
                }else{
                    soldMap.set(key, {
                        productId:item.productId,
                        nombre:p?.nombre || item.nombre || "Producto",
                        vendido:cantidad,
                        precio,
                        importeVendido:cantidad * precio
                    });
                }
            };

            if(Array.isArray(c.ventasParciales) && c.ventasParciales.length){
                c.ventasParciales.forEach(venta => (venta.items || []).forEach(addSold));
            }else{
                // Compatibilidad con consignaciones anteriores.
                c.items.forEach(item => {
                    const cantidad = Number(item.cantidadVendida || 0);
                    if(cantidad > 0){
                        addSold({
                            productId:item.productId,
                            quantity:cantidad,
                            price:Number(item.precio ?? map.get(item.productId)?.precio ?? 0)
                        });
                    }
                });
            }

            return {
                entregados,
                vendidos:[...soldMap.values()],
                devueltos
            };
        }
    }

    // Venta normal/directa.
    if(Array.isArray(sale.items) && sale.items.length){
        const vendidos = sale.items.map(item => {
            const p = map.get(item.productId);
            const quantity = Number(item.quantity ?? item.cantidad ?? 0);
            const price = Number(item.price ?? item.precio ?? p?.precio ?? 0);
            return {
                productId:item.productId,
                nombre:p?.nombre || item.nombre || sale.producto || "Producto",
                vendido:quantity,
                precio:price,
                importeVendido:quantity * price
            };
        }).filter(item => item.vendido > 0);
        if(vendidos.length) return { entregados:[], vendidos, devueltos:[] };
    }

    return {
        entregados:[],
        vendidos:[{
            nombre:sale.producto || "Producto",
            vendido:Number(sale.cantidad || 0),
            precio:Number(sale.precio || 0),
            importeVendido:Number(sale.total || 0)
        }].filter(item => item.vendido > 0),
        devueltos:[]
    };
}

function buildTicketData(operation){
    const esVentaParcial = operation.tipoOperacion === "CONSIGNACION_PARCIAL";
    const esConsignacion = !esVentaParcial && (
        operation.tipoOperacion === "CONSIGNACION" ||
        operation.consignacion
    );
    const type = esVentaParcial
        ? "CONSIGNACION_PARCIAL"
        : (esConsignacion ? "CONSIGNACION" : (operation.tipoOperacion || "DIRECTA"));

    const normalized = normalizeSaleItems(operation);
    const activa = esConsignacion && operation.estadoConsignacion === "ACTIVA";
    const entregados = normalized.entregados || [];
    const vendidos = normalized.vendidos || [];
    const devueltos = normalized.devueltos || [];
    const tieneVentaParcial = Boolean(
        operation._consignacionSnapshot?.tieneVentasParciales || vendidos.some(i => Number(i.vendido || 0) > 0)
    );

    let total = Number(operation.total || 0);
    if(esConsignacion){
        total = activa
            ? entregados.reduce((t,i) => t + Number(i.importeEntregado || 0), 0) +
              vendidos.reduce((t,i) => t + Number(i.importeVendido || 0), 0)
            : vendidos.reduce((t,i) => t + Number(i.importeVendido || 0), 0);
    }

    return {
        type,
        activa,
        tieneVentaParcial,
        title: esConsignacion
            ? (activa ? "TICKET DE VENTA · ABIERTA" : "TICKET DE VENTA · CERRADA")
            : "TICKET DE VENTA",
        operation,
        entregados,
        vendidos,
        devueltos,
        total
    };
}

function sectionSummary(label, quantity, amount, negative = false){
    return `
        <div class="ticket-section-total">
            <span>${label}: ${Number(quantity || 0)} ${Number(quantity || 0) === 1 ? "pieza" : "piezas"}</span>
            <strong>${negative ? "-" : ""}${money(Math.abs(amount || 0))}</strong>
        </div>
    `;
}

function renderRows(items, mode){
    return items
        .filter(item => Number(item[mode] || 0) > 0)
        .map(item => {
            const quantity = Number(item[mode] || 0);
            const price = Number(item.precio || 0);
            const amount = quantity * price;
            return `
                <tr>
                    <td>${escapeHtml(item.nombre)}</td>
                    <td>${quantity}</td>
                    <td>${money(price)}</td>
                    <td>${mode === "devuelto" ? `-${money(amount)}` : money(amount)}</td>
                </tr>
            `;
        }).join("");
}

function renderSection(title, items, mode, emptyText){
    const rows = renderRows(items, mode);
    const quantity = items.reduce((t,item) => t + Number(item[mode] || 0), 0);
    const amount = items.reduce((t,item) => t + Number(item[mode] || 0) * Number(item.precio || 0), 0);
    return `
        <section class="ticket-section">
            <h3>${title}</h3>
            ${rows ? `
                <table class="ticket-table">
                    <thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            ` : `<p class="ticket-empty">${emptyText}</p>`}
            ${sectionSummary(
                title === "DEVUELTO" ? "Total devuelto" : `Total ${title.toLowerCase()}`,
                quantity,
                amount,
                title === "DEVUELTO"
            )}
        </section>
    `;
}

function renderTicket(data, extra = {}){
    const {operation, type, title, activa, tieneVentaParcial, entregados, vendidos, devueltos} = data;
    const isConsignacion = type === "CONSIGNACION";
    const isVentaParcial = type === "CONSIGNACION_PARCIAL";
    const fecha = operation.fecha || operation.createdAt || new Date().toLocaleString();
    const cliente = operation.cliente || extra.cliente || "Público en general";
    let total = Number(data.total || 0);
    let body = "";
    let totalLabel = "TOTAL";

    if(isVentaParcial){
        body = `
            <table class="ticket-table">
                <thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
                <tbody>${vendidos.map(item => `
                    <tr><td>${escapeHtml(item.nombre)}</td><td>${item.vendido}</td><td>${money(item.precio)}</td><td>${money(item.importeVendido)}</td></tr>
                `).join("")}</tbody>
            </table>
        `;
        total = vendidos.reduce((t,i) => t + Number(i.importeVendido || 0), 0);
        totalLabel = "TOTAL";
    }else if(isConsignacion && activa && !tieneVentaParcial){
        const quantity = entregados.reduce((t,i) => t + Number(i.entregado || 0), 0);
        const amount = entregados.reduce((t,i) => t + Number(i.importeEntregado || 0), 0);
        body = `
            <section class="ticket-section">
                <table class="ticket-table">
                    <thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
                    <tbody>${renderRows(entregados, "entregado")}</tbody>
                </table>
                ${sectionSummary("Total entregado", quantity, amount)}
            </section>
        `;
        total = amount;
        totalLabel = "TOTAL ESTIMADO";
    }else if(isConsignacion && activa){
        const montoEntregado = entregados.reduce((t,i) => t + Number(i.importeEntregado || 0), 0);
        const montoVendido = vendidos.reduce((t,i) => t + Number(i.importeVendido || 0), 0);
        body = `
            ${renderSection("ENTREGADO", entregados, "entregado", "Sin productos en consignación.")}
            ${renderSection("VENDIDO", vendidos, "vendido", "Sin ventas registradas.")}
        `;
        total = montoEntregado + montoVendido;
        totalLabel = "TOTAL ESTIMADO";
    }else if(isConsignacion){
        body = `
            ${renderSection("VENDIDO", vendidos, "vendido", "Sin ventas registradas.")}
            ${renderSection("DEVUELTO", devueltos, "devuelto", "Sin devoluciones registradas.")}
        `;
        total = vendidos.reduce((t,i) => t + Number(i.importeVendido || 0), 0);
        totalLabel = "TOTAL";
    }else{
        body = `
            <table class="ticket-table">
                <thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
                <tbody>${vendidos.map(item => `
                    <tr><td>${escapeHtml(item.nombre)}</td><td>${item.vendido}</td><td>${money(item.precio)}</td><td>${money(item.importeVendido)}</td></tr>
                `).join("")}</tbody>
            </table>
        `;
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
                        <div><span>Nombre</span><strong>${escapeHtml(cliente)}</strong></div>
                    </div>
                    ${isConsignacion && operation.consignacionId ? `<p class="ticket-id">Folio: ${escapeHtml(operation.consignacionId)}</p>` : ""}
                    ${isConsignacion && operation.estadoConsignacion ? `<p class="ticket-id">Estado: ${operation.estadoConsignacion === "ACTIVA" ? "ABIERTA" : "CERRADA"}</p>` : ""}
                    ${body}
                    <div class="ticket-total"><span>${totalLabel}</span><strong>${money(total)}</strong></div>
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
        total: 0
    };

    mostrarTicketOperacion(operacion, {
        consignacion,
        activo: esActiva
    });
}
