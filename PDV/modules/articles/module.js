/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Articles
 * Descripción: Administración del catálogo de artículos.
 * Versión: 0.9.18
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
    
import UpdateArticle
    from "../../domain/article/use-cases/update-article.js";

import DeactivateArticle
    from "../../domain/article/use-cases/deactivate-article.js";

import ActivateArticle
    from "../../domain/article/use-cases/activate-article.js";


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

const updateArticle =
    new UpdateArticle(
        repository
    );

const deactivateArticle =
    new DeactivateArticle(
        repository
    );

const activateArticle =
    new ActivateArticle(
        repository
    );

const Articles = {

    elements: {},

    editingArticle: null,

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
            ),

        articlesTableBody:
            document.getElementById(
                "articlesTableBody"
            ),

        articlesSearch:
            document.getElementById(
                "articlesSearch"
            ),

    };

    },

    events() {

    this.elements.articlesSearch?.addEventListener(
        "input",
        () => this.renderTable()
    );

    this.elements.btnSaveArticle
        .addEventListener(
            "click",
            () => {

                try {

                    const data = {

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

                    };

                    if (this.editingArticle === null) {

                        createArticle.execute(
                            data
                        );

                    } else {

                        updateArticle.execute(

                            this.editingArticle.id,

                            data

                        );

                        this.editingArticle = null;

                    }

                    this.clearForm();

                    this.elements.btnSaveArticle.textContent =
                        "Guardar artículo";

                    this.renderTable();

                } catch (error) {

                    Logger.error(
                        "Articles",
                        error.message
                    );

                }

            }
        );

    },

    renderTable() {

        const search =
            (this.elements.articlesSearch?.value ?? "").trim().toLowerCase();

        const articles =
            getArticles.execute().filter(article => {
                if (!search) return true;
                return [article.code, article.name, article.description]
                    .some(value => String(value ?? "").toLowerCase().includes(search));
            });

        this.elements.articlesTableBody.replaceChildren();

        articles.forEach(article => {

            const row =
                this.createRow(article);

            this.elements.articlesTableBody
                .appendChild(row);

        });

    },

    async load() {

        this.renderTable();

    },


    createRow(article) {

        const row =
            document.createElement("tr");

        const code =
            document.createElement("td");

        code.textContent =
            article.code;

        row.appendChild(code);

        const name =
            document.createElement("td");

        name.textContent =
            article.name;

        row.appendChild(name);

        const type =
            document.createElement("td");

        type.textContent =
            article.type;

        row.appendChild(type);

        const price =
            document.createElement("td");

        price.textContent =
            article.salePrice;

        row.appendChild(price);

        const status =
            document.createElement("td");

        status.textContent =
            article.active
                ? "Activo"
                : "Inactivo";

        row.appendChild(status);

        const actions =
            document.createElement("td");

        const editButton =
            document.createElement("button");

        editButton.type = "button";

        editButton.textContent = "Editar";

        editButton.addEventListener(
            "click",
            () => {

                this.editingArticle =
                    article;

                this.elements.articleCode.value =
                    article.code;

                this.elements.articleName.value =
                    article.name;

                this.elements.articleDescription.value =
                    article.description;

                this.elements.articleType.value =
                    article.type;

                this.elements.articlePurchasePrice.value =
                    article.purchasePrice;

                this.elements.articleSalePrice.value =
                    article.salePrice;
                
                this.elements.btnSaveArticle.textContent =
                    "Actualizar artículo";

            }
        );

        const deactivateButton =
            document.createElement("button");

        deactivateButton.type = "button";

        deactivateButton.textContent =
            article.active
                ? "Desactivar"
                : "Activar";

        deactivateButton.addEventListener(
            "click",
            () => {

                if (article.active) {

                    deactivateArticle.execute(
                        article.id
                    );

                } else {

                    activateArticle.execute(
                        article.id
                    );

                }

                this.renderTable();

            }
        );

        actions.appendChild(
            editButton
        );

        actions.appendChild(
            deactivateButton
        );

        row.appendChild(
            actions
        );

        return row;

    },

    clearForm() {

        this.elements.articleCode.value = "";

        this.elements.articleName.value = "";

        this.elements.articleDescription.value = "";

        this.elements.articleType.value = "INVENTORY";

        this.elements.articlePurchasePrice.value = "";

        this.elements.articleSalePrice.value = "";

    },

    async destroy() {

        Logger.info(
            "Articles",
            "Módulo destruido."
        );

    },

};

export default Articles;