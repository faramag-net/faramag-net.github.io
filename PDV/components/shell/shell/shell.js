/**
 * ==========================================================
 * PDV
 * Archivo: shell.js
 * Módulo: Shell
 * Descripción: Contenedor principal de la aplicación.
 * Versión: 0.6.3
 * ==========================================================
 */

import Logger from "../../../core/logger.js";

const Shell = {

    container: null,

    onNavigate: null,

    async init() {

        const response =
            await fetch(
                "components/shell/shell/shell.html"
            );

        if (!response.ok) {

            throw new Error(
                response.status
            );

        }

        const html =
            await response.text();

        const app =
            document.getElementById(
                "app"
            );

        app.innerHTML =
            html;

        Logger.success(
            "Shell",
            "Shell inicializado."
        );

        await this.loadSidebar();

        this.container =
            document.getElementById(
                "content"
            );

    },

    async loadSidebar() {

        const response =
            await fetch(
                "components/shell/sidebar/sidebar.html"
            );

        if (!response.ok) {

            throw new Error(
                response.status
            );

        }

        const html =
            await response.text();

        const container =
            document.getElementById(
                "sidebar"
            );

        container.innerHTML =
            html;

        const Sidebar =
            (
                await import(
                    "../sidebar/sidebar.js"
                )
            ).default;

        await Sidebar.init(
            container
        );

        Sidebar.onSelect =

            (route) => {

                if (this.onNavigate) {

                    this.onNavigate(
                        route
                    );

                }

            };

        Logger.success(
            "Shell",
            "Sidebar cargado."
        );

    },

    setContent(html) {

        this.container.innerHTML =
            html;

    }



};

export default Shell;