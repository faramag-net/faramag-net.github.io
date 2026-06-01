import {
    
    getProductosCliente,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    getResumenProducto
    
} from "../modules/productos.js";

import {
    refrescarCliente
}
from "./shared-ui.js";

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
    
    refrescarCliente(clienteId);
}

function editarProductoUI(
    productoId,
    clienteId
){

    const producto =
        getProductosCliente(
            clienteId
        )
        .find(
            p => p.id === productoId
        );

    const nombre =
        prompt(
            "Producto",
            producto.producto
        );

    if(!nombre) return;

    const presentacion =
        prompt(
            "Presentación",
            producto.presentacion
        );

    const precio =
        prompt(
            "Precio",
            producto.precio
        );

    editarProducto(
        productoId,
        {
            producto: nombre,
            presentacion,
            precio
        }
    );


refrescarCliente(clienteId);
    
}

function eliminarProductoUI(
    productoId,
    clienteId
){

    if(
        !confirm(
            "¿Eliminar producto?"
        )
    ) return;

    eliminarProducto(
        productoId
    );

refrescarCliente(clienteId);
    
}

function mostrarResumenProducto(
    producto,
    presentacion
){

    const resumen =
        getResumenProducto(
            producto,
            presentacion
        );

    if(!resumen) return;

    document
        .getElementById(
            "detalleProducto"
        )
        .innerHTML = `

        <div class="producto-resumen">

            <h2>
                ${producto}
                ${presentacion}
            </h2>

            <p>
                Precio mínimo 7 días:
                $${resumen.minimo}
            </p>

            <p>
                Precio máximo 7 días:
                $${resumen.maximo}
            </p>

            <p>
                Promedio:
                $${resumen.promedio}
            </p>

            <p>
                Observaciones:
                ${resumen.observaciones}
            </p>

        </div>

    `;
}

export {
    nuevoProducto,
    editarProductoUI,
    eliminarProductoUI,
    mostrarResumenProducto
};
