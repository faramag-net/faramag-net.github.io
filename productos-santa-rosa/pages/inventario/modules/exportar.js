import LocalDB from "../../../core/storage/local-db.js";

import {
    actualizarResumen,
    renderTabla
}
from "./historial.js";

export function exportarJSON(){

const datos = {

    productos:
        LocalDB.getProducts(),

    inventario:
        LocalDB.getInventory(),

    historial:
        LocalDB.getHistory(),

    ventas:
        LocalDB.getSales()

};

    const blob = new Blob(

        [JSON.stringify(datos,null,2)],

        {
            type:"application/json"
        }

    );

const a =
document.createElement("a");

const url =
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

a.href = url;

a.download =
"inventario_" + fecha + ".json";

a.click();

URL.revokeObjectURL(url);

}

export function importarJSON(event){

    const archivo =
    event.target.files[0];

    if(!archivo) return;

    const lector =
    new FileReader();

    lector.onload = function(e){

let datos = {};

try {

    datos =
    JSON.parse(e.target.result);

} catch(error){

    alert("JSON inválido");

    return;

}
        
        LocalDB.saveProducts(
            datos.productos || []
        );
        
        LocalDB.saveInventory(
            datos.inventario || []
        );
        
        LocalDB.mergeHistory(
            datos.historial || []
        );
        
        LocalDB.mergeSales(
            datos.ventas || []
        );
        
        LocalDB.mergeClients(
            datos.routeClients || []
        );   
       
        actualizarResumen();

        renderTabla();

        alert("Inventario importado");

        location.reload();

    };

    lector.readAsText(archivo);

}

export function cerrarInventario(){

    if(
        !confirm(
            "¿Borrar historial de inventario?"
        )
    ){
        return;
    }

    LocalDB.clearHistory();

    renderTabla();

    actualizarResumen();

    alert(
        "Historial eliminado"
    );

}
