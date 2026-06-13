import LocalDB from "../../../core/storage/local-db.js";

export function renderClientes() {

    const container =
        document.getElementById(
            "listaClientes"
        );

    if(!container) return;

    const clientes =
        LocalDB.getClients();

    container.innerHTML = "";

    clientes.forEach(cliente => {

        let estado = "✅ OK";

        let color = "#28a745";

        if(cliente.saldo > 0){

            estado = "💰 PENDIENTE";

            color = "#dc3545";
        }

        container.innerHTML +=
            clienteCard(
                cliente,
                color,
                estado
            );

    });
}

function clienteCard(
    cliente,
    color,
    estado
){

    return `

    <div class="card-cliente">

        <h3>
            ${cliente.nombre}
        </h3>

        <p>
            📞 ${cliente.telefono || "-"}
        </p>

        <p>
            📍 ${cliente.direccion || "-"}
        </p>

        <small>
            ${estado}
        </small>

        <div class="acciones-cliente">

            <button
            onclick="
            openClienteModal('${cliente.id}')
            ">

                Abrir Cliente

            </button>

        </div>

    </div>

    `;
}
