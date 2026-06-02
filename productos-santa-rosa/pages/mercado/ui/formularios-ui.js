export function mostrarFormularioCliente(
    onGuardar
){

    const modal =
        document.getElementById(
            "modalContainer"
        );

    modal.innerHTML = `

        <div class="modal-overlay">

            <div class="modal">

                <h3>
                    Nuevo Cliente
                </h3>

                <input
                    id="nombreCliente"
                    placeholder="Nombre"
                >

                <input
                    id="encargadoCliente"
                    placeholder="Encargado"
                >

                <input
                    id="telefonoCliente"
                    placeholder="Teléfono"
                >

                <input
                    id="direccionCliente"
                    placeholder="Dirección"
                >

                <div class="modal-actions">

                    <button id="guardarCliente">
                        Guardar
                    </button>

                    <button id="cancelarCliente">
                        Cancelar
                    </button>

                </div>

            </div>

        </div>

    `;

    document
        .getElementById(
            "cancelarCliente"
        )
        .onclick = () =>
            modal.innerHTML = "";

    document
        .getElementById(
            "guardarCliente"
        )
        .onclick = () => {

            onGuardar({

                nombre:
                    document.getElementById(
                        "nombreCliente"
                    ).value,

                encargado:
                    document.getElementById(
                        "encargadoCliente"
                    ).value,

                telefono:
                    document.getElementById(
                        "telefonoCliente"
                    ).value,

                direccion:
                    document.getElementById(
                        "direccionCliente"
                    ).value

            });

            modal.innerHTML = "";

        };

}
