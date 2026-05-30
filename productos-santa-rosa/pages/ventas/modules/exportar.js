import LocalDB from "../../../core/storage/local-db.js";

import {
    actualizarKPIs,
    renderTablaVentas
}
from "./historial.js";

import {
    renderComanda
}
from "./comandas.js";

export function exportarVentas(){

    const datos = {

    ventas: LocalDB.getSales(),

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
    "ventas_" + fecha + ".json";

    a.click();

}

export function importarVentas(event){

    const archivo =
    event.target.files[0];

    if(!archivo) return;

    const lector =
    new FileReader();

    lector.onload = function(e){

        const datos =
        JSON.parse(e.target.result);

        LocalDB.saveSales(
            datos.ventas || []
        );

        guardarVentas();

        renderTablaVentas();

        actualizarKPIs();

        renderComanda();

        alert("Ventas importadas");

    };

    lector.readAsText(archivo);

}

export function cerrarCorte(){

    if(
        !confirm(
            "¿Cerrar corte y borrar ventas?"
        )
    ){

        return;

    }

    LocalDB.saveSales([]);

    renderTablaVentas();

    actualizarKPIs();

    renderComanda();

    alert("Corte cerrado");

}
