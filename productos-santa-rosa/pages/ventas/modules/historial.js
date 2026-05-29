import LocalDB from "../../../core/storage/local-db.js";

export function renderTablaVentas(){

    const tabla =
    document.getElementById("tablaVentas");

    if(!tabla) return;

tabla.innerHTML = "";

const ventas = LocalDB.getSales();

ventas.forEach((venta,index)=>{

        tabla.innerHTML += `

        <tr>

            <td>${venta.producto}</td>
            <td>${venta.cliente}</td>
            <td>${venta.cantidad}</td>
            <td>$${Number(venta.precio || 0).toFixed(2)}</td>
            <td>$${Number(venta.costo || 0).toFixed(2)}</td>
            <td>$${Number(venta.total || 0).toFixed(2)}</td>
            <td>$${Number(venta.ganancia || 0).toFixed(2)}</td>
            <td>${venta.fecha}</td>

        </tr>

        `;

    });

}

export function actualizarKPIs(){

    const ventas = LocalDB.getSales();
    
    let totalVentas = 0;

    let totalGanancia = 0;

ventas.forEach(venta=>{

    totalVentas +=
    Number(venta.total || 0);

    totalGanancia +=
    Number(venta.ganancia || 0);

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
