import {
    getClientes,
    getClienteById,
    crearCliente
} from "./modules/clientes.js";

            console.log("mercado.js cargado");

window.addEventListener(
    "DOMContentLoaded",
    () => {

           console.log("DOM cargado");
        
        renderClientes();
    }
);

function renderClientes() {
    
     console.log("renderClientes ejecutado");
    
    console.log(getClientes());
    
    const lista =
        document.getElementById(
            "listaClientes"
        );
                console.log(lista);
    
    const clientes =
        getClientes();

    lista.innerHTML = "";

    clientes.forEach(cliente => {
        
console.log(cliente);
        
lista.innerHTML += `
    <div
        class="card-cliente"
        data-id="${cliente.id}"
    >
        <h3>${cliente.nombre}</h3>

        <p>
            ${cliente.encargado || ""}
        </p>

        <p>
            ${cliente.telefono || ""}
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
    
    document
    .getElementById(
        "btnNuevoCliente"
    )
    .addEventListener(
        "click",
        nuevoCliente
    );
    
    }

function abrirCliente(id){

    const cliente =
        getClienteById(id);

    console.log(cliente);

}

function nuevoCliente(){

    const nombre =
        prompt(
            "Nombre cliente"
        );

    if(!nombre) return;

    crearCliente({
        nombre
    });

    renderClientes();
}
