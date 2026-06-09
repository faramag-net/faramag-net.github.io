import LocalDB
from "../../core/storage/local-db.js";

const btnExportar =
    document.getElementById(
        "btnExportar"
    );

const btnGeolocalizar =
    document.getElementById(
        "btnGeolocalizar"
    );

const btnImportar =
    document.getElementById(
        "btnImportar"
    );

const fileImportar =
    document.getElementById(
        "fileImportar"
    );

const btnEliminar =
    document.getElementById(
        "btnEliminar"
    );


const buscarHistorial =
    document.getElementById(
        "buscarHistorial"
    );

const comprador =
    document.getElementById("comprador");

const otroCompradorContainer =
    document.getElementById(
        "otroCompradorContainer"
    );

let latitudActual = "";
let longitudActual = "";

btnEliminar.addEventListener(
    "click",
    eliminarInsumos
);

btnExportar.addEventListener(
    "click",
    exportarInsumos
);

btnImportar.addEventListener(
    "click",
    () => fileImportar.click()
);

fileImportar.addEventListener(
    "change",
    importarInsumos
);

btnGeolocalizar.addEventListener(
    "click",
    obtenerUbicacion
);

buscarHistorial.addEventListener(
    "input",
    renderHistorial
);

comprador.addEventListener(
    "change",
    () => {

        otroCompradorContainer.style.display =
            comprador.value === "Otro"
                ? "block"
                : "none";

    }
);


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

let insumoEditando = null;

btnHistorial.addEventListener("click", () => {

    abierto = !abierto;

    historialContainer.style.display =
        abierto ? "block" : "none";

    actualizarContadorHistorial();

});

function guardarInsumo() {

    if(insumoEditando){

    const insumos =
        LocalDB.getInsumos();

    const index =
        insumos.findIndex(
            i => i.id === insumoEditando
        );

    if(index !== -1){

        insumos[index] = {

            ...insumos[index],

            producto:
                document.getElementById("producto").value,

            presentacion:
                document.getElementById("presentacion").value,

            tienda:
                document.getElementById("tienda").value,

            comprador:
                document.getElementById("comprador").value,

            compradorNombre:
                document.getElementById("compradorNombre").value,

            contacto:
                document.getElementById("contacto").value,

            cantidad:
                Number(
                    document.getElementById("cantidad").value
                ),

            total:
                Number(
                    document.getElementById("total").value
                ),

            comentarios:
                document.getElementById("comentarios").value,

            direccion:
                document.getElementById("direccion").value,

            latitud:
                latitudActual,

            longitud:
                longitudActual

        };

        LocalDB.saveInsumos(
            insumos
        );

        insumoEditando = null;

        document.getElementById(
            "btnGuardar"
        ).textContent =
            "💾 Guardar";

        renderHistorial();
        actualizarKPIs();
        actualizarDatalists();
        limpiarFormulario();

        return;
    }
}
    
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

        compradorNombre:
            document
                .getElementById(
                    "compradorNombre"
                )
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

        latitud:
            latitudActual,
        
        longitud:
            longitudActual,
        
        direccion:
            document
                .getElementById("direccion")
                .value

    };

    insumos.push(nuevoInsumo);

    LocalDB.saveInsumos(insumos);

    renderHistorial();
    actualizarKPIs();
    actualizarDatalists();
    limpiarFormulario();
    
}

function renderHistorial() {

    const tabla =
        document.getElementById(
            "tablaInsumos"
        );

    const insumos =
        LocalDB.getInsumos();

    const textoBusqueda =
    buscarHistorial.value
        .toLowerCase()
        .trim();

    tabla.innerHTML = "";

    [...insumos]
    .filter(insumo => {

        if (!textoBusqueda) {
            return true;
        }

        return Object.values(insumo)
            .join(" ")
            .toLowerCase()
            .includes(textoBusqueda);

    })
        
    .reverse()
    .forEach(insumo => {

        tabla.innerHTML += `
            <tr>
                <td>${formatearFecha(insumo.fecha)}</td>
                <td>${insumo.producto || ""}</td>
                <td>${insumo.presentacion || ""}</td>
                <td>$${insumo.total || 0}</td>
                <td>${insumo.tienda || ""}</td>
                <td>
                    ${
                        insumo.comprador === "Otro"
                            ? insumo.compradorNombre
                            : insumo.comprador
                    }
                </td>
                <td>${insumo.contacto || ""}</td>
                <td>${insumo.longitud || ""}</td>
                <td>${insumo.latitud || ""}</td>
                <td>${insumo.direccion || ""}</td>
                <td>${insumo.comentarios || ""}</td>

                <td>
                    <button
                        class="btn-editar"
                        onclick="editarInsumo('${insumo.id}')"
                    >
                        ✏️
                    </button>
                
                    <button
                        class="btn-eliminar"
                        onclick="eliminarInsumo('${insumo.id}')"
                    >
                        🗑️
                    </button>
                </td>
                
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
actualizarDatalists();

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
    document.getElementById("compradorNombre").value = "";
    document.getElementById("comentarios").value = "";
    document.getElementById("direccion").value = "";
    comprador.value = "Martha";
    latitudActual = "";
    longitudActual = "";    
    otroCompradorContainer.style.display =
        "none";
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

function actualizarDatalists() {

    const insumos =
        LocalDB.getInsumos();

    const productos =
        [...new Set(
            insumos
                .map(i => i.producto)
                .filter(Boolean)
        )];

    const presentaciones =
        [...new Set(
            insumos
                .map(i => i.presentacion)
                .filter(Boolean)
        )];

    const tiendas =
        [...new Set(
            insumos
                .map(i => i.tienda)
                .filter(Boolean)
        )];

    document.getElementById(
        "productosList"
    ).innerHTML =
        productos
            .map(p =>
                `<option value="${p}">`
            )
            .join("");

    document.getElementById(
        "presentacionesList"
    ).innerHTML =
        presentaciones
            .map(p =>
                `<option value="${p}">`
            )
            .join("");

    document.getElementById(
        "tiendasList"
    ).innerHTML =
        tiendas
            .map(t =>
                `<option value="${t}">`
            )

            .join("");

}

function exportarInsumos() {

    const insumos =
        LocalDB.getInsumos();

    const blob = new Blob(
        [
            JSON.stringify(
                insumos,
                null,
                2
            )
        ],
        {
            type:
                "application/json"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;

    enlace.download =
        `insumos_${
            new Date()
                .toISOString()
                .split("T")[0]
        }.json`;

    enlace.click();

    URL.revokeObjectURL(url);

}

function importarInsumos(event) {

    const archivo =
        event.target.files[0];

    if (!archivo) return;

    const lector =
        new FileReader();

    lector.onload = () => {

        try {

            const datos =
                JSON.parse(
                    lector.result
                );

            LocalDB.saveInsumos(
                datos
            );

            renderHistorial();
            actualizarKPIs();
            actualizarDatalists();

            alert(
                "Importación completada"
            );

        } catch {

            alert(
                "Archivo inválido"
            );

        }

    };

    lector.readAsText(
        archivo
    );

}

function eliminarInsumos() {

    const confirmar =
        confirm(
            "¿Eliminar todo el historial?"
        );

    if (!confirmar) {
        return;
    }

    LocalDB.saveInsumos([]);

    renderHistorial();

    actualizarKPIs();

    actualizarDatalists();

}

function obtenerUbicacion() {

    if (!navigator.geolocation) {

        alert(
            "Geolocalización no soportada"
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        posicion => {

            latitudActual =
                posicion.coords.latitude;

            longitudActual =
                posicion.coords.longitude;

            obtenerDireccion(
                latitudActual,
                longitudActual
            );

        },

        error => {

            alert(
                "No fue posible obtener la ubicación"
            );

            console.error(error);

        }

    );

}

async function obtenerDireccion(
    latitud,
    longitud
) {

    try {

        const respuesta =
            await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitud}&lon=${longitud}`
            );

        const datos =
            await respuesta.json();

        document.getElementById(
            "direccion"
        ).value =
            datos.display_name || "";

    } catch(error){

        console.error(error);

        document.getElementById(
            "direccion"
        ).value =
            "Dirección no encontrada";

    }

}

window.eliminarInsumo = function(id){

    const confirmar =
        confirm(
            "¿Eliminar este registro?"
        );

    if(!confirmar){
        return;
    }

    const insumos =
        LocalDB.getInsumos();

    const actualizados =
        insumos.filter(
            insumo => insumo.id !== id
        );

    LocalDB.saveInsumos(
        actualizados
    );

    renderHistorial();
    actualizarKPIs();
    actualizarDatalists();

}

window.editarInsumo = function(id){

    const insumos =
        LocalDB.getInsumos();

    const insumo =
        insumos.find(
            i => i.id === id
        );

    if(!insumo){
        return;
    }

    insumoEditando = id;

    document.getElementById("producto").value =
        insumo.producto || "";

    document.getElementById("presentacion").value =
        insumo.presentacion || "";

    document.getElementById("tienda").value =
        insumo.tienda || "";

    document.getElementById("contacto").value =
        insumo.contacto || "";

    document.getElementById("cantidad").value =
        insumo.cantidad || "";

    document.getElementById("total").value =
        insumo.total || "";

    document.getElementById("comentarios").value =
        insumo.comentarios || "";

    document.getElementById("direccion").value =
        insumo.direccion || "";

    document.getElementById("comprador").value =
        insumo.comprador || "Martha";

    document.getElementById("compradorNombre").value =
        insumo.compradorNombre || "";

    latitudActual =
        insumo.latitud || "";

    longitudActual =
        insumo.longitud || "";

    document.getElementById(
        "btnGuardar"
    ).textContent =
        "💾 Actualizar";

}
