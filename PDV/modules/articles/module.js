/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Articles
 * Descripción: Administración del catálogo de artículos.
 * Versión: 0.8.0
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Articles = {

    async init() {

        Logger.success(
            "Articles",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Articles",
            "Módulo destruido."
        );

    }

};

export default Articles;