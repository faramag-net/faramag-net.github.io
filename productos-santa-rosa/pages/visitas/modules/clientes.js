import LocalDB from "../../../core/storage/local-db.js";

import {
    renderClientes
}
from "./render.js";

import {
    showToast
}
from "../../../components/toast.js";

export function crearCliente() {

    const nombre =
        document.getElementById(
            "clienteNombre"
        ).value;

    const telefono =
        document.getElementById(
            "clienteTelefono"
        ).value;

    const direccion =
        document.getElementById(
            "clienteDireccion"
        ).value;
    
    const latitud =
    document.getElementById(
        "clienteLatitud"
    ).value;

    const longitud =
    document.getElementById(
        "clienteLongitud"
    ).value;

    if(!nombre){

        alert("Nombre requerido");

        return;
    }

    LocalDB.addClient({

    nombre,

    telefono,

    direccion,

    latitud,

    longitud,

    saldo:0,

    notas:""

    });
    renderClientes();

    document.getElementById(
    "clienteNombre"
    ).value = "";
    
    document.getElementById(
    "clienteTelefono"
    ).value = "";

    document.getElementById(
    "clienteDireccion"
    ).value = "";

    document.getElementById(
    "clienteNombre"
    ).focus();
    
    showToast("Cliente registrado");
}
