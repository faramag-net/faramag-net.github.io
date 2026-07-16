/**
 * ==========================================================
 * PDV
 * Archivo: ventas.js
 * Módulo: Ventas
 * Descripción: Registro y administración de ventas.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Ventas = {

    async init() {

        Logger.success(
            "Ventas",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Ventas",
            "Módulo destruido."
        );

    }

};

export default Ventas;