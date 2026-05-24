window.agregarProducto = agregarProducto;
window.eliminarProducto = eliminarProducto;
import {
    agregarInventario
}
from "./modules/entradas.js";

window.agregarInventario = agregarInventario;

import {
    agregarProducto,
    eliminarProducto
}
from "./modules/agregar-producto.js";

import {
    renderTabla,
    actualizarResumen
}
from "./modules/historial.js";

actualizarResumen();

renderTabla();
