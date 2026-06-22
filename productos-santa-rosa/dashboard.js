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

    return stock > 0 && stock <= 5;

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
