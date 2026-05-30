import LocalDB from "./core/storage/local-db.js";

const productos =
    LocalDB.getProducts();

const inventario =
    LocalDB.getInventory();

const ventas =
    LocalDB.getSales();

// PRODUCTOS

const totalProductos =
    productos.length;

// STOCK BAJO

const stockBajo =
inventario.filter(
    item =>
        item.stock > 0 &&
        item.stock <= 5
);

// VENTAS

const totalVentas =
ventas.reduce(

    (acc, venta) =>

    acc + Number(
        venta.total || 0
    ),

0

);

// GANANCIA

const totalGanancia =
ventas.reduce(

    (acc, venta) =>

    acc + Number(
        venta.ganancia || 0
    ),

0

);

// RENDER

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
