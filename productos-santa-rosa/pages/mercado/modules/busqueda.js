import {
    normalizarTexto
}
from "./utils.js";

export function coincideBusqueda(
    cliente,
    productos,
    filtro
){

    if(!filtro.trim()){
        return true;
    }

const palabras =
    normalizarTexto(
        filtro
    )
    .split(/\s+/)
    .filter(Boolean);

    const textoCliente = 
        normalizarTexto(`
        ${cliente.nombre || ""}
        ${cliente.encargado || ""}
        ${cliente.telefono || ""}
        ${cliente.direccion || ""}
        ${
            productos
                .map(p => `
                    ${p.producto}
                    ${p.presentacion}
                `)
                .join(" ")
        }
    `);
    

    return palabras.every(
        palabra =>
            textoCliente.includes(
                palabra
            )
    );

}
