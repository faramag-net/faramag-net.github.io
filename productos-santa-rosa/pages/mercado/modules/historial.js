import LocalDB from "../../../core/storage/local-db.js";

export function registrarMovimiento(
    movimiento
){

    console.log(
        "ENTRO A registrarMovimiento"
    );

    console.log(
        movimiento
    );
    
    const historial =
        LocalDB.getMercadoHistory() || [];

    historial.push({

        id:
            crypto.randomUUID(),

        fecha:
            new Date()
                .toISOString(),

        ...movimiento

    });
    
console.log(
    "Antes de guardar"
);
    
    LocalDB.saveMercadoHistory(
        historial
    );

console.log(
    "Leído después de guardar:",
    LocalDB.getMercadoHistory()
);
    
}

export function getMovimientos(){

    return (
        LocalDB.getMercadoHistory()
        || []
    )
    .sort(
        (a,b) =>
            new Date(b.fecha) -
            new Date(a.fecha)
    );

}

export function eliminarHistorial(){

    LocalDB.saveMercadoHistory(
        []
    );

}

export function exportarHistorial(){

    const historial =
        getMovimientos();

    const blob =
        new Blob(

            [
                JSON.stringify(
                    historial,
                    null,
                    2
                )
            ],

            {
                type:
                    "application/json"
            }

        );

    const url =
        URL.createObjectURL(
            blob
        );

    const a =
        document.createElement(
            "a"
        );

    a.href =
        url;

    a.download =
        "historial-mercado.json";

    a.click();

    URL.revokeObjectURL(
        url
    );

}

export function importarHistorial(
    archivo
){

    const lector =
        new FileReader();

    lector.onload = e => {

        const datos =
            JSON.parse(
                e.target.result
            );

        LocalDB.saveMercadoHistory(
            datos
        );

        location.reload();

    };

    lector.readAsText(
        archivo
    );

}
