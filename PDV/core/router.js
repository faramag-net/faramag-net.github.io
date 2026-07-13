/**
 * ==========================================================
 * PDV
 * Archivo: router.js
 * Módulo: Core
 * Descripción: Administración de rutas.
 * Versión: 0.1.0
 * ==========================================================
 */

// Core
import Logger from "./logger.js";

const Router = {

    container : null,

    routes : {

        dashboard :
            "../modules/dashboard/dashboard.html"

    },

    init(){

        this.container =
            document.getElementById("app");

        Logger.success(
            "Router",
            "Router inicializado."
        );

    },

    async load(route){

        Logger.info(
            "Router",
            `Cargando módulo: ${route}`
        );

    }
};

export default Router;