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

    clienteId:
        nuevoProducto.clienteId,

    producto:
        nuevoProducto.producto,

    presentacion:
        nuevoProducto.presentacion,

    precio:
        nuevoProducto.precio

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


registrarHistorial({

    clienteId:
        productos[index].clienteId,

    producto:
        productos[index].producto,

    presentacion:
        productos[index].presentacion,

    precio:
        productos[index].precio

});


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

export function getResumenProducto(
    producto,
    presentacion
){

    const hace7Dias =
        new Date();

    hace7Dias.setDate(
        hace7Dias.getDate() - 7
    );

    const historial =
        LocalDB.getClientHistory()
            .filter(item =>
                item.producto === producto &&
                item.presentacion === presentacion &&
                new Date(item.fecha) >= hace7Dias
            );

    if(historial.length === 0){

        return null;

    }

    const precios =
        historial.map(
            h => Number(h.precio)
        );

    return {

        minimo:
            Math.min(...precios),

        maximo:
            Math.max(...precios),

        promedio:
            (
                precios.reduce(
                    (a,b) => a+b,
                    0
                ) /
                precios.length
            ).toFixed(2),

        observaciones:
            historial.length,

        historial

    };

}
