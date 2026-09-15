import LocalDB from "../../../core/storage/local-db.js";

export function registrarVisita(clienteId) {

    const nota =
        document.getElementById(
            "notaVisita"
        ).value;

    const pedido =
        document.getElementById(
            "pedidoVisita"
        ).value;

    LocalDB.addVisit({

        clienteId,

        nota,

        pedido,

        status: "pending",

        fecha:
            new Date().toISOString()

    });

    alert("Visita registrada");

}
