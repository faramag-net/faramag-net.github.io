import LocalDB from "../../../core/storage/local-db.js";

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caracter]);
}

export function renderClientes() {
    const container = document.getElementById("listaClientes");
    if (!container) return;

    let clientes = LocalDB.getRouteClients()
        .filter(cliente => cliente.tipo !== "prospecto");

    const textoBusqueda = document.getElementById("buscarCliente")?.value?.toLowerCase()?.trim() || "";
    const filtro = document.getElementById("filtroConsignacion")?.value || "todos";

    if (textoBusqueda) {
        clientes = clientes.filter(cliente => {
            const productosCliente = LocalDB.getProductsByClient(cliente.id);
            const productosTexto = productosCliente.map(p => {
                const producto = LocalDB.getProducts().find(prod => prod.id === p.productoId);
                return producto?.nombre || "";
            }).join(" ");

            const searchable = `
                ${cliente.nombre || ""}
                ${cliente.telefono || ""}
                ${cliente.direccion || ""}
                ${productosTexto}
            `.toLowerCase();

            return searchable.includes(textoBusqueda);
        });
    }

    if (filtro !== "todos") {
        clientes = clientes.filter(cliente => {
            const abierta = LocalDB.getActiveConsignation(cliente.id);
            if (filtro === "abierta") return !!abierta;
            if (filtro === "cerrada") return !abierta;
            return true;
        });
    }

    container.innerHTML = clientes.map(cliente => {
        const consignacionActiva = !!LocalDB.getActiveConsignation(cliente.id);
        const estado = consignacionActiva ? "🔴 Consignación" : "✅ OK";
        return clienteCard(cliente, estado);
    }).join("");
}

function getTotalVendidoCliente(cliente) {
    const ventas = LocalDB.getSales();
    return ventas.reduce((total, venta) => {
        const coincidePorId = venta.clienteId && String(venta.clienteId) === String(cliente.id);
        const nombreVenta = String(venta.cliente || "").trim().toLowerCase();
        const nombreCliente = String(cliente.nombre || "").trim().toLowerCase();
        const coincidePorNombre = !venta.clienteId && nombreVenta && nombreVenta === nombreCliente;
        return (coincidePorId || coincidePorNombre) ? total + Number(venta.total || 0) : total;
    }, 0);
}

function clienteCard(cliente, estado) {
    const totalVendido = getTotalVendidoCliente(cliente);
    const fechaRegistro = cliente.createdAt
        ? new Date(cliente.createdAt).toLocaleDateString("es-MX")
        : "No disponible";

    return `
        <article
            class="card-cliente"
            data-cliente-card-id="${escaparHTML(cliente.id)}"
            role="button"
            tabindex="0"
            aria-label="Abrir ficha de ${escaparHTML(cliente.nombre || "cliente")}"
        >
            <button
                type="button"
                class="btn-eliminar-cliente"
                data-eliminar-cliente-id="${escaparHTML(cliente.id)}"
                aria-label="Eliminar ${escaparHTML(cliente.nombre || "cliente")}"
                title="Eliminar cliente"
            >✕</button>

            <h3>${escaparHTML(cliente.nombre || "Sin nombre")}</h3>
            <p class="fecha-registro-cliente">📅 Registro: ${fechaRegistro}</p>
            <div class="cliente-resumen-venta">
                <span>💰 Vendido</span>
                <strong>$${totalVendido.toFixed(2)}</strong>
            </div>
            <small class="estado-cliente">${estado}</small>
        </article>
    `;
}
