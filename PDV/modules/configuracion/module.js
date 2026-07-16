/**
 * ==========================================================
 * PDV
 * Archivo: configuracion.js
 * Módulo: Configuración
 * Descripción: Administración de la configuración del sistema.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Configuracion = {

    async init() {

        Logger.success(
            "Configuración",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Configuración",
            "Módulo destruido."
        );

    }

};

export default Configuracion;