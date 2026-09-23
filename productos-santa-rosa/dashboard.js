import LocalDB from "./core/storage/local-db.js";

const productos =
    LocalDB.getProducts();

const inventario =
    LocalDB.getCalculatedStock()

const ventas =
    LocalDB.getSales();

/* KPIs */

const totalProductos =
    productos.length;

const stockBajo =
productos.filter(producto => {

    const stock =
    LocalDB.getCalculatedStock(
        producto.id
    );

    return stock > 0 && stock < 5;

});

const totalVentas =
ventas.reduce(

    (acc, venta) =>

    acc + Number(
        venta.total || 0
    ),

0

);

const totalGanancia =
ventas.reduce(

    (acc, venta) =>

    acc + Number(
        venta.ganancia || 0
    ),

0

);

const valorInventario =
productos.reduce(

    (total, producto) => {

        const stock =
        LocalDB.getCalculatedStock(
            producto.id
        );

        return (
            total +
            stock *
            Number(producto.precio || 0)
        );

    },

0

);

const piezasInventario =
productos.reduce(

    (total, producto) =>

        total +
        LocalDB.getCalculatedStock(
            producto.id
        ),

    0

);

const piezasVendidas =
ventas.reduce(

    (total, venta) => {

        const piezas =
            venta.items?.reduce(

                (sum, item) =>

                    sum +
                    Number(
                        item.quantity || 0
                    ),

                0

            ) || 0;

        return total + piezas;

    },

0

);

const totalInsumos =
    LocalDB.getInsumos()
    .reduce(

        (total, insumo) =>

            total +
            Number(
                insumo.total || 0
            ),

        0

    );

/* RENDER */

document
.getElementById("kpiProductos")
.innerText =
totalProductos;

document
.getElementById("kpiStock")
.innerText =
stockBajo.length;

document
.getElementById("kpiVentas")
.innerText =
`$${totalVentas}`;

document
.getElementById("kpiGanancia")
.innerText =
`$${totalGanancia}`;

document
.getElementById("kpiInventario")
.innerText =
`$${valorInventario.toFixed(2)}`;

document
.getElementById("kpiPiezas")
.innerHTML =
`Inv: ${piezasInventario}<br>
Vend: ${piezasVendidas}`;

document
.getElementById("kpiInsumos")
.innerText =
`$${totalInsumos.toFixed(2)}`;


/* TOP 10 CLIENTES POR VENTAS */
const topClientesLista = document.getElementById("topClientesLista");
const topClientesPaginaInfo = document.getElementById("topClientesPaginaInfo");
const topClientesPagina = document.getElementById("topClientesPagina");
const topClientesAnterior = document.getElementById("topClientesAnterior");
const topClientesSiguiente = document.getElementById("topClientesSiguiente");

const clientesRoute = LocalDB.getRouteClients();
const ventasPorCliente = new Map();

ventas.forEach(venta => {
    const clienteId = venta.clienteId || null;
    const nombreDirecto = String(venta.cliente || "").trim();
    const cliente = clienteId
        ? clientesRoute.find(c => c.id === clienteId)
        : null;
    const nombre = (cliente?.nombre || nombreDirecto).trim();
    if (!nombre) return;

    const clave = clienteId || nombre.toLowerCase();
    const actual = ventasPorCliente.get(clave);
    ventasPorCliente.set(clave, {
        nombre: actual?.nombre || nombre,
        total: (actual?.total || 0) + Number(venta.total || 0)
    });
});

const topClientes = [...ventasPorCliente.values()]
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, "es", {sensitivity:"base"}));

const TOP_CLIENTES_POR_PAGINA = 10;
let paginaTopClientes = 1;
const totalPaginasTopClientes = Math.max(1, Math.ceil(topClientes.length / TOP_CLIENTES_POR_PAGINA));

function renderTopClientes(){
    if (!topClientesLista) return;

    paginaTopClientes = Math.min(paginaTopClientes, totalPaginasTopClientes);
    const inicio = (paginaTopClientes - 1) * TOP_CLIENTES_POR_PAGINA;
    const visibles = topClientes.slice(inicio, inicio + TOP_CLIENTES_POR_PAGINA);

    topClientesLista.innerHTML = visibles.length
        ? visibles.map((cliente, index) => `
            <div class="top-cliente-item">
                <span class="top-cliente-pos">${inicio + index + 1}.</span>
                <span class="top-cliente-nombre">${cliente.nombre}</span>
                <strong>$${cliente.total.toFixed(2)}</strong>
            </div>
        `).join("")
        : '<div class="top-clientes-vacio">Sin ventas registradas</div>';

    const hasta = Math.min(inicio + visibles.length, topClientes.length);
    topClientesPaginaInfo.textContent = topClientes.length ? `${inicio + 1}-${hasta}` : "0-0";
    topClientesPagina.textContent = `${paginaTopClientes} / ${totalPaginasTopClientes}`;
    topClientesAnterior.disabled = paginaTopClientes <= 1;
    topClientesSiguiente.disabled = paginaTopClientes >= totalPaginasTopClientes;
}

topClientesAnterior?.addEventListener("click", () => {
    if (paginaTopClientes > 1) {
        paginaTopClientes--;
        renderTopClientes();
    }
});

topClientesSiguiente?.addEventListener("click", () => {
    if (paginaTopClientes < totalPaginasTopClientes) {
        paginaTopClientes++;
        renderTopClientes();
    }
});

renderTopClientes();
