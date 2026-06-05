import LocalDB
from "../../core/storage/local-db.js";

const btnHistorial =
    document.getElementById("toggleHistorial");

const historialContainer =
    document.getElementById("historialContainer");

let abierto = false;

btnHistorial.addEventListener("click", () => {

    abierto = !abierto;

    historialContainer.style.display =
        abierto ? "block" : "none";

    btnHistorial.textContent =
        abierto
            ? "▼ Historial (0)"
            : "▶ Historial (0)";

});
