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

import {
    mostrarFormularioProducto
}
from "./formularios-ui.js";

function nuevoProducto(clienteId){

    mostrarFormularioProducto(
        {},
        datos => {

            agregarProducto(
                clienteId,
                datos
            );

            refrescarCliente(
                clienteId
            );

        }
    );
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

    if(!producto) return;

    mostrarFormularioProducto(
        producto,
        datos => {

            editarProducto(
                productoId,
                datos
            );

            refrescarCliente(
                clienteId
            );

        }
    );

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

    if(!resumen){

    alert(
        "Este producto no tiene historial registrado."
    );

    return;
}

    const detalle =
        document.getElementById(
            "detalleProducto"
        );
    
    if(!detalle) return;
        
        detalle.innerHTML = `

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
