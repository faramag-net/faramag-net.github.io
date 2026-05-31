import LocalDB from "../../../core/storage/local-db.js";

export function getClientes() {
    return LocalDB.getClients();
}

export function getClienteById(id) {
    return LocalDB
        .getClients()
        .find(cliente => cliente.id === id);
}

export function crearCliente(data) {

    const clientes = LocalDB.getClients();

    const nuevoCliente = {
        id: crypto.randomUUID(),

        nombre: data.nombre,

        encargado: data.encargado || "",

        telefono: data.telefono || "",

        direccion: data.direccion || "",

        latitud: data.latitud || null,
        
        longitud: data.longitud || null,
        
        comentarios: data.comentarios || "",

        estatus: "activo",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };

    clientes.push(nuevoCliente);

    LocalDB.saveClients(clientes);

    return nuevoCliente;
}

export function editarCliente(id, cambios) {

    const clientes = LocalDB.getClients();

    const index = clientes.findIndex(
        c => c.id === id
    );

    if (index === -1) return null;

    clientes[index] = {
        ...clientes[index],
        ...cambios,
        updatedAt: new Date().toISOString()
    };

    LocalDB.saveClients(clientes);

    return clientes[index];
}

export function eliminarCliente(id) {

    const clientes = LocalDB.getClients();

    const nuevosClientes =
        clientes.filter(c => c.id !== id);

    LocalDB.saveClients(nuevosClientes);
}
