import LocalDB from "../../../core/storage/local-db.js";

import {
    registrarMovimiento
}
from "./historial.js";

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

    registrarMovimiento({

    tipo:"+C",

    cliente:
        nuevoCliente.nombre,

    encargado:
        nuevoCliente.encargado,

    telefono:
        nuevoCliente.telefono,

    producto:"*",

    presentacion:"*",

    precio:"*",

    direccion:
        nuevoCliente.direccion,

    comentarios:
        nuevoCliente.comentarios

});
    
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

    registrarMovimiento({

registrarMovimiento({

    tipo:"✎C",

    cliente:
        clientes[index].nombre,

    encargado:
        clientes[index].encargado,

    telefono:
        clientes[index].telefono,

    producto:"*",

    presentacion:"*",

    precio:"*",

    direccion:
        clientes[index].direccion,

    comentarios:
        clientes[index].comentarios

});

    return clientes[index];
}

export function eliminarCliente(id) {

    const clientes =
        LocalDB.getClients();

    const cliente =
        clientes.find(
            c => c.id === id
        );

    if(!cliente) return;

    registrarMovimiento({

    tipo:"-C",

    cliente:
        cliente.nombre,

    encargado:
        cliente.encargado,

    telefono:
        cliente.telefono,

    producto:"*",

    presentacion:"*",

    precio:"*",

    direccion:
        cliente.direccion,

    comentarios:
        cliente.comentarios


    });

    const nuevosClientes =
        clientes.filter(
            c => c.id !== id
        );

    LocalDB.saveClients(
        nuevosClientes
    );

}
