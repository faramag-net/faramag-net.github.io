/**
 * ==========================================================
 * PDV
 * Archivo: app.js
 * Módulo: Core
 * Descripción: Inicialización del sistema.
 * Versión: 0.1.0
 * ==========================================================
 */

import APP from "./constants.js";
import Config from "./config.js";
// Database
import Database from "../database/database.js";
import Router from "./router.js";
// Core
import Logger from "../core/logger.js";

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

Logger.success(
    "Aplicación iniciada."
);

    }

};

export default App;