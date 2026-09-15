import {
    getClientes
}
from "../modules/clientes.js";

import {
    getProductos
}
from "../modules/productos.js";

import {
    normalizarTexto
}
from "../modules/utils.js";

export function mostrarFormularioCliente(
    datosIniciales = {},
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
                    list="clientesExistentes"
                    placeholder="Nombre"
                    value="${datosIniciales.nombre || ""}"
                >
                
                <datalist id="clientesExistentes"></datalist>

                <input
                    id="encargadoCliente"
                    placeholder="Encargado"
                    value="${datosIniciales.encargado || ""}"
                >

                <input
                    id="telefonoCliente"
                    placeholder="Teléfono"
                    value="${datosIniciales.telefono || ""}"
                >

                <input
                    id="direccionCliente"
                    placeholder="Dirección"
                    value="${datosIniciales.direccion || ""}"
                >

                <button
                    type="button"
                    id="btnUbicacion"
                >
                    📍 Obtener ubicación actual
                </button>
                
                <input
                    type="hidden"
                    id="latitudCliente"
                    value="${datosIniciales.latitud || ""}"
                >
                
                <input
                    type="hidden"
                    id="longitudCliente"
                    value="${datosIniciales.longitud || ""}"
                >

                <textarea
                    id="comentariosCliente"
                    placeholder="Comentarios"
                >${datosIniciales.comentarios || ""}</textarea>

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
        "btnUbicacion"
    )
    .onclick = () => {

        navigator.geolocation
            .getCurrentPosition(

                posicion => {

                    const lat =
                        posicion.coords.latitude;

                    const lng =
                        posicion.coords.longitude;

                    document
                        .getElementById(
                            "latitudCliente"
                        )
                        .value = lat;

                    document
                        .getElementById(
                            "longitudCliente"
                        )
                        .value = lng;

                    fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                    )
                    .then(
                        r => r.json()
                    )
                    .then(
                        data => {

                            document
                                .getElementById(
                                    "direccionCliente"
                                )
                                .value =
                                data.display_name || "";

                        }
                    );

                },

                error => {

                    alert(
                        "No fue posible obtener la ubicación"
                    );

                }

            );

    };            
    
const clientes =
    getClientes();

const mapaClientes =
    new Map();

clientes.forEach(cliente => {

    const clave =
        normalizarTexto(
            cliente.nombre
        );

    if(!mapaClientes.has(clave)){

        mapaClientes.set(
            clave,
            cliente.nombre
        );

    }

});
       
document
    .getElementById(
        "clientesExistentes"
    )
    .innerHTML =
        [...mapaClientes.values()]
            .map(nombre => `
                <option
                    value="${nombre}"
                >
            `)
            .join("");
    
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
        ).value,
                
    latitud:
    document.getElementById(
        "latitudCliente"
    ).value,

    longitud:
    document.getElementById(
        "longitudCliente"
    ).value,
                
    comentarios:
        document.getElementById(
            "comentariosCliente"
        ).value

            });

            modal.innerHTML = "";

        };

}

export function mostrarFormularioProducto(
    datosIniciales = {},
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
                    Producto Observado
                </h3>

                <input
                        id="productoNombre"
                        list="productosExistentes"
                        placeholder="Producto"
                        value="${datosIniciales.producto || ""}"
                    >
                    
                    <datalist id="productosExistentes"></datalist>

                <input
                        id="productoPresentacion"
                        list="presentacionesExistentes"
                        placeholder="Presentación"
                        value="${datosIniciales.presentacion || ""}"
                    >
                    
                    <datalist id="presentacionesExistentes"></datalist>

                <input
                    id="productoPrecio"
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    value="${datosIniciales.precio || ""}"
                >

                <input
                    id="productoComentarios"
                    placeholder="Comentarios"
                    value="${datosIniciales.comentarios || ""}"
                >

                <div class="modal-actions">

                    <button id="guardarProducto">
                        Guardar
                    </button>

                    <button id="cancelarProducto">
                        Cancelar
                    </button>

                </div>

            </div>

        </div>

    `;

   
    const productos =
    getProductos();

    console.log(
    "Productos",
    productos
    );
    
    const nombresProductos =
    [
        ...new Set(
            productos.map(
                p => p.producto
            )
        )
    ];

document
    .getElementById(
        "productosExistentes"
    )
    .innerHTML =
        nombresProductos
            .map(nombre => `
                <option
                    value="${nombre}"
                >
            `)
            .join("");

    const presentaciones =
    [
        ...new Set(
            productos.map(
                p => p.presentacion
            )
        )
    ];

document
    .getElementById(
        "presentacionesExistentes"
    )
    .innerHTML =
        presentaciones
            .map(presentacion => `
                <option
                    value="${presentacion}"
                >
            `)
            .join("");
    
    document
        .getElementById(
            "cancelarProducto"
        )
        .onclick = () =>
            modal.innerHTML = "";

    document
        .getElementById(
            "guardarProducto"
        )
        .onclick = () => {

            onGuardar({

                producto:
                    document.getElementById(
                        "productoNombre"
                    ).value,

                presentacion:
                    document.getElementById(
                        "productoPresentacion"
                    ).value,

                precio:
                    Number(
                        document.getElementById(
                            "productoPrecio"
                        ).value
                    ),

                comentarios:
                    document.getElementById(
                        "productoComentarios"
                    ).value

            });

            modal.innerHTML = "";

        };

}
