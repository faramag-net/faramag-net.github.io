export let productos = [];

export let movimientos = [];

export function guardarLocal(){

    localStorage.setItem(
        "inventarioSantaRosa",

        JSON.stringify({
            productos,
            movimientos
        })
    );

}

export function cargarLocal(){

    const datos =
    localStorage.getItem("inventarioSantaRosa");

    if(!datos) return;

    const sistema = JSON.parse(datos);

    productos = sistema.productos || [];

    movimientos = sistema.movimientos || [];

}
