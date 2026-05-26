import {
    ventas,
    comanda,
    guardarVentas
}
from "./storage.js";

function obtenerProductos(){

    const inventario =
    JSON.parse(

        localStorage.getItem(
            "inventarioSantaRosa"
        )

    ) || {};

    return inventario.productos || [];

}

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

export function renderComanda(){

    const tabla =
    document.getElementById("tablaComanda");

    const totalVista =
    document.getElementById("totalComanda");

    if(!tabla) return;

    tabla.innerHTML = "";

    let total = 0;

    comanda.forEach((item,index)=>{

        total += item.subtotal;

        tabla.innerHTML += `

        <tr>

            <td>${item.producto}</td>

            <td>${item.cantidad}</td>

            <td>$${item.precio}</td>

            <td>$${item.subtotal}</td>

            <td>

                <button
                onclick="eliminarComanda(${index})">

                ❌

                </button>

            </td>

        </tr>

        `;

    });

    totalVista.innerText =
    "TOTAL: $" + total.toFixed(2);

}

export function eliminarComanda(index){

    comanda.splice(index,1);

    renderComanda();

}

export function registrarComanda(){

    if(comanda.length === 0){

        alert("Comanda vacía");

        return;

    }

    const datos =
    JSON.parse(

        localStorage.getItem(
            "inventarioSantaRosa"
        )

    );

    const productos =
    datos.productos;

    comanda.forEach(item=>{

        const producto =
        productos.find(
            p => p.nombre === item.producto
        );

        if(producto){

            producto.stock -= item.cantidad;

        }

        ventas.push({

            ...item,

            fecha:
            new Date().toLocaleString()

        });

    });

    datos.productos = productos;

    localStorage.setItem(

        "inventarioSantaRosa",

        JSON.stringify(datos)

    );

    comanda.length = 0;

    guardarVentas();

    renderComanda();

    renderTablaVentas();

    actualizarKPIs();

    alert("Comanda registrada");

}
