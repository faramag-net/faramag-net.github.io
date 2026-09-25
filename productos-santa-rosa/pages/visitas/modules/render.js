import LocalDB from "../../../core/storage/local-db.js";

export function renderClientes() {

const container =
    document.getElementById(
        "listaClientes"
    );

if(!container) return;

let clientes =
    LocalDB.getRouteClients()
        .filter(cliente => cliente.tipo !== "prospecto");

const textoBusqueda =
    document
        .getElementById(
            "buscarCliente"
        )
        ?.value
        ?.toLowerCase()
        ?.trim() || "";

const filtro =
    document
        .getElementById(
            "filtroConsignacion"
        )
        ?.value || "todos";

if(textoBusqueda){

    clientes =
        clientes.filter(cliente => {

            const productosCliente =
                LocalDB.getProductsByClient(
                    cliente.id
                );

            const productosTexto =
                productosCliente
                .map(p => {

                    const producto =
                        LocalDB
                        .getProducts()
                        .find(
                            prod =>
                                prod.id ===
                                p.productoId
                        );

                    return producto?.nombre || "";

                })
                .join(" ");

            const searchable = `
                ${cliente.nombre || ""}
                ${cliente.telefono || ""}
                ${cliente.direccion || ""}
                ${productosTexto}
            `.toLowerCase();

            return searchable.includes(
                textoBusqueda
            );

        });

}

if(filtro !== "todos"){

    clientes =
        clientes.filter(cliente => {

            const abierta =
                LocalDB.getActiveConsignation(
                    cliente.id
                );

            if(filtro === "abierta"){
                return !!abierta;
            }

            if(filtro === "cerrada"){
                return !abierta;
            }

            return true;

        });

}   
    
    container.innerHTML = "";

    clientes.forEach(cliente => {

let estado = "✅ OK";

let color = "#28a745";

if(
LocalDB.getActiveConsignation(
cliente.id
)
){

estado =
    "🔴 Consignación Activa";

color =
    "#dc3545";

}

        container.innerHTML +=
            clienteCard(
                cliente,
                color,
                estado
            );

    });
}

function getTotalVendidoCliente(cliente){
    const ventas = LocalDB.getSales();
    return ventas.reduce((total, venta) => {
        const coincidePorId = venta.clienteId && venta.clienteId === cliente.id;
        const nombreVenta = String(venta.cliente || "").trim().toLowerCase();
        const nombreCliente = String(cliente.nombre || "").trim().toLowerCase();
        const coincidePorNombre = !venta.clienteId && nombreVenta && nombreVenta === nombreCliente;
        return (coincidePorId || coincidePorNombre)
            ? total + Number(venta.total || 0)
            : total;
    }, 0);
}

function clienteCard(
    cliente,
    color,
    estado
){

    const totalVendido = getTotalVendidoCliente(cliente);

    return `


<div class="card-cliente">

    <button
        class="btn-eliminar-cliente"
        onclick="
            eliminarClienteConfirm(
                '${cliente.id}'
            )
        "
    >
        ✕
    </button>

    <h3>
        ${cliente.nombre}
    </h3>

        <p>
            📞 ${cliente.telefono || "-"}
        </p>

        <p class="direccion">
            📍 ${cliente.direccion || "-"}
        </p>

        <div class="cliente-resumen-venta">
            💰 Vendido: <strong>$${totalVendido.toFixed(2)}</strong>
        </div>

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
