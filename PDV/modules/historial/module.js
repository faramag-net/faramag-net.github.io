/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Historial
 * Descripción: Consulta básica de ventas y movimientos.
 * Versión: 0.9.7
 * ==========================================================
 */

import Logger
    from "../../core/logger.js";

import GetArticles
    from "../../domain/article/use-cases/get-articles.js";

import LocalArticleRepository
    from "../../infrastructure/repositories/local/local-article-repository.js";

import GetTransactions
    from "../../domain/transaction/use-cases/get-transactions.js";

import LocalTransactionRepository
    from "../../infrastructure/repositories/local/local-transaction-repository.js";

import GetMovements
    from "../../domain/movement/use-cases/get-movements.js";

import LocalMovementRepository
    from "../../infrastructure/repositories/local/local-movement-repository.js";

const articleRepository =
    new LocalArticleRepository();

const transactionRepository =
    new LocalTransactionRepository();

const movementRepository =
    new LocalMovementRepository();

const getArticles =
    new GetArticles(articleRepository);

const getTransactions =
    new GetTransactions(transactionRepository);

const getMovements =
    new GetMovements(movementRepository);

const Historial = {

    elements: {},

    articles: [],

    async init() {

        Logger.success(
            "Historial",
            "Módulo iniciado."
        );

        this.cache();

        this.load();

    },

    cache() {

        this.elements = {

            transactionsBody:
                document.getElementById(
                    "historyTransactionsBody"
                ),

            movementsBody:
                document.getElementById(
                    "historyMovementsBody"
                )

        };

    },

    load() {

        this.articles =
            getArticles.execute();

        this.renderTransactions();

        this.renderMovements();

    },

    renderTransactions() {

        const transactions =
            getTransactions.execute();

        const body =
            this.elements.transactionsBody;

        body.replaceChildren();

        if (!transactions.length) {

            body.appendChild(
                this.createEmptyRow(
                    4,
                    "No hay ventas registradas."
                )
            );

            return;

        }

        transactions.forEach(transaction => {

            const row =
                document.createElement("tr");

            row.appendChild(
                this.createCell(
                    this.shortId(transaction.id)
                )
            );

            row.appendChild(
                this.createCell(
                    this.formatDate(transaction.createdAt)
                )
            );

            row.appendChild(
                this.createCell(
                    this.formatCurrency(transaction.total)
                )
            );

            row.appendChild(
                this.createCell(
                    this.getStatusLabel(transaction.status)
                )
            );

            body.appendChild(row);

        });

    },

    renderMovements() {

        const movements =
            getMovements.execute()
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                );

        const body =
            this.elements.movementsBody;

        body.replaceChildren();

        if (!movements.length) {

            body.appendChild(
                this.createEmptyRow(
                    5,
                    "No hay movimientos registrados."
                )
            );

            return;

        }

        movements.forEach(movement => {

            const row =
                document.createElement("tr");

            const article =
                this.articles.find(
                    item => item.id === movement.articleId
                );

            row.appendChild(
                this.createCell(
                    this.formatDate(movement.createdAt)
                )
            );

            row.appendChild(
                this.createCell(
                    this.getMovementLabel(movement)
                )
            );

            row.appendChild(
                this.createCell(
                    article
                        ? article.name
                        : "Artículo no disponible"
                )
            );

            row.appendChild(
                this.createCell(
                    String(movement.quantity)
                )
            );

            row.appendChild(
                this.createCell(
                    this.getReferenceLabel(movement)
                )
            );

            body.appendChild(row);

        });

    },

    createCell(value) {

        const cell =
            document.createElement("td");

        cell.textContent =
            value;

        return cell;

    },

    createEmptyRow(colspan, message) {

        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.colSpan =
            colspan;

        cell.className =
            "empty-state";

        cell.textContent =
            message;

        row.appendChild(cell);

        return row;

    },

    getStatusLabel(status) {

        const labels = {
            DRAFT: "Borrador",
            COMPLETED: "Completada",
            CANCELLED: "Cancelada"
        };

        return labels[status] ?? status;

    },

    getMovementLabel(movement) {

        if (movement.reason === "CANCEL") {
            return "Cancelación";
        }

        if (movement.reason === "RETURN") {
            return "Devolución";
        }

        if (movement.type === "EXIT" && movement.transactionId) {
            return "Venta";
        }

        if (movement.type === "ENTRY") {
            return "Entrada";
        }

        if (movement.type === "EXIT") {
            return "Salida";
        }

        return movement.type;

    },

    getReferenceLabel(movement) {

        if (movement.transactionId) {
            return `Venta #${this.shortId(movement.transactionId)}`;
        }

        return "—";

    },

    shortId(id) {

        return String(id ?? "—").slice(0, 8);

    },

    formatDate(value) {

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString(
            "es-MX",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );

    },

    formatCurrency(value) {

        return new Intl.NumberFormat(
            "es-MX",
            {
                style: "currency",
                currency: "MXN"
            }
        ).format(Number(value) || 0);

    },

    async destroy() {

        Logger.info(
            "Historial",
            "Módulo destruido."
        );

        this.elements = {};
        this.articles = [];

    }

};

export default Historial;
