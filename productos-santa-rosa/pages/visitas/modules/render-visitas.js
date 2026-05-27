import LocalDB from "../../../core/storage/local-db.js";

export function renderVisitas(clienteId) {

    const container =
        document.getElementById(
            "listaVisitas"
        );

    if(!container) return;

    const visitas =
        LocalDB.getVisits();

    const filtradas =
        visitas.filter(
            visita =>
                visita.clienteId === clienteId
        );

    container.innerHTML = "";

    filtradas.forEach(visita => {

        container.innerHTML += `

        <div class="card-visita">

            <p>
                📅 ${visita.fecha || "-"}
            </p>

            <p>
                📝 ${visita.nota || "-"}
            </p>

            <p>
                📦 ${visita.pedido || "-"}
            </p>

            <small>
                ${visita.status}
            </small>

        </div>

        `;
    });
}
