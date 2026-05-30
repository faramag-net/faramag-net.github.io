import LocalDB from "../../core/storage/local-db.js";

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

window.actualizarSubtotal =
actualizarSubtotal;

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

// RENDER STOCK

function renderStock(){

    const contenedor =
    document.getElementById(
        "stockCards"
    );
    
    const productos =
        LocalDB.getProducts();
    
    const inventario = 
        LocalDB.getInventory();
    
    contenedor.innerHTML = "";

    productos.forEach(producto=>{

    const itemInventario =
        inventario.find(
            i => i.productId === producto.id
        );

    const stock =
        itemInventario?.stock || 0;

        let clase = "";
        let icono = "";

        if(stock <= 0){

            clase = "stock-rojo";
            icono = "🔴";

        }else if(stock < 5){

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

                ${stock}

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
