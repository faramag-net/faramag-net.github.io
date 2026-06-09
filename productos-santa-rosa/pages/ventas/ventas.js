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

window.actualizarSubtotal =
actualizarSubtotal;

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

import {
    exportarVentas,
    importarVentas,
    cerrarCorte
}
from "./modules/exportar.js";

window.exportarVentas =
exportarVentas;

window.importarVentas =
importarVentas;

window.cerrarCorte =
cerrarCorte;

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
        LocalDB.getCalculatedStock(
            producto.id
        );

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
            
                    <strong>
                        ${stock}
                    </strong>
            
                    <span class="stock-nombre">
                        ${producto.nombre}
                    </span>
            
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
