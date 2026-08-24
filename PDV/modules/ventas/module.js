/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Ventas
 * Descripción: Registro y consulta de ventas.
 * Versión: 0.9.5
 * ==========================================================
 */

import Logger
    from "../../core/logger.js";

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

import CreateTransaction
    from "../../domain/transaction/use-cases/create-transaction.js";

import CompleteTransaction
    from "../../domain/transaction/use-cases/complete-transaction.js";

import GetTransactions
    from "../../domain/transaction/use-cases/get-transactions.js";

import GetCurrentCash
    from "../../domain/cash/use-cases/get-current-cash.js";

import LocalCashRepository
    from "../../infrastructure/repositories/local/local-cash-repository.js";

import LocalTransactionRepository
    from "../../infrastructure/repositories/local/local-transaction-repository.js";

const articleRepository =
    new LocalArticleRepository();

const movementRepository =
    new LocalMovementRepository();

const transactionRepository =
    new LocalTransactionRepository();

const cashRepository =
    new LocalCashRepository();

const getArticles =
    new GetArticles(
        articleRepository
    );

const createMovement =
    new CreateMovement(
        movementRepository
    );

const getInventory =
    new GetInventory(
        articleRepository,
        movementRepository
    );

const createTransaction =
    new CreateTransaction(
        transactionRepository,
        articleRepository,
        getInventory
    );

const getTransactions =
    new GetTransactions(
        transactionRepository
    );

const getCurrentCash =
    new GetCurrentCash(
        cashRepository,
        transactionRepository
    );

const completeTransaction =
    new CompleteTransaction(
        transactionRepository,
        articleRepository,
        createMovement,
        getInventory,
        getCurrentCash
    );

const Ventas = {

    elements: {},

    cart: [],

    async init() {

        Logger.success(
            "Ventas",
            "Módulo iniciado."
        );

        this.cart = [];

        this.cache();

        this.events();

        await this.load();

    },

    cache() {

        this.elements = {

            saleArticle:
                document.getElementById(
                    "saleArticle"
                ),

            saleQuantity:
                document.getElementById(
                    "saleQuantity"
                ),

            btnAddToCart:
                document.getElementById(
                    "btnAddToCart"
                ),

            saleCartTableBody:
                document.getElementById(
                    "saleCartTableBody"
                ),

            saleTotal:
                document.getElementById(
                    "saleTotal"
                ),

            btnCompleteSale:
                document.getElementById(
                    "btnCompleteSale"
                ),

            salesHistoryTableBody:
                document.getElementById(
                    "salesHistoryTableBody"
                )

        };

    },

    events() {

        this.elements.btnAddToCart
            .addEventListener(
                "click",
                () => this.addToCart()
            );

        this.elements.btnCompleteSale
            .addEventListener(
                "click",
                () => this.completeSale()
            );

    },

    async load() {

        this.loadArticles();

        this.renderCart();

        this.renderHistory();

    },

    loadArticles() {

        const articles =
            getArticles.execute()
                .filter(article => article.active);

        this.elements.saleArticle
            .replaceChildren();

        articles.forEach(article => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                article.id;

            option.textContent =
                `${article.code} - ${article.name} — ${this.formatCurrency(article.salePrice)}`;

            this.elements.saleArticle
                .appendChild(option);

        });

    },

    addToCart() {

        try {

            const articleId =
                this.elements.saleArticle.value;

            const quantity =
                Number(
                    this.elements.saleQuantity.value
                );

            if (!articleId) {

                throw new Error(
                    "Selecciona un artículo."
                );

            }

            if (quantity <= 0) {

                throw new Error(
                    "La cantidad debe ser mayor que cero."
                );

            }

            const article =
                getArticles.execute()
                    .find(
                        item => item.id === articleId
                    );

            if (!article) {

                throw new Error(
                    "El artículo no existe."
                );

            }

            const existing =
                this.cart.find(
                    item => item.articleId === article.id
                );

            if (existing) {

                existing.quantity += quantity;

            } else {

                this.cart.push({

                    articleId: article.id,

                    name: article.name,

                    code: article.code,

                    quantity,

                    unitPrice: article.salePrice

                });

            }

            this.renderCart();

            this.elements.saleQuantity.value =
                "1";

        } catch (error) {

            Logger.error(
                "Ventas",
                error.message
            );

        }

    },

    removeFromCart(articleId) {

        this.cart =
            this.cart.filter(
                item => item.articleId !== articleId
            );

        this.renderCart();

    },

    renderCart() {

        const body =
            this.elements.saleCartTableBody;

        body.replaceChildren();

        let total = 0;

        this.cart.forEach(item => {

            const row =
                document.createElement("tr");

            const name =
                document.createElement("td");

            name.textContent =
                `${item.code} - ${item.name}`;

            row.appendChild(name);

            const quantity =
                document.createElement("td");

            quantity.textContent =
                item.quantity;

            row.appendChild(quantity);

            const price =
                document.createElement("td");

            price.textContent =
                this.formatCurrency(item.unitPrice);

            row.appendChild(price);

            const lineTotal =
                item.quantity * item.unitPrice;

            total += lineTotal;

            const line =
                document.createElement("td");

            line.textContent =
                this.formatCurrency(lineTotal);

            row.appendChild(line);

            const actions =
                document.createElement("td");

            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent = "Quitar";

            button.addEventListener(
                "click",
                () => this.removeFromCart(item.articleId)
            );

            actions.appendChild(button);

            row.appendChild(actions);

            body.appendChild(row);

        });

        this.elements.saleTotal.textContent =
            this.formatCurrency(total);

        this.elements.btnCompleteSale.disabled =
            this.cart.length === 0;

    },

    completeSale() {

        try {

            if (!this.cart.length) {

                throw new Error(
                    "El carrito está vacío."
                );

            }

            const currentCash =
                getCurrentCash.execute();

            if (!currentCash) {

                throw new Error(
                    "No hay una Caja abierta. Abre la Caja antes de registrar una venta."
                );

            }

            const transaction =
                createTransaction.execute({

                    items: this.cart.map(item => ({

                        articleId: item.articleId,

                        quantity: item.quantity,

                        unitPrice: item.unitPrice

                    }))

                });

            const completed =
                completeTransaction.execute(
                    transaction.id
                );

            Logger.success(
                "Ventas",
                `Venta completada: ${completed.id}`
            );

            this.cart = [];

            this.renderCart();

            this.renderHistory();

        } catch (error) {

            Logger.error(
                "Ventas",
                error.message
            );

        }

    },

    renderHistory() {

        const transactions =
            getTransactions.execute();

        const body =
            this.elements.salesHistoryTableBody;

        body.replaceChildren();

        transactions.forEach(transaction => {

            const row =
                document.createElement("tr");

            const date =
                document.createElement("td");

            date.textContent =
                this.formatDate(transaction.createdAt);

            row.appendChild(date);

            const id =
                document.createElement("td");

            id.textContent =
                `#${transaction.id.slice(0, 8)}`;

            row.appendChild(id);

            const items =
                document.createElement("td");

            items.textContent =
                transaction.items.length;

            row.appendChild(items);

            const total =
                document.createElement("td");

            total.textContent =
                this.formatCurrency(transaction.total);

            row.appendChild(total);

            const status =
                document.createElement("td");

            status.textContent =
                this.translateStatus(transaction.status);

            row.appendChild(status);

            body.appendChild(row);

        });

    },

    formatCurrency(value) {

        return new Intl.NumberFormat(
            "es-MX",
            {
                style: "currency",
                currency: "MXN"
            }
        ).format(value);

    },

    formatDate(value) {

        return new Intl.DateTimeFormat(
            "es-MX",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        ).format(
            new Date(value)
        );

    },

    translateStatus(status) {

        switch (status) {

            case "COMPLETED":
                return "Completada";

            case "CANCELLED":
                return "Cancelada";

            case "DRAFT":
                return "Borrador";

            default:
                return status;

        }

    },

    async destroy() {

        Logger.info(
            "Ventas",
            "Módulo destruido."
        );

        this.elements = {};

        this.cart = [];

    }

};

export default Ventas;
