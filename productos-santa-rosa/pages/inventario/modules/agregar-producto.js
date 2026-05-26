import {
    renderProductos
}
from "./entradas.js";

import {
    productos,
    movimientos,
    guardarLocal
}
from "./storage.js";

export function agregarProducto(){

    const nombre =
    document.getElementById("nuevoProducto").value;

    const precio =
    Number(
        document.getElementById("nuevoPrecio").value
    );

    const costo =
    Number(
        document.getElementById("nuevoCosto").value
    );

    const stock =
    Number(
        document.getElementById("nuevoStock").value
    );

    if(nombre.trim() === ""){

        alert("Escribe un nombre");

        return;

    }

    if(precio <= 0){

        alert("Precio inválido");

        return;

    }

    if(costo < 0){

        alert("Costo inválido");

        return;

    }

    if(stock < 0){

        alert("Inventario inválido");

        return;

    }

    const existe =
    productos.some(
        p =>
        p.nombre.toLowerCase()
        ===
        nombre.toLowerCase()
    );

    if(existe){

        alert("El producto ya existe");

        return;

    }

    productos.push({

        nombre,
        precio,
        costo,
        stock

    });

    movimientos.push({

        tipo: "ALTA PRODUCTO",

        producto: nombre,

        cantidad: stock,

        fecha: new Date().toLocaleString()

    });

    guardarLocal();

    renderProductos();

    limpiarFormulario();

    alert("Producto agregado");

}

export function eliminarProducto(){

    const nombre =
    document.getElementById(
    "productoEliminar"
    ).value;

    if(!nombre){

        alert("Selecciona producto");

        return;

    }

    const index =
    productos.findIndex(
        p => p.nombre === nombre
    );

    if(index === -1){

        alert("Producto no encontrado");

        return;

    }

    productos.splice(index,1);

    movimientos.push({

        tipo: "ELIMINAR PRODUCTO",

        producto: nombre,

        cantidad: 0,

        fecha: new Date().toLocaleString()

    });

    guardarLocal();
    
    renderProductos();

    alert("Producto eliminado");

}

function limpiarFormulario(){

    document.getElementById("nuevoProducto").value = "";

    document.getElementById("nuevoPrecio").value = "";

    document.getElementById("nuevoCosto").value = "";

    document.getElementById("nuevoStock").value = "";

}
