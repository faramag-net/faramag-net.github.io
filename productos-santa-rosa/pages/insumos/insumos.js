import LocalDB
from "../../core/storage/local-db.js";

const btnGuardar =
    document.getElementById("btnGuardar");

btnGuardar.addEventListener(
    "click",
    guardarInsumo
);

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

function guardarInsumo() {

        console.log("BOTON GUARDAR FUNCIONA");
    
    const insumos =
        LocalDB.getInsumos();

    const nuevoInsumo = {

        id: crypto.randomUUID(),

        fecha:
            new Date().toISOString(),

        producto:
            document
                .getElementById("producto")
                .value,

        presentacion:
            document
                .getElementById("presentacion")
                .value,

        tienda:
            document
                .getElementById("tienda")
                .value,

        comprador:
            document
                .getElementById("comprador")
                .value,

        contacto:
            document
                .getElementById("contacto")
                .value,

        cantidad:
            Number(
                document
                    .getElementById("cantidad")
                    .value
            ),

        total:
            Number(
                document
                    .getElementById("total")
                    .value
            ),

        comentarios:
            document
                .getElementById("comentarios")
                .value,

        direccion:
            document
                .getElementById("direccion")
                .value

    };

    insumos.push(nuevoInsumo);

    LocalDB.saveInsumos(insumos);

    console.log(
        "INSUMO GUARDADO",
        nuevoInsumo
    );

}
