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
