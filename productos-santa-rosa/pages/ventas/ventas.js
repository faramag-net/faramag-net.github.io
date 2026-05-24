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

cargarProductos();

actualizarSubtotal();

renderTablaVentas();

actualizarKPIs();
