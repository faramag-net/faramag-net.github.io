import {
    ventas
}
from "./storage.js";

export function renderTablaVentas(){

    const tabla =
    document.getElementById("tablaVentas");

    if(!tabla) return;

    tabla.innerHTML = "";

    ventas.forEach((venta,index)=>{

        tabla.innerHTML += `

        <tr>

            <td>${venta.producto}</td>

            <td>${venta.cliente}</td>

            <td>${venta.cantidad}</td>

            <td>$${venta.precio.toFixed(2)}</td>

            <td>$${venta.costo.toFixed(2)}</td>

            <td>$${venta.subtotal.toFixed(2)}</td>

            <td>$${venta.ganancia.toFixed(2)}</td>

            <td>${venta.fecha}</td>

        </tr>

        `;

    });

}

export function actualizarKPIs(){

    let totalVentas = 0;

    let totalGanancia = 0;

    ventas.forEach(venta=>{

        totalVentas +=
        Number(venta.subtotal) || 0;

        totalGanancia +=
        Number(venta.ganancia) || 0;

    });

    const ventasCard =
    document.getElementById("totalVentas");

    const gananciaCard =
    document.getElementById("totalGanancia");

    if(ventasCard){

        ventasCard.innerText =
        "$" + totalVentas.toFixed(2);

    }

    if(gananciaCard){

        gananciaCard.innerText =
        "$" + totalGanancia.toFixed(2);

    }

}
