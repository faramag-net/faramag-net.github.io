import LocalDB from "../../core/storage/local-db.js";

export function renderDashboardVisitas(){

    const metrics =
        LocalDB.getDashboardMetrics();

    document.getElementById(
        "montoVendido"
    ).innerText =
        `$${metrics.totalSalesToday.toFixed(2)}`;

    document.getElementById(
        "visitasPendientes"
    ).innerText =
        metrics.pendingVisits;

}
