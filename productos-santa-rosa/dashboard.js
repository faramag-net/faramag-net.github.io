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
