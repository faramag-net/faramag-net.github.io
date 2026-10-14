import { getActividades, actualizarActividad, fechaCorta, estadoActividad } from "../../core/agenda.js";
import LocalDB
from "../../core/storage/local-db.js";

import { renderPhotoPicker, movePhotos } from "../../core/media/fotos.js";

LocalDB.recuperarProductosHistoricos();

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

// Delegación de eventos: tocar la tarjeta abre la ficha; ✕ no propaga esa acción.
const listaClientes = document.getElementById("listaClientes");
listaClientes?.addEventListener("click", event => {
    const botonEliminar = event.target.closest("[data-eliminar-cliente-id]");
    if (botonEliminar) {
        event.preventDefault();
        event.stopPropagation();
        window.eliminarClienteConfirm(botonEliminar.dataset.eliminarClienteId);
        return;
    }

    const tarjeta = event.target.closest("[data-cliente-card-id]");
    if (tarjeta) window.openClienteModal(tarjeta.dataset.clienteCardId);
});
listaClientes?.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const tarjeta = event.target.closest("[data-cliente-card-id]");
    if (!tarjeta || event.target.closest("button")) return;
    event.preventDefault();
    window.openClienteModal(tarjeta.dataset.clienteCardId);
});

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

    form.style.display = visible ? "none" : "grid";

    if (!visible) {
        const draftId = crypto.randomUUID();
        form.dataset.photoDraftId = draftId;
        renderPhotoPicker({ container: document.getElementById("clienteFotosNuevo"), entityType: "cliente", entityId: draftId, label: "Fotografías" });
    }

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

window.eliminarClienteConfirm = async (clienteId) => {
    // La eliminación usa exclusivamente el ID único; nunca nombre ni categoría.
    const id = String(clienteId ?? "");
    if (!id) return;

    const clientesActuales = LocalDB.getRouteClients();
    const cliente = clientesActuales.find(c => String(c.id) === id);
    if (!cliente) {
        alert("No se encontró el cliente con ese ID. No se eliminó ningún registro.");
        return;
    }

    const nombre = String(cliente.nombre || "este cliente");
    if (!confirm(`¿Deseas eliminar al cliente "${nombre}"?`)) return;

    if (!confirm(`CONFIRMACIÓN FINAL\n\nSe eliminará "${nombre}" de Visitas y también su pin asociado en el Mapa. Esta acción no se puede deshacer.\n\n¿Confirmas la eliminación definitiva?`)) return;

    try {
        // El Mapa vincula los clientes reales mediante routeClientId.
        // Solo se elimina el pin vinculado al ID exacto del cliente.
        const mapKey = "psr_map_clients";
        const mapaRaw = localStorage.getItem(mapKey);
        if (mapaRaw) {
            let mapa = JSON.parse(mapaRaw);
            if (!Array.isArray(mapa)) throw new Error("Los datos del Mapa no tienen un formato válido.");
            mapa = mapa.filter(registro => !(registro?.tipo === "real" && String(registro.routeClientId ?? "") === id));
            localStorage.setItem(mapKey, JSON.stringify(mapa));
        }

        // Las fotos de clientes reales en el Mapa se guardan con entityType "cliente"
        // y entityId igual al ID de route client.
        const { deletePhotosForEntity } = await import("../../core/media/fotos.js");
        await deletePhotosForEntity("cliente", id);

        // Volver a leer justo antes de guardar para no borrar otros cambios.
        const clientes = LocalDB.getRouteClients();
        if (!clientes.some(c => String(c.id) === id)) {
            alert("El cliente ya no está disponible. No se modificaron otros registros.");
            return;
        }
        LocalDB.saveRouteClients(clientes.filter(c => String(c.id) !== id));
        renderClientes();
        renderDashboardVisitas();
    } catch (error) {
        console.error("No se pudo completar la eliminación segura del cliente:", error);
        alert("No se pudo completar la eliminación de forma segura. No continúes borrando datos manualmente; revisa el registro y vuelve a intentarlo.");
    }
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


function renderAgendaPendientes(){
 const all=getActividades();
 const pendientes=all.filter(a=>a.estado==="pendiente").sort((a,b)=>`${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`));
 const contador=document.getElementById("contadorPendientes"); const lista=document.getElementById("listaActividadesPendientes");
 if(contador)contador.textContent=pendientes.length;
 if(!lista)return;
 lista.innerHTML=pendientes.length?pendientes.map(a=>`<article class="actividad-pendiente-card"><strong>${String(a.empresaNombre||"Empresa").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}</strong><div>📅 ${fechaCorta(a.fecha)} · ${a.hora}</div><div>🎯 ${String(a.motivo||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}</div><div class="actividad-pendiente-acciones"><button data-agenda-estado="realizada" data-agenda-id="${a.id}">✓ Realizada</button><button data-agenda-estado="cancelada" data-agenda-id="${a.id}">Cancelar</button></div></article>`).join(""):'<p class="agenda-vacia">No hay visitas pendientes.</p>';
}
document.getElementById("btnVerPendientes")?.addEventListener("click",()=>{const el=document.getElementById("listaActividadesPendientes");el.hidden=!el.hidden;renderAgendaPendientes()});
document.getElementById("listaActividadesPendientes")?.addEventListener("click",e=>{const b=e.target.closest("[data-agenda-estado]");if(!b)return;actualizarActividad(b.dataset.agendaId,b.dataset.agendaEstado);renderAgendaPendientes()});
renderAgendaPendientes();
