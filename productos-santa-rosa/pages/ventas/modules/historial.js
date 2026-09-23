import LocalDB from "../../../core/storage/local-db.js";
import { mostrarTicketOperacion } from "./ticket.js";

let paginaActual = 1;
let registrosPorPagina = 25;

function tipoOperacion(venta){
    if(venta.tipoOperacion) return venta.tipoOperacion;
    if(venta.consignacion || venta.consignacionId) return "CONSIGNACION";
    if(venta.comanda || venta.comandaId) return "COMANDA";
    return "DIRECTA";
}

function textoTipo(tipo){
    return ({COMANDA:"Comanda", DIRECTA:"Directa", CONSIGNACION:"Consignación", CONSIGNACION_PARCIAL:"Venta parcial"})[tipo] || tipo;
}

function detalleVenta(venta){
    if(Array.isArray(venta.items) && venta.items.length > 1) return `${venta.items.length} productos`;
    if(Array.isArray(venta.items) && venta.items.length === 1){
        const p = LocalDB.getProducts().find(x => x.id === venta.items[0].productId);
        return p?.nombre || venta.producto || "1 producto";
    }
    return venta.producto || "—";
}

function fechaVenta(venta){
    return new Date(venta.createdAt || venta.fecha || 0).getTime() || 0;
}

function esConsignacionAbierta(venta){
    if(tipoOperacion(venta) !== "CONSIGNACION") return false;
    const consignacion = venta.consignacionId ? LocalDB.getConsignationById?.(venta.consignacionId) : null;
    return consignacion?.estado === "ACTIVA" || venta.estadoConsignacion === "ACTIVA";
}

export function renderTablaVentas(){
    const tabla = document.getElementById("tablaVentas");
    if(!tabla) return;

    const texto = (document.getElementById("buscarVentas")?.value || "").trim().toLowerCase();
    const filtroTipo = document.getElementById("filtroTipoVenta")?.value || "todos";

    const ventas = [...LocalDB.getSales()]
        .filter(venta => !esConsignacionAbierta(venta))
        .sort((a,b)=>fechaVenta(b)-fechaVenta(a))
        .filter(venta=>{
            const tipo = tipoOperacion(venta);
            const detalle = detalleVenta(venta).toLowerCase();
            const cliente = String(venta.cliente || "").toLowerCase();
            const fecha = String(venta.fecha || venta.createdAt || "").toLowerCase();
            const total = String(venta.total || 0);
            const coincideTexto = !texto || detalle.includes(texto) || cliente.includes(texto) || fecha.includes(texto) || total.includes(texto) || tipo.toLowerCase().includes(texto);
            const coincideTipo = filtroTipo === "todos" || tipo === filtroTipo;
            return coincideTexto && coincideTipo;
        });

    const totalPaginas = Math.max(1, Math.ceil(ventas.length / registrosPorPagina));
    if(paginaActual > totalPaginas) paginaActual = totalPaginas;
    const inicio = (paginaActual-1)*registrosPorPagina;
    const pagina = ventas.slice(inicio, inicio+registrosPorPagina);

    tabla.innerHTML = pagina.map(venta=>`
        <tr>
            <td>${venta.fecha || new Date(venta.createdAt).toLocaleString()}</td>
            <td><span class="tipo-venta tipo-${tipoOperacion(venta).toLowerCase()}">${textoTipo(tipoOperacion(venta))}</span></td>
            <td>${detalleVenta(venta)}</td>
            <td>$${Number(venta.total || 0).toFixed(2)}</td>
            <td class="acciones-operacion">
                <button class="btnVerTicket" data-id="${venta.id}" title="Ver ticket">🧾</button>
                <button class="btnEliminarOperacion" data-id="${venta.id}" title="Eliminar operación">🗑️</button>
            </td>
        </tr>`).join("");

    document.querySelectorAll(".btnVerTicket").forEach(btn=>{
        btn.onclick = ()=>{
            const venta = LocalDB.getSales().find(v=>v.id === btn.dataset.id);
            mostrarTicketOperacion(venta);
        };
    });

    document.querySelectorAll(".btnEliminarOperacion").forEach(btn=>{
        btn.onclick = ()=> eliminarOperacion(btn.dataset.id);
    });

    renderPaginacion(ventas.length, totalPaginas);
}

function eliminarOperacion(id){
    const venta = LocalDB.getSales().find(v => v.id === id);
    if(!venta) return;

    const tipo = tipoOperacion(venta);
    const esConsignacion = tipo === "CONSIGNACION";
    const mensaje = esConsignacion
        ? "¿Eliminar esta operación del Historial de Ventas?\n\nLa consignación y sus movimientos de inventario NO se eliminarán. Solo se quitará su registro de venta de este historial."
        : "¿Eliminar esta operación?\n\nLa venta se quitará del historial y el inventario calculado se actualizará como si esta venta no existiera.";

    if(!confirm(mensaje)) return;

    if(typeof LocalDB.deleteSale === "function"){
        LocalDB.deleteSale(id);
    }else{
        LocalDB.saveSales(LocalDB.getSales().filter(v => v.id !== id));
    }

    renderTablaVentas();
    actualizarKPIs();
}

function renderPaginacion(totalRegistros, totalPaginas){
    const cont = document.getElementById("paginacionVentas");
    if(!cont) return;
    if(!totalRegistros){
        cont.innerHTML = "";
        return;
    }
    const paginas=[];
    const maxVisibles=7;
    let inicio=Math.max(1,paginaActual-3), fin=Math.min(totalPaginas,inicio+maxVisibles-1);
    inicio=Math.max(1,fin-maxVisibles+1);
    for(let i=inicio;i<=fin;i++) paginas.push(`<button class="pagina-btn ${i===paginaActual?"activa":""}" data-page="${i}">${i}</button>`);
    cont.innerHTML = `
        <div class="paginacion-info">${((paginaActual-1)*registrosPorPagina)+1}-${Math.min(paginaActual*registrosPorPagina,totalRegistros)} de ${totalRegistros}</div>
        <div class="paginacion-controles">
            <button class="pagina-btn" data-page="${paginaActual-1}" ${paginaActual===1?"disabled":""}>‹</button>
            ${paginas.join("")}
            <button class="pagina-btn" data-page="${paginaActual+1}" ${paginaActual===totalPaginas?"disabled":""}>›</button>
        </div>`;
    cont.querySelectorAll(".pagina-btn:not(:disabled)").forEach(btn=>btn.onclick=()=>{
        paginaActual=Math.min(totalPaginas,Math.max(1,Number(btn.dataset.page)));
        renderTablaVentas();
    });
}

export function actualizarKPIs(){
    const ventas = LocalDB.getSales();
    const totalVentas = ventas.reduce((t,v)=>t+Number(v.total||0),0);
    const totalGanancia = ventas.reduce((t,v)=>t+Number(v.ganancia||0),0);
    document.getElementById("totalVentas")?.replaceChildren(`$${totalVentas.toFixed(2)}`);
    document.getElementById("totalGanancia")?.replaceChildren(`$${totalGanancia.toFixed(2)}`);
}

export function resetPaginaVentas(){ paginaActual=1; renderTablaVentas(); }
export function cambiarRegistrosVentas(valor){ registrosPorPagina=Number(valor)||25; paginaActual=1; renderTablaVentas(); }
