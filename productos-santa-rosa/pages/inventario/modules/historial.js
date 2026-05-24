import {
    productos,
    movimientos
}
from "./storage.js";

export function renderTabla(){

    const tabla =
    document.getElementById("tablaInventario");

    if(!tabla) return;

    tabla.innerHTML = "";

    movimientos.forEach((movimiento,index)=>{

        tabla.innerHTML += `

        <tr>

            <td>${movimiento.tipo}</td>

            <td>${movimiento.producto}</td>

            <td>${movimiento.cantidad}</td>

            <td>${movimiento.stock || 0}</td>

            <td>${movimiento.fecha}</td>

        </tr>

        `;

    });

}

export function actualizarResumen(){

    const totalProductos =
    document.getElementById("totalProductos");

    if(totalProductos){

        totalProductos.innerText =
        productos.length;

    }

    const cards =
    document.getElementById("cardsInventario");

    if(!cards) return;

    cards.innerHTML = "";

    productos.forEach(producto=>{

        let color = "#28a745";

        let estado = "✅ OK";

        if(producto.stock <= 5){

            color = "#ffc107";

            estado = "⚠️ BAJO";

        }

        if(producto.stock === 0){

            color = "#dc3545";

            estado = "⛔ AGOTADO";

        }

        if(producto.stock < 0){

            color = "#b00020";

            estado = "🚨 NEGATIVO";

        }

        cards.innerHTML += `

        <div class="card-producto">

            <h4>${producto.nombre}</h4>

            <p style="color:${color}">
                ${producto.stock}
            </p>

            <small
            style="
            color:${color};
            font-weight:bold;
            ">

            ${estado}

            </small>

        </div>

        `;

    });

}
