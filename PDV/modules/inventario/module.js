/**
 * ==========================================================
 * PDV
 * Archivo: inventario.js
 * Módulo: Inventario
 * Descripción: Administración del inventario y existencias.
 * Versión: 0.6.4
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

import GetArticles
    from "../../domain/article/use-cases/get-articles.js";

import LocalArticleRepository
    from "../../infrastructure/repositories/local/local-article-repository.js";

const Inventario = {

    async init() {

        Logger.success(
            "Inventario",
            "Módulo iniciado."
        );

        this.events();

    },

    events() {

    },

    async destroy() {

        Logger.info(
            "Inventario",
            "Módulo destruido."
        );

    }

};

const articleRepository =
    new LocalArticleRepository();

const getArticles =
    new GetArticles(
        articleRepository
    );

export default Inventario;