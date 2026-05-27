import LocalDB from "../../../core/storage/local-db.js";

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

    if(!nombre){

        alert("Nombre requerido");

        return;
    }

    LocalDB.addClient({

        nombre,
        telefono,
        direccion,
        saldo: 0,
        notas: ""

    });

    alert("Cliente registrado");

}
