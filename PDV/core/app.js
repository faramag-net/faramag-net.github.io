/**
 * ==========================================================
 * PDV
 * Archivo: app.js
 * Módulo: Core
 * Descripción: Inicialización del sistema.
 * Versión: 0.6.5
 * ==========================================================
 */


// Core
import Logger from "./logger.js";
import APP from "./constants.js";
import Config from "./config.js";
import Router from "./router.js";
import Shell from "../components/shell/shell/shell.js";

// Database
import Database from "../database/database.js";

const App = {

//==================================================
// Inicialización
//==================================================

    async init(){

        this.showBanner();

        await this.initializeCore();

        await this.startApplication();

        Logger.success(
            "App",
            "Aplicación iniciada."
        );

    },

//==================================================
// Métodos privados
//==================================================

    showBanner() {

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

    },

    async initializeCore() {

        Config.init();

        Database.init();

        Router.init();

        await Shell.init();

    },

    async startApplication() {

        Shell.onNavigate =

        async (route) => {

            await Router.load(
                route
            );

        };

        await Router.load(
            "dashboard"
        );

    },

};

export default App;