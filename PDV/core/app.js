/**
 * ==========================================================
 * PDV
 * Archivo: app.js
 * Módulo: Core
 * Descripción: Inicialización del sistema.
 * Versión: 0.1.0
 * ==========================================================
 */

import Config from "./config.js";
import Database from "../database/database.js";
import Router from "./router.js";
import APP from "./constants.js";

const App = {

    init(){

        console.clear();

        console.log("======================================");
        console.log(APP.NAME);
        console.log("Versión:", APP.VERSION);
        console.log("======================================");

        Config.init();

        Database.init();

        Router.init();

        console.log("[PDV] Aplicación iniciada.");

    }

};

export default App;