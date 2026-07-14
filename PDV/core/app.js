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
import Shell from "../components/shell/shell.js";

// Database
import Database from "../database/database.js";

const App = {

    async init(){

        console.clear();

        Logger.line();

        Logger.info(
            "App",
            APP.NAME
        );

        Logger.info(
            "App",
            `Versión ${APP.VERSION}`
        );

        Logger.line();

        Config.init();

        Database.init();

        Router.init();

        await Shell.init();

        await Router.load(
            "dashboard"
        );

Logger.success(
    "App",
    "Aplicación iniciada."
);

    }

};

export default App;