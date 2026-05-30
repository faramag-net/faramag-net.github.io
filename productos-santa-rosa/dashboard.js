import LocalDB from "./core/storage/local-db.js";

const metrics =
    LocalDB.getDashboardMetrics();

const ventas =
    LocalDB.getSales();

const productos =
    LocalDB.getProducts();

const movimientos =
    LocalDB.getHistory();

console.log(metrics);
console.log(ventas);
console.log(productos);
console.log(movimientos);

// KPI VENTAS
const totalVentas =
    metrics.totalSalesToday;

const totalProductos =
    metrics.totalProducts;


// KPI GANANCIA

const totalGanancia =
ventas.reduce(

    (acc, venta) =>

    acc + Number(venta.ganancia || 0),

0

);

// KPI PRODUCTOS


// KPI STOCK BAJO

const stockBajo =
    metrics.lowStockCount;

const stockNegativo =
    metrics.negativeStockCount;

//ultima venta
const ultimaVenta =
ventas[ventas.length - 1];

//Último movimiento
const ultimoMovimiento =
movimientos[movimientos.length - 1];

//Último producto
const ultimoProducto =
productos[productos.length - 1];

//--Render--

document
.getElementById("kpiVentas")
.innerText =
`$${totalVentas}`;

document
.getElementById("kpiGanancia")
.innerText =
`$${totalGanancia}`;

document
.getElementById("kpiProductos")
.innerText =
totalProductos;

document
.getElementById("kpiStock")
.innerText =
stockBajo;

document
.getElementById("actividadReciente")
.innerHTML = `

<div class="card">

    <h3>

        🧾 Última Venta

    </h3>

    <p>

        ${ultimaVenta?.producto || "Sin ventas"}

    </p>

</div>

<div class="card">

    <h3>

        📦 Último Movimiento

    </h3>

    <p>

        ${ultimoMovimiento?.tipo || "Sin movimientos"}

    </p>

</div>

<div class="card">

    <h3>

        ➕ Último Producto

    </h3>

    <p>

        ${ultimoProducto?.nombre || "Sin productos"}

    </p>

</div>

`;
