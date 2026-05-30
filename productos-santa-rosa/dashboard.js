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
