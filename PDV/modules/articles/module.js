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

        articleCode:
            document.getElementById(
                "articleCode"
            ),

        articleName:
            document.getElementById(
                "articleName"
            ),

        articleDescription:
            document.getElementById(
                "articleDescription"
            ),

        articleType:
            document.getElementById(
                "articleType"
            ),

        articlePurchasePrice:
            document.getElementById(
                "articlePurchasePrice"
            ),

        articleSalePrice:
            document.getElementById(
                "articleSalePrice"
            ),

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

                createArticle.execute({

                    code:
                        this.elements.articleCode
                            .value
                            .trim(),

                    name:
                        this.elements.articleName
                            .value
                            .trim(),

                    description:
                        this.elements.articleDescription
                            .value
                            .trim(),

                    type:
                        this.elements.articleType.value,

                    purchasePrice:
                        Number(
                            this.elements.articlePurchasePrice.value
                        ),

                    salePrice:
                        Number(
                            this.elements.articleSalePrice.value
                        )

                });

                console.log(
                    getArticles.execute()
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