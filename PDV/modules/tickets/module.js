/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Tickets
 * Descripción: Consulta y visualización de tickets virtuales.
 * Versión: 0.9.5
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

import LocalCashRepository
    from "../../infrastructure/repositories/local/local-cash-repository.js";

import LocalTransactionRepository
    from "../../infrastructure/repositories/local/local-transaction-repository.js";

const articleRepository =
    new LocalArticleRepository();

const transactionRepository =
    new LocalTransactionRepository();

const cashRepository =
    new LocalCashRepository();

const getArticles =
    new GetArticles(
        articleRepository
    );

const getTransactions =
    new GetTransactions(
        transactionRepository
    );

const Tickets = {

    elements: {},

    transactions: [],

    articles: [],

    async init() {

        Logger.success(
            "Tickets",
            "Módulo iniciado."
        );

        this.cache();

        this.events();

        this.load();

    },

    cache() {

        this.elements = {

            ticketSale:
                document.getElementById(
                    "ticketSale"
                ),

            ticketPreview:
                document.getElementById(
                    "ticketPreview"
                )

        };

    },

    events() {

        this.elements.ticketSale
            .addEventListener(
                "change",
                () => this.renderSelectedTicket()
            );

    },

    load() {

        this.transactions =
            getTransactions.execute()
                .filter(
                    transaction =>
                        transaction.status === "COMPLETED"
                );

        this.articles =
            getArticles.execute();

        this.renderSelector();

        this.renderSelectedTicket();

    },

    renderSelector() {

        const select =
            this.elements.ticketSale;

        select.replaceChildren();

        if (!this.transactions.length) {

            const option =
                document.createElement("option");

            option.value = "";
            option.textContent = "No hay ventas completadas";

            select.appendChild(option);

            select.disabled = true;

            return;

        }

        select.disabled = false;

        this.transactions.forEach(
            transaction => {

                const option =
                    document.createElement("option");

                option.value = transaction.id;

                option.textContent =
                    `#${transaction.id.slice(0, 8)} — ${this.formatDate(transaction.createdAt)} — ${this.formatCurrency(transaction.total)}`;

                select.appendChild(option);

            }
        );

        select.value =
            this.transactions[0].id;

    },

    renderSelectedTicket() {

        const id =
            this.elements.ticketSale.value;

        const transaction =
            this.transactions.find(
                item => item.id === id
            );

        const preview =
            this.elements.ticketPreview;

        preview.replaceChildren();

        if (!transaction) {

            const empty =
                document.createElement("p");

            empty.className = "ticket-empty";

            empty.textContent =
                "Todavía no hay una venta para mostrar.";

            preview.appendChild(empty);

            return;

        }

        preview.appendChild(
            this.createTicket(transaction)
        );

    },

    createTicket(transaction) {

        const ticket =
            document.createElement("article");

        ticket.className = "ticket";

        const header =
            document.createElement("header");

        header.className = "ticket-header";

        const title =
            document.createElement("h3");

        title.textContent = "PDV";

        header.appendChild(title);

        const ticketNumber =
            document.createElement("p");

        ticketNumber.textContent =
            `Ticket #${transaction.id.slice(0, 8)}`;

        header.appendChild(ticketNumber);

        const meta =
            document.createElement("div");

        meta.className = "ticket-meta";

        const date =
            document.createElement("p");

        date.textContent =
            `Fecha: ${this.formatDate(transaction.createdAt)}`;

        meta.appendChild(date);

        const status =
            document.createElement("p");

        status.textContent = "Estado: Completada";

        meta.appendChild(status);

        const payment =
            document.createElement("p");

        payment.textContent =
            `Pago: ${transaction.paymentMethod === "CASH" ? "Efectivo" : "No especificado"}`;

        meta.appendChild(payment);

        if (transaction.paymentReceived !== null && transaction.paymentReceived !== undefined) {

            const received = document.createElement("p");
            received.textContent =
                `Recibido: ${this.formatCurrency(transaction.paymentReceived)}`;
            meta.appendChild(received);

            const change = document.createElement("p");
            change.textContent =
                `Cambio: ${this.formatCurrency(transaction.change ?? 0)}`;
            meta.appendChild(change);

        }

        if (transaction.cashId) {

            const cash =
                cashRepository.findById(transaction.cashId);

            const cashLine =
                document.createElement("p");

            cashLine.textContent =
                `Caja: #${transaction.cashId.slice(0, 8)}${cash ? "" : " (registro no disponible)"}`;

            meta.appendChild(cashLine);

        }

        ticket.appendChild(header);
        ticket.appendChild(meta);

        const table =
            document.createElement("table");

        table.className = "ticket-items";

        const thead =
            document.createElement("thead");

        const headerRow =
            document.createElement("tr");

        ["Artículo", "Cant.", "Total"].forEach(
            text => {

                const cell =
                    document.createElement("th");

                cell.textContent = text;

                headerRow.appendChild(cell);

            }
        );

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody =
            document.createElement("tbody");

        transaction.items.forEach(item => {

            const row =
                document.createElement("tr");

            const article =
                this.articles.find(
                    current =>
                        current.id === item.articleId
                );

            const name =
                document.createElement("td");

            name.textContent =
                article
                    ? article.name
                    : "Artículo no disponible";

            row.appendChild(name);

            const quantity =
                document.createElement("td");

            quantity.textContent =
                item.quantity;

            row.appendChild(quantity);

            const total =
                document.createElement("td");

            total.textContent =
                this.formatCurrency(
                    Number(item.quantity) *
                    Number(item.unitPrice)
                );

            row.appendChild(total);

            tbody.appendChild(row);

        });

        table.appendChild(tbody);
        ticket.appendChild(table);

        const total =
            document.createElement("div");

        total.className = "ticket-total";

        const totalLabel =
            document.createElement("span");

        totalLabel.textContent = "TOTAL";

        total.appendChild(totalLabel);

        const totalValue =
            document.createElement("span");

        totalValue.textContent =
            this.formatCurrency(transaction.total);

        total.appendChild(totalValue);

        ticket.appendChild(total);

        const footer =
            document.createElement("footer");

        footer.className = "ticket-footer";

        footer.textContent =
            "Gracias por su compra.";

        ticket.appendChild(footer);

        return ticket;

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

    async destroy() {

        Logger.info(
            "Tickets",
            "Módulo destruido."
        );

        this.elements = {};
        this.transactions = [];
        this.articles = [];

    }

};

export default Tickets;
