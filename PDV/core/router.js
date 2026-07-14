/**
 * ==========================================================
 * PDV
 * Archivo: router.js
 * Módulo: Core
 * Descripción: Administración de rutas.
 * Versión: 0.2.0
 * ==========================================================
 */

// Core
import Logger from "./logger.js";

const Router = {

    container: null,

    styleElement: null,

        routes: {

            dashboard: {

                html: "modules/dashboard/dashboard.html",
                css: "modules/dashboard/dashboard.css",
                js: "modules/dashboard/dashboard.js"

            }

        },

    init() {

        this.container =
            document.getElementById("app");

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

        const module =
            this.routes[route];

        if (!module) {

            Logger.error(
                "Router",
                `La ruta "${route}" no existe.`
            );

            return;

        }

        const path =
            module.html;

        if (!path) {

            Logger.error(
                "Router",
                `La ruta "${route}" no existe.`
            );

            return;

        }

        try {

            const response =
                await fetch(path);

            if (!response.ok) {

                throw new Error(
                    response.status
                );

            }

            const html =
                await response.text();

            this.container.innerHTML =
                html;
            
            this.styleElement.href =
                module.css;

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

    }

};

export default Router;