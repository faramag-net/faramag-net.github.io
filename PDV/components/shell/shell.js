/**
 * ==========================================================
 * PDV
 * Archivo: shell.js
 * Módulo: Shell
 * Descripción: Contenedor principal de la aplicación.
 * Versión: 0.5.2
 * ==========================================================
 */

import Logger from "../../core/logger.js";

const Shell = {

    container: null,

    async init() {

        const response =
            await fetch(
                "components/shell/shell.html"
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

        this.container =
            document.getElementById(
                "content"
            );

        Logger.success(
            "Shell",
            "Shell inicializado."
        );

    },

    setContent(html) {

        this.container.innerHTML =
            html;

    }

};

export default Shell;