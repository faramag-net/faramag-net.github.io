/**
 * ==========================================================
 * PDV
 * Archivo: dashboard.js
 * Módulo: Dashboard
 * Descripción: Lógica del Dashboard.
 * Versión: 0.6.2
 * ==========================================================
 */

//core
import Logger from "../../core/logger.js";

//services
import ModulesService
from "../../services/modules.service.js";

const Dashboard = {

async init() {

    const modules =
        await ModulesService.getMenu();

    Logger.table(
        modules
    );

    Logger.success(
        "Dashboard",
        "Dashboard iniciado."
    );

    this.events();

},

    events() {

    },

    destroy() {

    }

};

export default Dashboard;