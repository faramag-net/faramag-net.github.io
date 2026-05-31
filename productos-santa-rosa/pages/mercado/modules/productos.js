import LocalDB from "../../../core/storage/local-db.js";

export function getProductosCliente(clienteId) {

    return LocalDB
        .getClientProducts()
        .filter(
            producto =>
                producto.clienteId === clienteId
        );
}

export function getProductoById(id) {

    return LocalDB
        .getClientProducts()
        .find(
            producto =>
                producto.id === id
        );
}

export function agregarProducto(data) {

    const productos =
        LocalDB.getClientProducts();

    const nuevoProducto = {

        id: crypto.randomUUID(),

        clienteId: data.clienteId,

        producto: data.producto,

        presentacion:
            data.presentacion || "",

        precio:
            Number(data.precio) || 0,

        comentarios:
            data.comentarios || "",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };

    productos.push(
        nuevoProducto
    );

    LocalDB.saveClientProducts(
        productos
    );

    registrarHistorial({

    clienteId,

    producto,

    presentacion,

    precio

});

    return nuevoProducto;
}

export function editarProducto(
    id,
    cambios
) {

    const productos =
        LocalDB.getClientProducts();

    const index =
        productos.findIndex(
            p => p.id === id
        );

    if (index === -1) return null;

    productos[index] = {
        ...productos[index],
        ...cambios,
        updatedAt:
            new Date().toISOString()
    };

    LocalDB.saveClientProducts(
        productos
    );

    return productos[index];
}

export function eliminarProducto(id) {

    const productos =
        LocalDB.getClientProducts();

    const nuevosProductos =
        productos.filter(
            p => p.id !== id
        );

    LocalDB.saveClientProducts(
        nuevosProductos
    );
}

export function registrarHistorial(data){

    const historial =
        LocalDB.getClientHistory();

    historial.push({

        id: crypto.randomUUID(),

        clienteId:
            data.clienteId,

        producto:
            data.producto,

        presentacion:
            data.presentacion,

        precio:
            Number(data.precio),

        fecha:
            new Date()
                .toISOString()

    });

    LocalDB.saveClientHistory(
        historial
    );
}
