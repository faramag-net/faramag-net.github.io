import LocalDB
from "../../core/storage/local-db.js";

import {
    crearCliente
}
from "./modules/clientes.js";

import {
    renderClientes
}
from "./modules/render.js";

import {
    renderDashboardVisitas
}
from "./dashboard-visitas.js";

import {
    renderVisitas
}
from "./modules/render-visitas.js";

import {
    openClienteModal
}
from "./modules/cliente-modal.js";

window.crearCliente =
    crearCliente;

window.verVisitas =
    renderVisitas;

window.openClienteModal =
    openClienteModal;

window.openCrearClienteModal = () => {

    const form =
        document.querySelector(
            ".form-cliente"
        );

    if(!form){
        return;
    }

    const visible =
        getComputedStyle(form)
        .display !== "none";

    form.style.display =
        visible
        ? "none"
        : "grid";

};

window.obtenerUbicacion = () => {

    if(!navigator.geolocation){

        alert(
            "Geolocalización no soportada"
        );

        return;
    }

    navigator.geolocation
    .getCurrentPosition(

        async pos => {

            const lat =
                pos.coords.latitude;

            const lon =
                pos.coords.longitude;

            document
            .getElementById(
                "clienteLatitud"
            )
            .value = lat;

            document
            .getElementById(
                "clienteLongitud"
            )
            .value = lon;

            try{

                const response =
                    await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                    );

                const data =
                    await response.json();

                document
                .getElementById(
                    "clienteDireccion"
                )
                .value =
                    data.display_name || "";

            }
            catch(error){

                console.error(
                    error
                );

                alert(
                    "No se pudo obtener la dirección"
                );

            }

        },

        () => {

            alert(
                "No se pudo obtener ubicación"
            );

        },

        {

            enableHighAccuracy:true,

            timeout:10000

        }

    );

};

window.eliminarClienteConfirm =
    (clienteId) => {

    if(
        !confirm(
            "¿Eliminar cliente?"
        )
    ){
        return;
    }

    const clientes =
        LocalDB.getRouteClients()
        .filter(
            c => c.id !== clienteId
        );

    LocalDB.saveRouteClients(
        clientes
    );

    renderClientes();

};

renderClientes();
renderDashboardVisitas();

document
.getElementById(
"buscarCliente"
)
?.addEventListener(
"input",
renderClientes
);

document
.getElementById(
"filtroConsignacion"
)
?.addEventListener(
"change",
renderClientes
);

import {
    exportarJSON,
    importarJSON
}
from "./modules/exportar.js";

document
.getElementById(
    "exportarVisitasBtn"
)
.onclick =
    exportarJSON;

document
.getElementById(
    "importarVisitasBtn"
)
.onclick =
    () =>
        document
        .getElementById(
            "importarVisitasInput"
        )
        .click();

document
.getElementById(
    "importarVisitasInput"
)
.onchange =
    importarJSON;
