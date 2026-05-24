import {
    productos,
    movimientos,
    guardarLocal
}
from "./storage.js";

import {
    actualizarResumen,
    renderTabla
}
from "./historial.js";

export function exportarJSON(){

    const datos = {

        productos,
        movimientos

    };

    const blob = new Blob(

        [JSON.stringify(datos,null,2)],

        {
            type:"application/json"
        }

    );

    const a =
    document.createElement("a");

    a.href =
    URL.createObjectURL(blob);

    const hoy =
    new Date();

    const fecha =

        hoy.getFullYear() + "-" +

        String(
            hoy.getMonth()+1
        ).padStart(2,"0")

        + "-" +

        String(
            hoy.getDate()
        ).padStart(2,"0");

    a.download =
    "inventario_" + fecha + ".json";

    a.click();

}

export function importarJSON(event){

    const archivo =
    event.target.files[0];

    if(!archivo) return;

    const lector =
    new FileReader();

    lector.onload = function(e){

        const datos =
        JSON.parse(e.target.result);

        productos.length = 0;
        movimientos.length = 0;

        productos.push(
            ...(datos.productos || [])
        );

        movimientos.push(
            ...(datos.movimientos || [])
        );

        guardarLocal();

        actualizarResumen();

        renderTabla();

        alert("Inventario importado");

    };

    lector.readAsText(archivo);

}

export function cerrarInventario(){

    if(
        !confirm(
            "¿Borrar historial inventario?"
        )
    ){

        return;

    }

    movimientos.length = 0;

    guardarLocal();

    renderTabla();

    actualizarResumen();

    alert("Historial eliminado");

}
