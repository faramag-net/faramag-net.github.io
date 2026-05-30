import LocalDB
from "./core/storage/local-db.js";

const productos =
    LocalDB.getProducts();

const inventario =
    LocalDB.getInventory();

const ventas =
    LocalDB.getSales();

console.log("Productos", productos);

console.log("Inventario", inventario);

console.log("Ventas", ventas);

const totalProductos =
    productos.length;

const stockBajo =
inventario.filter(
    item =>
        item.stock > 0 &&
        item.stock <= 5
);

const totalVentas =
ventas.reduce(

    (acc, venta) =>

    acc + Number(venta.total || 0),

0

);

const totalGanancia =
ventas.reduce(

    (acc, venta) =>

    acc + Number(venta.ganancia || 0),

0

);

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
