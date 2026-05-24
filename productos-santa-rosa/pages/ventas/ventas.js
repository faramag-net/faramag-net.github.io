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

cargarProductos();

actualizarSubtotal();

renderTablaVentas();

actualizarKPIs();
