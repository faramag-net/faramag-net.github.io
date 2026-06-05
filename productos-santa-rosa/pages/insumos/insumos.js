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

    actualizarContadorHistorial();

});

function guardarInsumo() {

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

        latitud: "",
        
        longitud: "",
        
        direccion:
            document
                .getElementById("direccion")
                .value

    };

    insumos.push(nuevoInsumo);

    LocalDB.saveInsumos(insumos);

    renderHistorial();
    actualizarKPIs();
    limpiarFormulario();
    
}

function renderHistorial() {

    const tabla =
        document.getElementById(
            "tablaInsumos"
        );

    const insumos =
        LocalDB.getInsumos();

    tabla.innerHTML = "";

    insumos.forEach(insumo => {

        tabla.innerHTML += `
            <tr>
                <td>${formatearFecha(insumo.fecha)}</td>
                <td>${insumo.producto || ""}</td>
                <td>${insumo.presentacion || ""}</td>
                <td>$${insumo.total || 0}</td>
                <td>${insumo.tienda || ""}</td>
                <td>${insumo.comprador || ""}</td>
                <td>${insumo.contacto || ""}</td>
                <td>${insumo.longitud || ""}</td>
                <td>${insumo.latitud || ""}</td>
                <td>${insumo.direccion || ""}</td>
                <td>${insumo.comentarios || ""}</td>
            </tr>
        `;

    });


       actualizarContadorHistorial();
    
}

function formatearFecha(fecha) {

    return new Date(fecha)
        .toLocaleDateString();

}

renderHistorial();
actualizarKPIs();

function actualizarContadorHistorial() {

    const total =
        LocalDB.getInsumos().length;

    btnHistorial.textContent =
        abierto
            ? `▼ Historial (${total})`
            : `▶ Historial (${total})`;

}

function limpiarFormulario() {

    document.getElementById("producto").value = "";
    document.getElementById("presentacion").value = "";
    document.getElementById("tienda").value = "";
    document.getElementById("contacto").value = "";
    document.getElementById("cantidad").value = "";
    document.getElementById("total").value = "";
    document.getElementById("comentarios").value = "";
    document.getElementById("direccion").value = "";

}

function actualizarKPIs() {

    const insumos =
        LocalDB.getInsumos();

    let totalGeneral = 0;
    let totalFara = 0;
    let totalMartha = 0;

    insumos.forEach(insumo => {

        const total =
            Number(insumo.total) || 0;

        totalGeneral += total;

        switch(insumo.comprador){

            case "Fara":
                totalFara += total;
                break;

            case "Martha":
                totalMartha += total;
                break;

            case "Ambos":
                totalFara += total / 2;
                totalMartha += total / 2;
                break;
        }

    });

    document.getElementById("kpiTotal").textContent =
        `$${totalGeneral.toFixed(2)}`;

    document.getElementById("kpiFara").textContent =
        `$${totalFara.toFixed(2)}`;

    document.getElementById("kpiMartha").textContent =
        `$${totalMartha.toFixed(2)}`;

}
