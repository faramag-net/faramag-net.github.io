import {
    ventas,
    guardarVentas
}
from "./storage.js";

import {
    obtenerProductos
}
from "./inventario-api.js";

export function cargarProductos(){

    const productos =
    obtenerProductos();

    const select =
    document.getElementById("producto");

    select.innerHTML = "";

    productos.forEach(producto=>{

        select.innerHTML += `

        <option value="${producto.nombre}">

            ${producto.nombre}

        </option>

        `;

    });

    actualizarProducto();

}

export function actualizarProducto(){

    const productos =
    obtenerProductos();

    const nombre =
    document.getElementById("producto").value;

    const producto =
    productos.find(
        p => p.nombre === nombre
    );

    if(!producto) return;

    document.getElementById("precio").value =
    producto.precio;

    document.getElementById("costo").value =
    producto.costo;

    actualizarSubtotal();

}

export function actualizarSubtotal(){

    const cantidad =
    Number(
        document.getElementById("cantidad").value
    );

    const precio =
    Number(
        document.getElementById("precio").value
    );

    const subtotal =
    cantidad * precio;

    document.getElementById("subtotalVista")
    .innerText =
    "SUBTOTAL: $" + subtotal.toFixed(2);

}

export function cambiarCantidad(valor){

    const input =
    document.getElementById("cantidad");

    let cantidad =
    parseInt(input.value) || 1;

    cantidad += valor;

    if(cantidad < 1){

        cantidad = 1;

    }

    input.value = cantidad;

    actualizarSubtotal();

}

export function registrarVenta(){

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

    producto.stock -= cantidad;

    const subtotal =
    cantidad * producto.precio;

    const ganancia =
    subtotal - (cantidad * producto.costo);

    ventas.push({

        producto: nombre,

        cliente,

        cantidad,

        precio: producto.precio,

        costo: producto.costo,

        subtotal,

        ganancia,

        fecha: new Date().toLocaleString()

    });

    actualizarInventario(productos);

    guardarVentas();

    limpiarFormulario();

    actualizarSubtotal();

    alert("Venta registrada");

}

function actualizarInventario(productos){

    const datos =
    JSON.parse(

        localStorage.getItem(
            "inventarioSantaRosa"
        )

    );

    datos.productos = productos;

    localStorage.setItem(

        "inventarioSantaRosa",

        JSON.stringify(datos)

    );

}

function limpiarFormulario(){

    document.getElementById("cliente").value = "";

    document.getElementById("cantidad").value = 1;

}
