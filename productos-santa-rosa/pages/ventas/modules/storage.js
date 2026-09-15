import LocalDB from "../../../core/storage/local-db.js";

export let productos = [];

export function guardarLocal() {

    LocalDB.saveProducts(productos);

}

export function cargarLocal() {

    productos =
        LocalDB.getProducts();
}
