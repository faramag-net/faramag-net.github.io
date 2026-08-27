/**
 * ==========================================================
 * PDV
 * Archivo: inventario.js
 * Módulo: Inventario
 * Descripción: Administración del inventario y existencias.
 * Versión: 0.9.19
 * ==========================================================
 */

// Core
import Logger from "../../core/logger.js";

import GetArticles
    from "../../domain/article/use-cases/get-articles.js";

import LocalArticleRepository
    from "../../infrastructure/repositories/local/local-article-repository.js";

import CreateMovement
    from "../../domain/movement/use-cases/create-movement.js";

import LocalMovementRepository
    from "../../infrastructure/repositories/local/local-movement-repository.js";

import GetInventory
    from "../../domain/movement/use-cases/get-inventory.js";
    
const Inventario = {

    elements: {},

    async init() {

        Logger.success(
            "Inventario",
            "Módulo iniciado."
        );

        this.cache();

        this.events();

        await this.load();

    },

    cache() {

        this.elements = {

            movementArticle:
                document.getElementById(
                    "movementArticle"
                ),

            movementArticleSearch:
                document.getElementById(
                    "movementArticleSearch"
                ),

            movementType:
                document.getElementById(
                    "movementType"
                ),

            movementQuantity:
                document.getElementById(
                    "movementQuantity"
                ),

            btnSaveMovement:
                document.getElementById(
                    "btnSaveMovement"
                ),

            inventoryTableBody:
                document.getElementById(
                    "inventoryTableBody"
                ),

            inventorySearch:
                document.getElementById(
                    "inventorySearch"
                )

        };

    },

    events() {

        this.elements.inventorySearch?.addEventListener(
            "input",
            () => this.renderInventory()
        );

        this.elements.movementArticleSearch?.addEventListener(
            "input",
            () => this.loadArticles()
        );

        this.elements.btnSaveMovement
            .addEventListener(

                "click",

                () => {

                    try {

                        const data = {

                            articleId:
                                this.elements
                                    .movementArticle
                                    .value,

                            type:
                                this.elements
                                    .movementType
                                    .value,

                            quantity:
                                Number(
                                    this.elements
                                        .movementQuantity
                                        .value
                                )

                        };

                        createMovement.execute(
                            data
                        );

                        Logger.success(
                            "Inventario",
                            "Movimiento registrado."
                        );

                        this.renderInventory();

                    } catch (error) {

                        Logger.error(

                            "Inventario",

                            error.message

                        );

                    }

                }

            );

    },

    async load() {

        this.loadArticles();

        this.renderInventory();

    },

    loadArticles() {

        const search =
            (this.elements.movementArticleSearch?.value ?? "")
                .trim()
                .toLowerCase();

        const previousArticleId =
            this.elements.movementArticle.value;

        const articles =
            getArticles.execute()
                .filter(article => article.active)
                .filter(article => {
                    if (!search) return true;
                    return [article.code, article.name, article.description]
                        .some(value =>
                            String(value ?? "")
                                .toLowerCase()
                                .includes(search)
                        );
                });

        this.elements.movementArticle
            .replaceChildren();

        articles
            .forEach(article => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                article.id;

            option.textContent =
                `${article.code} - ${article.name}`;

            this.elements.movementArticle
                .appendChild(
                    option
                );

        });

        if (articles.some(article => article.id === previousArticleId)) {
            this.elements.movementArticle.value = previousArticleId;
        } else if (articles.length) {
            this.elements.movementArticle.value = articles[0].id;
        }

    },

    renderInventory() {

        const search =
            (this.elements.inventorySearch?.value ?? "").trim().toLowerCase();

        const inventory =
            getInventory.execute().filter(item => {
                if (!search) return true;
                return [item.article?.code, item.article?.name]
                    .some(value => String(value ?? "").toLowerCase().includes(search));
            });

        this.elements.inventoryTableBody
            .replaceChildren();

        inventory.forEach(item => {

            const row =
                this.createRow(item);

            this.elements.inventoryTableBody
                .appendChild(row);

        });

    },

    createRow(item) {

        const row =
            document.createElement("tr");

        const code =
            document.createElement("td");

        code.textContent =
            item.article.code;

        row.appendChild(code);

        const name =
            document.createElement("td");

        name.textContent =
            item.article.name;

        row.appendChild(name);

        const stock =
            document.createElement("td");

        stock.textContent =
            item.stock;

        row.appendChild(stock);

        return row;

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

const movementRepository =
    new LocalMovementRepository();

const createMovement =
    new CreateMovement(
        movementRepository
    );

const getInventory =
    new GetInventory(

        articleRepository,

        movementRepository

    );

export default Inventario;