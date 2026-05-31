import { getClientes } from "./modules/clientes.js";

window.addEventListener(
    "DOMContentLoaded",
    () => {

        renderClientes();
    }
);

function renderClientes() {

    console.log(getClientes());
    
    const lista =
        document.getElementById(
            "listaClientes"
        );

    const clientes =
        getClientes();

    lista.innerHTML = "";

    clientes.forEach(cliente => {

        lista.innerHTML += `
            <div
                class="card-cliente"
                data-id="${cliente.id}"
            >
                <h3>${cliente.nombre}</h3>

                <p>
                    ${cliente.encargado}
                </p>

                <p>
                    ${cliente.telefono}
                </p>
            </div>
        `;
    });
        document
        .querySelectorAll(".card-cliente")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => abrirCliente(
                    card.dataset.id
                )
            );

        });
    }

function abrirCliente(id){

    const cliente =
        getClienteById(id);

    console.log(cliente);

}
