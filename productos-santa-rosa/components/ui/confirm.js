import {
    openModal
}
from "./modal.js";

export function confirmAction({

    title = "Confirmar",

    message = "¿Continuar?",

    onConfirm = () => {}

}){

    openModal(`

        <h2>${title}</h2>

        <p>${message}</p>

        <div
        style="
            display:flex;
            gap:10px;
            margin-top:20px;
        ">

            <button id="confirmYes">

                Sí

            </button>

            <button id="confirmNo">

                Cancelar

            </button>

        </div>

    `);

    setTimeout(() => {

        document
        .getElementById("confirmYes")
        .onclick = () => {

            onConfirm();

            document
            .querySelector(".modal-overlay")
            ?.remove();
        };

        document
        .getElementById("confirmNo")
        .onclick = () => {

            document
            .querySelector(".modal-overlay")
            ?.remove();
        };

    }, 0);
}
