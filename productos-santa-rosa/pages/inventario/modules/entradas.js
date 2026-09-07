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

    const producto =
    LocalDB.getProducts()
    .find(p => p.id === id);

    if(!producto) return;

    const nuevoPrecio =
    prompt(
        "Nuevo precio:",
        producto.precio
    );

    if(nuevoPrecio === null) return;

    const nuevoCosto =
    prompt(
        "Nuevo costo:",
        producto.costo || 0
    );

    if(nuevoCosto === null) return;

    const nuevaCategoria =
    prompt(
        "Categoría (paleta, boli, postre, historico u otro):",
        producto.categoria || "otro"
    );

    if(nuevaCategoria === null) return;

    const categoria =
        nuevaCategoria.trim().toLowerCase();

    const categoriasValidas =
        ["paleta", "boli", "postre", "historico", "otro"];

    if(!categoriasValidas.includes(categoria)){
        alert("Categoría inválida");
        return;
    }

    LocalDB.updateProduct(id, {

        precio: Number(nuevoPrecio),

        costo: Number(nuevoCosto),

        categoria

    });

    renderTablaProductos();

    alert("Producto actualizado");

}

window.editarProducto =
    editarProducto;
window.eliminarProductoPorId =
    eliminarProductoPorId;
