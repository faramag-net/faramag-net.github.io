import LocalDB from "../../core/storage/local-db.js";

import {
    cargarLocal
}
from "./modules/storage.js";

import {
    agregarProducto,
    eliminarProducto
}
from "./modules/agregar-producto.js";

import {
    agregarInventario,
    renderProductos
}
from "./modules/entradas.js";

import {
    actualizarResumen,
    renderTabla
}
from "./modules/historial.js";

import {
    exportarJSON,
    importarJSON,
    cerrarInventario
}
from "./modules/exportar.js";

window.agregarProducto =
agregarProducto;

window.eliminarProducto =
eliminarProducto;

window.agregarInventario =
agregarInventario;

window.exportarJSON =
exportarJSON;

window.importarJSON =
importarJSON;

window.cerrarInventario =
cerrarInventario;

cargarLocal();

renderProductos();

actualizarResumen();

renderTabla();
