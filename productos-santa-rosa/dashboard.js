import LocalDB from "./core/storage/local-db.js";

const productos =
    LocalDB.getProducts();

const inventario =
    LocalDB.getInventory();

const ventas =
    LocalDB.getSales();

/* KPIs */

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

        const item =
        inventario.find(
            i => i.productId === producto.id
        );

        const stock =
        Number(item?.stock || 0);

        const precio =
        Number(producto.precio || 0);

        return total + (stock * precio);

    },

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
