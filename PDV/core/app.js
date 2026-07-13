/**
 * ==========================================================
 * PDV
 * Archivo: app.js
 * Módulo: Core
 * Descripción: Inicialización del sistema.
 * Versión: 0.1.0
 * ==========================================================
 */


// Core
import Logger from "./logger.js";
import APP from "./constants.js";
import Config from "./config.js";
import Router from "./router.js";

// Database
import Database from "../database/database.js";

const App = {

    init(){

        console.clear();

        Logger.line();

        Logger.info(APP.NAME);

        Logger.info(`Versión ${APP.VERSION}`);

        Logger.line();

        Config.init();

        Database.init();

        Router.init();

        Router.load(
            "dashboard"
        );

Logger.success(
    "App",
    "Aplicación iniciada."
);

    }

};

export default App;