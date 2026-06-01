import {
    
    getClientes,
    getClienteById,
    crearCliente,
    editarCliente,
    eliminarCliente
    
} from "../modules/clientes.js";

import {
    getProductosCliente
}
from "../modules/productos.js";

import {
    setAbrirCliente
}
from "./shared-ui.js";

import {
    nuevoProducto,
    editarProductoUI,
    eliminarProductoUI,
    mostrarResumenProducto
}
from "./productos-ui.js";

export function inicializarClientesUI(){
    setAbrirCliente(
    abrirCliente
    );
    
    document
        .getElementById(
            "btnNuevoCliente"
        )
        .addEventListener(
            "click",
            nuevoCliente
        );

    document
        .getElementById(
            "buscarCliente"
        )
        .addEventListener(
            "input",
            e =>
                renderClientes(
                    e.target.value
                )
        );

    renderClientes();
}

function renderClientes(filtro = "") {

    const lista =
        document.getElementById(
            "listaClientes"
        );

    const clientes =
        getClientes()
            .filter(cliente =>
                `
                    ${cliente.nombre || ""}
                    ${cliente.encargado || ""}
                    ${cliente.telefono || ""}
                    ${cliente.direccion || ""}
                `
                .toLowerCase()
                .includes(
                    filtro.toLowerCase()
                )
            );

    lista.innerHTML = "";

    clientes.forEach(cliente => {
        
    const productos =
        getProductosCliente(
            cliente.id
        );
        
        lista.innerHTML += `
            <div
                class="card-cliente"
                data-id="${cliente.id}"
            >

                <div class="cliente-header">

                    <span class="expand-icon">
                        ▶
                    </span>

                    <div>
                    
                        <h3 class="cliente-nombre">
                            ${cliente.nombre}
                        </h3>
                    
                        <p class="cliente-encargado">
                            ${cliente.encargado || ""}
                        </p>
                    
                    </div>

                </div>

            <div class="cliente-body">
            
                <p>
                    Teléfono:
                    ${cliente.telefono || ""}
                </p>
            
                <p>
                    Dirección:
                    ${cliente.direccion || ""}
                </p>
            
                <p>
                    Comentarios:
                    ${cliente.comentarios || "Sin comentarios"}
                </p>
            
                <div class="cliente-productos">
            
                    <h4>
                        Productos
                    </h4>
            
                    ${
                        productos.length
                            ? productos.map(producto => `
                                <div class="producto-mini">
            
                                    <strong>
                                        ${producto.producto}
                                    </strong>
            
                                    <span>
                                        ${producto.presentacion}
                                    </span>
            
                                </div>
                            `).join("")
                            : `
                                <p>
                                    Sin productos registrados
                                </p>
                            `
                    }
            
                </div>
            
            </div>

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
        .querySelectorAll(".cliente-header")
        .forEach(header => {

            header.addEventListener(
                "click",
                (e) => {

                    e.stopPropagation();

                    const card =
                        header.closest(
                            ".card-cliente"
                        );

                    card.classList.toggle(
                        "expanded"
                    );

                    const icono =
                        header.querySelector(
                            ".expand-icon"
                        );

                    icono.textContent =
                        card.classList.contains(
                            "expanded"
                        )
                            ? "▼"
                            : "▶";

                }
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

        <h3>Detalle del Cliente</h3>
        
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

            <button id="btnEditarCliente">
                Editar Cliente
            </button>

            <button id="btnEliminarCliente">
                Eliminar Cliente
            </button>

<div id="productosCliente">

    ${
        productos.map(producto => `
        
            <div
                class="producto-card"
                data-producto="${producto.producto}"
                data-presentacion="${producto.presentacion}"
            >
            
                <strong>
                    ${producto.producto}
                </strong>

                <p>
                    ${producto.presentacion}
                </p>

                <p>
                    $${producto.precio}
                </p>

                   <button
                    class="btnEditarProducto"
                    data-id="${producto.id}"
                >
                    Editar
                </button>
            
                <button
                    class="btnEliminarProducto"
                    data-id="${producto.id}"
                >
                    Eliminar
                </button>

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

            document
            .getElementById(
                "btnEditarCliente"
            )
            .addEventListener(
                "click",
                () => editarClienteUI(id)
            );
        
        document
            .getElementById(
                "btnEliminarCliente"
            )
            .addEventListener(
                "click",
                () => eliminarClienteUI(id)
            );
    
        document
            .querySelectorAll(
                ".btnEditarProducto"
            )
            .forEach(btn => {
        
                btn.addEventListener(
                    "click",
                    () =>
                        editarProductoUI(
                            btn.dataset.id,
                            id
                        )
                );
        
            });
        
        document
            .querySelectorAll(
                ".btnEliminarProducto"
            )
            .forEach(btn => {
        
                btn.addEventListener(
                    "click",
                    () =>
                        eliminarProductoUI(
                            btn.dataset.id,
                            id
                        )
                );
        
            });

            document
                .querySelectorAll(
                    ".producto-card"
                )
                .forEach(card => {
            
                    card.addEventListener(
                        "click",
                        () =>
                            mostrarResumenProducto(
                                card.dataset.producto,
                                card.dataset.presentacion
                            )
                    );
            
                });
    
}

function nuevoCliente(){

    const nombre =
        prompt("Nombre cliente");

    if(!nombre) return;

    const encargado =
        prompt("Encargado");

    const telefono =
        prompt("Teléfono");

    const direccion =
        prompt("Dirección");

    crearCliente({
        nombre,
        encargado,
        telefono,
        direccion
    });
    
    renderClientes();
        
}

function editarClienteUI(id){

    const cliente =
        getClienteById(id);

    const nombre =
        prompt(
            "Nombre",
            cliente.nombre
        );

    if(!nombre) return;

    const encargado =
        prompt(
            "Encargado",
            cliente.encargado || ""
        );

    const telefono =
        prompt(
            "Teléfono",
            cliente.telefono || ""
        );

    const direccion =
        prompt(
            "Dirección",
            cliente.direccion || ""
        );

    editarCliente(
        id,
        {
            nombre,
            encargado,
            telefono,
            direccion
        }
    );

    renderClientes();

    abrirCliente(id);
}

function eliminarClienteUI(id){

    const confirmar =
        confirm(
            "¿Eliminar cliente?"
        );

    if(!confirmar) return;

    eliminarCliente(id);

    document
        .getElementById(
            "detalleCliente"
        )
        .innerHTML = "";

    renderClientes();
}

export {
    renderClientes,
    abrirCliente
};
