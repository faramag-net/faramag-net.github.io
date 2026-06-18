import LocalDB from "../../core/storage/local-db.js";

import {
    cargarLocal
}
from "./modules/storage.js";

import {
    agregarProducto,
}
from "./modules/agregar-producto.js";

import {
    agregarInventario,
    renderProductos,
    renderTablaProductos
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

window.LocalDB = LocalDB;

window.agregarProducto =
agregarProducto;

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

renderTablaProductos();

actualizarResumen();

renderTabla();

document
    .getElementById(
        "buscarHistorial"
    )
    ?.addEventListener(
        "input",
        renderTabla
    );

