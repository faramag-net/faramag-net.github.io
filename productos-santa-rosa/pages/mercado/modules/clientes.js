import LocalDB from "../../../core/storage/local-db.js";

export function getClientes() {
    return LocalDB.getClients();
}

export function crearCliente(data) {

    const clientes = LocalDB.getClients();

    const nuevoCliente = {
        id: crypto.randomUUID(),

        nombre: data.nombre,

        encargado: data.encargado || "",

        telefono: data.telefono || "",

        direccion: data.direccion || "",

        latitud: "",

        longitud: "",

        comentarios: "",

        estatus: "activo",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };

    clientes.push(nuevoCliente);

    LocalDB.saveClients(clientes);

    return nuevoCliente;
}
