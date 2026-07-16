/**
 * ==========================================================
 * PDV
 * Archivo: productos.js
 * Módulo: Productos
 * Descripción: Administración del catálogo de productos.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Productos = {

    async init() {

        Logger.success(
            "Productos",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Productos",
            "Módulo destruido."
        );

    }

};

export default Productos;
