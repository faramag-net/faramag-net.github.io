import LocalDB from "../../../core/storage/local-db.js";

export let productos = [];

export let movimientos = [];

export function guardarLocal() {

    LocalDB.saveProducts(productos);

    LocalDB.saveMovements(movimientos);
}

export function cargarLocal() {

    productos =
        LocalDB.getProducts();

    movimientos =
        LocalDB.getMovements();
}
