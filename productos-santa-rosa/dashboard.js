// INVENTARIO

const inventarioData =
JSON.parse(

    localStorage.getItem(
        "inventarioSantaRosa"
    )

) || {};

const productos =
inventarioData.productos || [];

const movimientos =
inventarioData.movimientos || [];

// VENTAS

const ventasData =
JSON.parse(

    localStorage.getItem(
        "ventasSantaRosa"
    )

) || {};

const ventas =
ventasData.ventas || [];

// KPI VENTAS

const totalVentas =
ventas.reduce(

    (acc, venta) =>

    acc + Number(venta.subtotal || 0),

0

);

// KPI GANANCIA

const totalGanancia =
ventas.reduce(

    (acc, venta) =>

    acc + Number(venta.ganancia || 0),

0

);

// KPI PRODUCTOS

const totalProductos =
productos.length;

// KPI STOCK BAJO

const stockBajo =
productos.filter(

    producto =>

    Number(producto.stock) <= 5

).length;

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
