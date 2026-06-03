import LocalDB from "../../../core/storage/local-db.js";

export function registrarMovimiento(
    movimiento
){

    console.log(
    "Movimiento registrado",
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

    LocalDB.saveMercadoHistory(
        historial
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


