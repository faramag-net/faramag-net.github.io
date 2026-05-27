import {
    crearCliente
}
from "./modules/clientes.js";

import {
    renderClientes
}
from "./modules/render.js";

window.crearCliente =
    crearCliente;

renderClientes();
