import {
    inicializarClientesUI
}
from "./ui/clientes-ui.js";

console.log(
    "mercado.js cargado"
);

window.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "DOM cargado"
        );

        inicializarClientesUI();

    }
);













