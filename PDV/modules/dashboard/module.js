/**
 * ==========================================================
 * PDV
 * Archivo: dashboard.js
 * Módulo: Dashboard
 * Descripción: Panel principal e indicadores del sistema.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Dashboard = {

    async init() {

        Logger.success(
            "Dashboard",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Dashboard",
            "Módulo destruido."
        );

    }

};

export default Dashboard;