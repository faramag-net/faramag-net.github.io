export function obtenerProductos(){

    const datos =
    localStorage.getItem(
        "inventarioSantaRosa"
    );

    if(!datos) return [];

    const sistema =
    JSON.parse(datos);

    return sistema.productos || [];

}
