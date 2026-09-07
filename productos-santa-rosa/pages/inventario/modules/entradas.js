import LocalDB from "../../../core/storage/local-db.js";

import {
    productos
}
from "./storage.js";

export function renderProductos(){
    const selectInventario = document.getElementById("productoInventario");
    if(!selectInventario) return;

    const texto = (document.getElementById("buscarInventario")?.value || "")
        .trim().toLowerCase();
    const categoria = document.getElementById("filtroInventario")?.value || "todos";
    const valorActual = selectInventario.value;

    const lista = [...productos]
        .filter(p => {
            const nombre = (p.nombre || "").toLowerCase();
            const cat = (p.categoria || "historico").toLowerCase();
            return (!texto || nombre.includes(texto)) &&
                   (categoria === "todos" || cat === categoria);
        })
        .sort((a,b) => (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" }));

    selectInventario.innerHTML = lista.map(producto =>
        `<option value="${producto.nombre}">${producto.nombre}</option>`
    ).join("");

    if(lista.some(p => p.nombre === valorActual)) {
        selectInventario.value = valorActual;
    }

    actualizarCostoMovimiento();
}

export function actualizarCostoMovimiento(){
    const nombre = document.getElementById("productoInventario")?.value;
    const producto = LocalDB.getProducts().find(p => p.nombre === nombre);
    const costo = Number(producto?.costo || 0);
    const el = document.getElementById("costoMovimiento");
    if(el) el.textContent = "$" + costo.toFixed(2);
}

export function agregarInventario(){

    const nombre =
    document.getElementById("productoInventario").value;

    const cantidad =
    Number(
        document.getElementById("agregarStock").value
    );

    const tipo =
    document.getElementById("tipoMovimiento").value;

    const producto =
    productos.find(
        p => p.nombre === nombre
    );

    if(!producto){

        alert("Producto no encontrado");

        return;

    }

    if(cantidad <= 0){

        alert("Cantidad inválida");

        return;

    }

let movimientoCantidad = cantidad;

if(
    tipo === "MERMA" ||
    tipo === "CORTESIA"
){

    movimientoCantidad = -cantidad;
}

LocalDB.updateStock(
    producto.id,
    movimientoCantidad
);

const stockActual =
    LocalDB.getCalculatedStock(
    producto.id
);

LocalDB.addHistory({

    tipo,

    producto: nombre,

    cantidad,

    costo: Number(producto.costo || 0),

    stock: stockActual,

    fecha: new Date().toLocaleString()

});

    productos.length = 0;

productos.push(
    ...LocalDB.getProducts()
);
    
    document.getElementById("agregarStock").value = "";
    
    renderTablaProductos();
    
    alert("Movimiento registrado");

}

export function renderTablaProductos(){

    const tabla =
    document.getElementById(
        "tablaProductos"
    );

    if(!tabla) return;

    tabla.innerHTML = "";

    const texto = (document.getElementById("buscarInventario")?.value || "")
        .trim().toLowerCase();
    const categoria = document.getElementById("filtroInventario")?.value || "todos";

    [...LocalDB.getProducts()]
    .filter(producto => {
        const nombre = (producto.nombre || "").toLowerCase();
        const cat = (producto.categoria || "historico").toLowerCase();
        return (!texto || nombre.includes(texto)) &&
               (categoria === "todos" || cat === categoria);
    })
    .sort((a,b) => (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" }))
    .forEach(producto=>{

    const stock =
    LocalDB.getCalculatedStock(
    producto.id
    );

        let estado = "OK";

        if(stock <= 0)
            estado = "AGOTADO";

        else if(stock < 5)
            estado = "BAJO";

        tabla.innerHTML += `

        <tr>

            <td>${producto.nombre}</td>

            <td>$${Number(producto.precio || 0).toFixed(2)}</td>

            <td>$${Number(producto.costo || 0).toFixed(2)}</td>

            <td>${stock}</td>

            <td>${estado}</td>

            <td>

    <div class="acciones-producto">

        <button
            onclick="editarProducto('${producto.id}')"
            class="btn-icono"
        >
            ✏️
        </button>

        <button
            onclick="eliminarProductoPorId('${producto.id}')"
            class="btn-icono"
        >
            🗑️
        </button>

    </div>

            </td>

        </tr>

        `;

    });

}

export function eliminarProductoPorId(id){

    const producto =
    LocalDB.getProducts()
    .find(
        p => p.id === id
    );

    if(!producto) return;

    if(
        !confirm(
            `¿Eliminar ${producto.nombre}?`
        )
    ){
        return;
    }

    LocalDB.deleteProduct(id);

    LocalDB.addHistory({

        tipo: "ELIMINAR PRODUCTO",

        producto: producto.nombre,

        cantidad: 0,

        stock: 0,

        fecha: new Date().toLocaleString()

    });

    location.reload();

}

export function editarProducto(id){

    const producto = LocalDB.getProducts().find(p => p.id === id);
    if(!producto) return;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
        <div class="modal-content modal-editar-producto">
            <button class="modal-close" type="button">✖</button>
            <h2>✏️ Editar producto</h2>
            <p><strong>${producto.nombre}</strong></p>

            <label>Categoría</label>
            <select id="editarCategoria">
                <option value="paleta">Paleta</option>
                <option value="boli">Boli</option>
                <option value="postre">Postre</option>
                <option value="otro">Otro</option>
                <option value="historico">Histórico</option>
            </select>

            <label>Precio de venta</label>
            <input id="editarPrecio" type="number" min="0" step="0.01" value="${Number(producto.precio || 0)}">

            <label>Costo</label>
            <input id="editarCosto" type="number" min="0" step="0.01" value="${Number(producto.costo || 0)}">

            <div class="acciones-editar-producto">
                <button type="button" id="cancelarEditar">Cancelar</button>
                <button type="button" id="guardarEditar">💾 Guardar cambios</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#editarCategoria").value = producto.categoria || "otro";

    const cerrar = () => overlay.remove();
    overlay.querySelector(".modal-close").onclick = cerrar;
    overlay.querySelector("#cancelarEditar").onclick = cerrar;

    overlay.querySelector("#guardarEditar").onclick = () => {
        const precio = Number(overlay.querySelector("#editarPrecio").value);
        const costo = Number(overlay.querySelector("#editarCosto").value);
        const categoria = overlay.querySelector("#editarCategoria").value;

        if(!Number.isFinite(precio) || precio < 0){
            alert("Precio inválido");
            return;
        }
        if(!Number.isFinite(costo) || costo < 0){
            alert("Costo inválido");
            return;
        }

        LocalDB.updateProduct(id, { precio, costo, categoria });
        productos.length = 0;
        productos.push(...LocalDB.getProducts());
        cerrar();
        renderProductos();
        renderTablaProductos();
        alert("Producto actualizado");
    };
}

window.editarProducto =
    editarProducto;
window.eliminarProductoPorId =
    eliminarProductoPorId;
