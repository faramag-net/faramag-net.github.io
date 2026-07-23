/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Articles
 * Descripción: Administración del catálogo de artículos.
 * Versión: 0.8.0
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

const Articles = {

    elements: {},

    async init() {

        Logger.success(
            "Articles",
            "Módulo iniciado."
        );        

        this.cache();

        this.events();

        await this.load();

    },

    cache() {

        this.elements = {

            btnSaveArticle:
                document.getElementById(
                    "btnSaveArticle"
                )

        };

    },

    events() {

            this.elements.btnSaveArticle
        .addEventListener(
            "click",
            () => {

                console.log(
                    "Guardar artículo"
                );

            }
        );

    },

    async load() {

    },

    async destroy() {

        Logger.info(
            "Articles",
            "Módulo destruido."
        );

    }

};

export default Articles;