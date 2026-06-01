export function coincideBusqueda(
    cliente,
    productos,
    filtro
){

    if(!filtro.trim()){
        return true;
    }

    const palabras =
        filtro
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

    const textoCliente = `
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
    `
    .toLowerCase();

    return palabras.every(
        palabra =>
            textoCliente.includes(
                palabra
            )
    );

}
