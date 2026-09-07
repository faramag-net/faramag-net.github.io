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
    renderTablaProductos,
    actualizarCostoMovimiento
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

LocalDB.recuperarProductosHistoricos();

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

document.getElementById("productoInventario")?.addEventListener("change", actualizarCostoMovimiento);

document
    .getElementById(
        "buscarHistorial"
    )
    ?.addEventListener(
        "input",
        renderTabla
    );

