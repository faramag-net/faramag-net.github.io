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
    abrirRegistroVisita
}
from "./modules/visitas.js";

import {
    openClienteModal
}
from "./modules/cliente-modal.js";

window.crearCliente =
    crearCliente;

window.verVisitas =
    renderVisitas;

window.abrirRegistroVisita =
    abrirRegistroVisita;

window.openClienteModal =
    openClienteModal;

renderClientes();
renderDashboardVisitas();
