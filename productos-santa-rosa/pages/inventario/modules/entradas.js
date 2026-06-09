import LocalDB from "../../../core/storage/local-db.js";

import {
    productos
}
from "./storage.js";

export function renderProductos(){

    const selectInventario =
    document.getElementById(
        "productoInventario"
    );

    selectInventario.innerHTML = "";

    productos.forEach(producto=>{

        // INVENTARIO

        const optionInventario =
        document.createElement("option");

        optionInventario.value =
        producto.nombre;

        optionInventario.textContent =
        producto.nombre;

        selectInventario.appendChild(
            optionInventario
        );
    });
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

    LocalDB.getProducts()
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

            <td>${stock}</td>

            <td>${estado}</td>

            <td>

                <button
                    onclick="eliminarProductoPorId('${producto.id}')"
                >
                    🗑
                </button>

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

window.eliminarProductoPorId =
    eliminarProductoPorId;
