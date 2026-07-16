/**
 * ==========================================================
 * PDV
 * Archivo: caja.js
 * Módulo: Caja
 * Descripción: Administración de operaciones de caja.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Caja = {

    async init() {

        Logger.success(
            "Caja",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Caja",
            "Módulo destruido."
        );

    }

};

export default Caja;