import LocalDB from "../../../core/storage/local-db.js";

const comanda = [];

function obtenerProductos(){

    return LocalDB.getProducts();

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

if(stockActual <= 0){

    alert(
        "⚠️ Inventario en cero o negativo. La venta será registrada."
    );

}else if(cantidad > stockActual){

    alert(
        "⚠️ La venta dejará inventario negativo. La venta será registrada."
    );

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

comanda.forEach(item => {

    const producto =
    LocalDB.getProducts()
    .find(p => p.nombre === item.producto);

    if(!producto) return;

    LocalDB.createSale({

        producto: item.producto,

        cliente: item.cliente,

        cantidad: item.cantidad,

        precio: item.precio,

        costo: item.costo,

        total: item.subtotal,

        ganancia: item.ganancia,

        items: [
            {
                productId: producto.id,
                quantity: item.cantidad,
                price: item.precio
            }
        ],

        fecha: new Date().toLocaleString()

    });

});

    comanda.length = 0;

    renderComanda();

    renderTablaVentas();

    actualizarKPIs();

    alert("Comanda registrada");

}
