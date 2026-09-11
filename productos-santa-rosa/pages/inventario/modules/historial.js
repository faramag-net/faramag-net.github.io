import LocalDB from "../../../core/storage/local-db.js";

let paginaActual = 1;
let registrosPorPagina = 25;

function fechaMovimiento(movimiento){
    return new Date(movimiento.timestamp || movimiento.fecha || 0).getTime() || 0;
}

export function renderTabla(){
    const tabla = document.getElementById("tablaInventario");
    if(!tabla) return;

    const filtro = (document.getElementById("buscarHistorial")?.value || "").trim().toLowerCase();

    const movimientos = [...LocalDB.getHistory()]
        .sort((a,b)=>fechaMovimiento(b)-fechaMovimiento(a))
        .filter(movimiento =>
            movimiento.tipo?.toLowerCase().includes(filtro) ||
            movimiento.producto?.toLowerCase().includes(filtro) ||
            movimiento.fecha?.toLowerCase().includes(filtro)
        );

    const totalPaginas = Math.max(1, Math.ceil(movimientos.length / registrosPorPagina));
    if(paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * registrosPorPagina;
    const pagina = movimientos.slice(inicio, inicio + registrosPorPagina);

    tabla.innerHTML = pagina.map(movimiento => `
        <tr>
            <td>${movimiento.tipo}</td>
            <td>${movimiento.producto || "—"}</td>
            <td>${movimiento.cantidad}</td>
            <td>$${Number(movimiento.costo || 0).toFixed(2)}</td>
            <td>${movimiento.stock ?? 0}</td>
            <td>${movimiento.fecha || "—"}</td>
            <td>
                <button class="btnEliminarMovimiento" data-id="${movimiento.id}" title="Eliminar Movimiento">❌</button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".btnEliminarMovimiento").forEach(btn=>{
        btn.onclick = () => {
            if(!confirm("¿Eliminar movimiento?\n\nEsta acción modifica el historial que se utiliza para calcular las existencias.")) return;
            LocalDB.saveHistory(LocalDB.getHistory().filter(item => item.id !== btn.dataset.id));
            renderTabla();
            actualizarResumen();
        };
    });

    renderPaginacion(movimientos.length, totalPaginas);
}

function renderPaginacion(totalRegistros, totalPaginas){
    const cont = document.getElementById("paginacionInventario");
    if(!cont) return;
    if(!totalRegistros){ cont.innerHTML = ""; return; }

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
        renderTabla();
    });
}

export function cambiarRegistrosInventario(valor){
    registrosPorPagina = Number(valor) || 25;
    paginaActual = 1;
    renderTabla();
}

export function resetPaginaInventario(){
    paginaActual = 1;
    renderTabla();
}

export function actualizarResumen(){
    const totalProductos = document.getElementById("totalProductos");
    const productos = LocalDB.getProducts();
    if(totalProductos) totalProductos.innerText = productos.length;

    const cards = document.getElementById("cardsInventario");
    if(!cards) return;
    cards.innerHTML = "";

    productos.forEach(producto=>{
        let color = "#28a745";
        let estado = "✅ OK";
        const stock = LocalDB.getCalculatedStock(producto.id);
        if(stock > 0 && stock <= 5){ color = "#ffc107"; estado = "⚠️ BAJO"; }
        if(stock === 0){ color = "#dc3545"; estado = "⛔ AGOTADO"; }
        if(stock < 0){ color = "#b00020"; estado = "🚨 NEGATIVO"; }

        cards.innerHTML += `
            <div class="card-producto">
                <h4>${producto.nombre}</h4>
                <p style="color:${color}">${stock}</p>
                <small style="color:${color};font-weight:bold;">${estado}</small>
            </div>`;
    });
}
