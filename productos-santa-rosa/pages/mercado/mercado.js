import {
    getClientes,
    getClienteById,
    crearCliente
} from "./modules/clientes.js";

import {
    getProductosCliente,
    agregarProducto
} from "./modules/productos.js";

            console.log("mercado.js cargado");

window.addEventListener(
    "DOMContentLoaded",
    () => {

           console.log("DOM cargado");

            document
    .getElementById(
        "btnNuevoCliente"
    )
    .addEventListener(
        "click",
        nuevoCliente
    );
    
        renderClientes();
    }
);

function renderClientes() {
       
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
    

    }

function abrirCliente(id){

    const cliente =
        getClienteById(id);

    const detalle =
        document.getElementById(
            "detalleCliente"
        );
    
    const productos =
        getProductosCliente(id);
    
    detalle.innerHTML = `
    
        <div class="cliente-detalle">

            <h2>${cliente.nombre}</h2>

            <p>
                Encargado:
                ${cliente.encargado || ""}
            </p>

            <p>
                Teléfono:
                ${cliente.telefono || ""}
            </p>

            <p>
                Dirección:
                ${cliente.direccion || ""}
            </p>

            <button
                id="btnAgregarProducto"
            >
                Agregar Producto
            </button>

<div id="productosCliente">

    ${
        productos.map(producto => `
            <div class="producto-card">

                <strong>
                    ${producto.producto}
                </strong>

                <p>
                    ${producto.presentacion}
                </p>

                <p>
                    $${producto.precio}
                </p>

            </div>
        `).join("")
    }

</div>

        </div>
    `;

        document
        .getElementById(
            "btnAgregarProducto"
        )
        .addEventListener(
            "click",
            () => nuevoProducto(id)
        );
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

function nuevoProducto(clienteId){

    const producto =
        prompt("Producto");

    if(!producto) return;

    const presentacion =
        prompt("Presentación");

    const precio =
        prompt("Precio");

    agregarProducto({

        clienteId,

        producto,

        presentacion,

        precio

    });

    abrirCliente(clienteId);
}
