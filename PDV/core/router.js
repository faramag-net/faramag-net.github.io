/**
 * ==========================================================
 * PDV
 * Archivo: router.js
 * Módulo: Core
 * Descripción: Administración de rutas.
 * Versión: 0.6.5
 * ==========================================================
 */

// Core
import Logger from "./logger.js";

import Shell
from "../components/shell/shell/shell.js";

import Registry
from "../modules/registry.js";

const Router = {

    container: null,

    styleElement: null,

    currentModule: null,

    init() {

        this.styleElement =
            document.getElementById(
                "module-style"
            );

        if (!this.styleElement) {

            this.styleElement =
                document.createElement(
                    "link"
                );

            this.styleElement.rel =
                "stylesheet";

            this.styleElement.id =
                "module-style";

            document.head.appendChild(
                this.styleElement
            );

        }

        Logger.success(
            "Router",
            "Router inicializado."
        );

    },

    async load(route) {

        Logger.info(
            "Router",
            `Cargando módulo: ${route}`
        );

        if (!Registry.includes(route)) {

            Logger.error(
                "Router",
                `El módulo "${route}" no está registrado.`
            );

            return;

        }

        try {

            await this.loadHtml(route);

            this.loadCss(route);

            const Module =
                await this.loadScript(route);

            await this.destroyCurrentModule();

            await this.startModule(Module);

            Logger.success(
                "Router",
                `Módulo "${route}" cargado correctamente.`
            );

        }

        catch (error) {

            Logger.error(
                "Router",
                `No fue posible cargar "${route}".`
            );

            console.error(error);

        }

    },

    async destroyCurrentModule() {

        if (

            this.currentModule &&
            this.currentModule.destroy

        ) {

            Logger.info(
                "Router",
                "Destruyendo módulo anterior."
            );

            await this.currentModule.destroy();

        }

    },

    async loadHtml(route) {

        const response =
            await fetch(
                `modules/${route}/module.html`
            );

        if (!response.ok) {

            throw new Error(
                response.status
            );

        }

        const html =
            await response.text();

        Shell.setContent(
            html
        );

    },

    loadCss(route) {

        this.styleElement.href =
            `modules/${route}/module.css`;

    },

    async loadScript(route) {

        return (
            await import(
                `../modules/${route}/module.js`
            )
        ).default;

    },

    async startModule(Module) {

        this.currentModule =
            Module;

        await this.currentModule.init();

    }

};

export default Router;