import LocalDB from "../../core/storage/local-db.js";

export function renderDashboardVisitas(){

    const metrics =
        LocalDB.getDashboardMetrics();

    const monto = document.getElementById("montoVendido");
    const visitas = document.getElementById("visitasPendientes");
    if (monto) monto.innerText = `$${metrics.totalSalesToday.toFixed(2)}`;
    if (visitas) visitas.innerText = metrics.pendingVisits;

}
