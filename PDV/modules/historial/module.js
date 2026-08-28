/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Historial
 * Descripción: Consulta básica de ventas y movimientos.
 * 0.9.20
 * ==========================================================
 */

import Logger
    from "../../core/logger.js";

import Pagination
    from "../../core/pagination.js";

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

    transactionsPage: 1,
    transactionsPageSize: 25,
    movementsPage: 1,
    movementsPageSize: 25,

    async init() {

        Logger.success(
            "Historial",
            "Módulo iniciado."
        );

        this.cache();

        this.events();
        this.load();

    },

    events() {

        this.elements.transactionsSearch?.addEventListener(
            "input",
            () => {
                this.transactionsPage = 1;
                this.renderTransactions();
            }
        );

        this.elements.movementsSearch?.addEventListener(
            "input",
            () => {
                this.movementsPage = 1;
                this.renderMovements();
            }
        );

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
                ),

            transactionsSearch:
                document.getElementById(
                    "historyTransactionsSearch"
                ),

            movementsSearch:
                document.getElementById(
                    "historyMovementsSearch"
                ),

            transactionsPagination:
                document.getElementById(
                    "historyTransactionsPagination"
                ),

            movementsPagination:
                document.getElementById(
                    "historyMovementsPagination"
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

        const search =
            (this.elements.transactionsSearch?.value ?? "").trim().toLowerCase();

        const transactions =
            getTransactions.execute().filter(transaction => {
                if (!search) return true;
                const articleText = transaction.items
                    .map(item => {
                        const article = this.articles.find(a => a.id === item.articleId);
                        return `${article?.name ?? ""} ${article?.code ?? ""}`;
                    })
                    .join(" ");
                return `${transaction.id} ${this.formatDate(transaction.createdAt)} ${articleText}`
                    .toLowerCase().includes(search);
            });

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
            Pagination.create({
                container: this.elements.transactionsPagination,
                total: 0,
                page: 1,
                pageSize: this.transactionsPageSize,
                onChange: () => {}
            });

            return;

        }

        const start = (this.transactionsPage - 1) * this.transactionsPageSize;
        const visibleTransactions = transactions.slice(start, start + this.transactionsPageSize);

        Pagination.create({
            container: this.elements.transactionsPagination,
            total: transactions.length,
            page: this.transactionsPage,
            pageSize: this.transactionsPageSize,
            onChange: (page, size) => {
                this.transactionsPage = page;
                this.transactionsPageSize = size;
                this.renderTransactions();
            }
        });

        visibleTransactions.forEach(transaction => {

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
                    this.getTransactionStatusLabel(transaction)
                )
            );

            body.appendChild(row);

        });

    },

    renderMovements() {

        const search =
            (this.elements.movementsSearch?.value ?? "").trim().toLowerCase();

        const movements =
            getMovements.execute()
                .filter(movement => {
                    if (!search) return true;
                    const article = this.articles.find(item => item.id === movement.articleId);
                    const haystack = `${movement.type} ${movement.reason ?? ""} ${article?.name ?? ""} ${article?.code ?? ""} ${movement.transactionId ?? ""} ${this.formatDate(movement.createdAt)}`.toLowerCase();
                    return haystack.includes(search);
                })
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
            Pagination.create({
                container: this.elements.movementsPagination,
                total: 0,
                page: 1,
                pageSize: this.movementsPageSize,
                onChange: () => {}
            });

            return;

        }

        const start = (this.movementsPage - 1) * this.movementsPageSize;
        const visibleMovements = movements.slice(start, start + this.movementsPageSize);

        Pagination.create({
            container: this.elements.movementsPagination,
            total: movements.length,
            page: this.movementsPage,
            pageSize: this.movementsPageSize,
            onChange: (page, size) => {
                this.movementsPage = page;
                this.movementsPageSize = size;
                this.renderMovements();
            }
        });

        visibleMovements.forEach(movement => {

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

    getTransactionStatusLabel(transaction) {

        if (transaction.status === "CANCELLED") {
            return "Cancelada";
        }

        if (transaction.status === "COMPLETED") {

            if (transaction.isFullyReturned()) {
                return "Devuelta";
            }

            if (transaction.hasReturns()) {
                return "Devolución parcial";
            }

            return "Completada";
        }

        if (transaction.status === "DRAFT") {
            return "Borrador";
        }

        return transaction.status;

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
