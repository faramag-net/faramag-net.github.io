import {
    ventas,
    comanda,
    guardarVentas
}
from "./storage.js";

import {
    obtenerProductos
}
from "./inventario-api.js";

import {
    actualizarKPIs,
    renderTablaVentas
}
from "./historial.js";

export function agregarComanda(){

    const productos =
    obtenerProductos();

    const nombre =
    document.getElementById("producto").value;

    const cliente =
    document.getElementById("cliente").value;

    const cantidad =
    Number(
        document.getElementById("cantidad").value
    );

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

    if(cantidad > producto.stock){

        alert("Inventario insuficiente");

        return;

    }

    const subtotal =
    cantidad * producto.precio;

    const ganancia =
    subtotal - (cantidad * producto.costo);

    comanda.push({

        producto: nombre,

        cliente,

        cantidad,

        precio: producto.precio,

        costo: producto.costo,

        subtotal,

        ganancia

    });

    renderComanda();

}
