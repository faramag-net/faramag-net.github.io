import LocalDB from "../../core/storage/local-db.js";

import {
    cargarProductos,
    actualizarProducto,
    actualizarSubtotal,
    cambiarCantidad,
    registrarVenta,
    renderProductosVenta
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

// Recuperar productos antiguos referenciados por históricos/consignaciones.
LocalDB.recuperarProductosHistoricos();

// RENDER STOCK

function renderStock(){

    const contenedor =
    document.getElementById(
        "stockCards"
    );
    
    const texto = (document.getElementById("buscarStock")?.value || "")
        .trim().toLowerCase();
    const categoria = document.getElementById("filtroStock")?.value || "todos";

    const productos = [...LocalDB.getProducts()]
        .filter(p => {
            const nombre = (p.nombre || "").toLowerCase();
            const cat = (p.categoria || "historico").toLowerCase();
            return (!texto || nombre.includes(texto)) &&
                   (categoria === "todos" || cat === categoria);
        })
        .sort((a,b) => (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" }));
    
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

["buscarStock", "filtroStock", "buscarProductoVenta", "filtroProductoVenta"]
    .forEach(id => {
        document.getElementById(id)?.addEventListener("input", () => {
            if(id === "buscarProductoVenta" || id === "filtroProductoVenta") {
                renderProductosVenta();
            } else {
                renderStock();
            }
        });
        document.getElementById(id)?.addEventListener("change", () => {
            if(id === "buscarProductoVenta" || id === "filtroProductoVenta") {
                renderProductosVenta();
            } else {
                renderStock();
            }
        });
    });

document
    .getElementById(
        "buscarVentas"
    )
    ?.addEventListener(
        "input",
        renderTablaVentas
    );
