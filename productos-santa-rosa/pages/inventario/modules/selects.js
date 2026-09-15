import {
    productos
}
from "./storage.js";

export function actualizarSelectProductos(){

    const select =
    document.getElementById(
        "productoInventario"
    );

    if(!select) return;

    select.innerHTML = "";

    productos.forEach(producto=>{

        select.innerHTML += `

        <option value="${producto.nombre}">

            ${producto.nombre}

        </option>

        `;

    });

}
