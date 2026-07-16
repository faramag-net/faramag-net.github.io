/**
 * ==========================================================
 * PDV
 * Archivo: inventario.js
 * Módulo: Inventario
 * Descripción: Administración del inventario y existencias.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Inventario = {

    async init() {

        Logger.success(
            "Inventario",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Inventario",
            "Módulo destruido."
        );

    }

};

export default Inventario;