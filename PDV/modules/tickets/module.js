/**
 * ==========================================================
 * PDV
 * Archivo: tickets.js
 * Módulo: Tickets
 * Descripción: Consulta, reimpresión y administración de tickets.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Tickets = {

    async init() {

        Logger.success(
            "Tickets",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Tickets",
            "Módulo destruido."
        );

    }

};

export default Tickets;

