import LocalDB
from "../../../core/storage/local-db.js";

export function exportarJSON(){

    const datos = {

        version:1,

        exportedAt:
            new Date()
            .toISOString(),

        routeClients:
            LocalDB.getRouteClients(),

        clientProducts:
            LocalDB.getClientProducts(),

        consignations:
            LocalDB.getConsignations(),

        visits:
            LocalDB.getVisits()

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

    a.href = url;

    a.download =
        "visitas.json";

    a.click();

    URL.revokeObjectURL(url);

}

export function importarJSON(event){

    const archivo =
        event.target.files[0];

    if(!archivo){
        return;
    }

    const lector =
        new FileReader();

    lector.onload =
        function(e){

            let datos = {};

            try{

                datos =
                    JSON.parse(
                        e.target.result
                    );

            }catch{

                alert(
                    "JSON inválido"
                );

                return;

            }

            LocalDB.mergeClients(
                datos.routeClients || []
            );

            LocalDB.mergeClientProducts(
                datos.clientProducts || []
            );

            LocalDB.mergeConsignations(
                datos.consignations || []
            );

            LocalDB.mergeVisits(
                datos.visits || []
            );

            alert(
                "Visitas importadas"
            );

            location.reload();

        };

    lector.readAsText(
        archivo
    );

}
