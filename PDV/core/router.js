/**
 * ==========================================================
 * PDV
 * Archivo: router.js
 * Módulo: Core
 * Descripción: Administración de rutas.
 * Versión: 0.5.0
 * ==========================================================
 */

// Core
import Logger from "./logger.js";

const Router = {

    container: null,

    styleElement: null,

        routes: {

            dashboard:
                "modules/dashboard/manifest.js",

            productos:
                "modules/productos/manifest.js",

            ventas:
                "modules/ventas/manifest.js",

            inventario:
                "modules/inventario/manifest.js",

            caja:
                "modules/caja/manifest.js",

            tickets:
                "modules/tickets/manifest.js",

            configuracion:
                "modules/configuracion/manifest.js"

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

        const manifestPath =
            this.routes[route];

        if (!manifestPath) {

            Logger.error(
                "Router",
                `La ruta "${route}" no existe.`
            );

            return;

        }

        try {

            const manifest =
                await import(
                    `../${manifestPath}`
                );

            const module =
                manifest.default;

            const response =
                await fetch(
                    module.html
                );

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

            const script =
                await import(
                    `../${module.js}`
                );

            script.default.init();

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