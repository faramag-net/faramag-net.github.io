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

import CreateArticle
    from "../../domain/article/use-cases/create-article.js";

import GetArticles
    from "../../domain/article/use-cases/get-articles.js";

import LocalArticleRepository
    from "../../infrastructure/repositories/local/local-article-repository.js";


const repository =
    new LocalArticleRepository();

const createArticle =
    new CreateArticle(
        repository
    );

const getArticles =
    new GetArticles(
        repository
    );

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