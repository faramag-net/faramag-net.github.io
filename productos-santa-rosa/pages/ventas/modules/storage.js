export let ventas = [];

export let comanda = [];

export function guardarVentas(){

    localStorage.setItem(

        "ventasSantaRosa",

        JSON.stringify({

            ventas,
            comanda

        })

    );

}

export function cargarVentas(){

    const datos =
    localStorage.getItem(
        "ventasSantaRosa"
    );

    if(!datos) return;

    const sistema =
    JSON.parse(datos);

    ventas =
    sistema.ventas || [];

    comanda =
    sistema.comanda || [];

}
