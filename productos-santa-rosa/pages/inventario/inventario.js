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

import {
    exportarJSON,
    importarJSON,
    cerrarInventario
}
from "./modules/exportar.js";

window.exportarJSON = exportarJSON;

window.importarJSON = importarJSON;

window.cerrarInventario = cerrarInventario;    

actualizarResumen();

renderTabla();
