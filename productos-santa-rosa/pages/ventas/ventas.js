import {
    cargarProductos,
    actualizarProducto,
    actualizarSubtotal,
    cambiarCantidad,
    registrarVenta
}

from "./modules/registrar-venta.js";

window.actualizarProducto =
actualizarProducto;

window.cambiarCantidad =
cambiarCantidad;

window.registrarVenta =
registrarVenta;

import {
    renderTablaVentas,
    actualizarKPIs
}

from "./modules/historial.js";

import {

    agregarComanda,
    renderComanda,
    eliminarComanda,
    registrarComanda

}
from "./modules/comandas.js";

window.agregarComanda =
agregarComanda;

window.eliminarComanda =
eliminarComanda;

window.registrarComanda =
registrarComanda;

// INVENTARIO

const inventarioData =
JSON.parse(

    localStorage.getItem(
        "inventarioSantaRosa"
    )

) || {};

const productos =
inventarioData.productos || [];

// RENDER STOCK

function renderStock(){

    const contenedor =
    document.getElementById(
        "stockCards"
    );

    contenedor.innerHTML = "";

    productos.forEach(producto=>{

        let clase = "";
        let icono = "";

        if(producto.stock <= 0){

            clase = "stock-rojo";
            icono = "🔴";

        }else if(producto.stock < 5){

            clase = "stock-amarillo";
            icono = "🟡";

        }else{

            clase = "stock-verde";
            icono = "🟢";

        }

        contenedor.innerHTML += `

        <div class="stock-card ${clase}">

            <span>

                ${icono}
                ${producto.nombre}

            </span>

            <span>

                ${producto.stock}

            </span>

        </div>

        `;

    });

}

renderStock();

cargarProductos();

actualizarSubtotal();

renderTablaVentas();

actualizarKPIs();
