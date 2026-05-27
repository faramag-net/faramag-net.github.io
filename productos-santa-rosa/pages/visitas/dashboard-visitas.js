import LocalDB from "../../core/storage/local-db.js";

export function renderDashboardVisitas(){

    const clientes =
        LocalDB.getClients();

    const visitas =
        LocalDB.getVisits();

    const pendientes =
        clientes.filter(
            cliente =>
                cliente.saldo > 0
        );

    const visitasPendientes =
        visitas.filter(
            visita =>
                visita.status === "pending"
        );

    document.getElementById(
        "clientesPendientes"
    ).innerText =
        pendientes.length;

    document.getElementById(
        "visitasPendientes"
    ).innerText =
        visitasPendientes.length;
}
