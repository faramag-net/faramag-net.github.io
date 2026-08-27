/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Ventas
 * Descripción: Registro y consulta de ventas.
 * Versión: 0.9.19
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

import ReturnTransaction
    from "../../domain/transaction/use-cases/return-transaction.js";

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

const returnTransaction =
    new ReturnTransaction(
        transactionRepository,
        articleRepository,
        createMovement,
        getCurrentCash
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

    pendingReturnTransactionId: null,

    pendingReturnItems: [],

    async init() {

        Logger.success(
            "Ventas",
            "Módulo iniciado."
        );

        // El carrito representa una venta en proceso y debe sobrevivir
        // al cambio de módulo. Solo se vacía al finalizar la venta.
        if (!Array.isArray(this.cart)) {
            this.cart = [];
        }

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

            saleArticleSearch:
                document.getElementById(
                    "saleArticleSearch"
                ),

            saleQuantity:
                document.getElementById(
                    "saleQuantity"
                ),

            saleStock:
                document.getElementById(
                    "saleStock"
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
                ),

            salesHistorySearch:
                document.getElementById(
                    "salesHistorySearch"
                )

        };

    },

    events() {

        this.elements.salesHistorySearch?.addEventListener(
            "input",
            () => this.renderHistory()
        );

        this.elements.btnAddToCart
            .addEventListener(
                "click",
                () => this.addToCart()
            );

        this.elements.saleArticleSearch?.addEventListener(
            "input",
            () => this.loadArticles()
        );

        this.elements.saleArticle
            .addEventListener(
                "change",
                () => this.updateSelectedArticleStock()
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

        const search =
            (this.elements.saleArticleSearch?.value ?? "")
                .trim()
                .toLowerCase();

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

        const previousArticleId =
            this.elements.saleArticle.value;

        this.elements.saleArticle
            .replaceChildren();

        const inventory =
            getInventory.execute();

        articles.forEach(article => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                article.id;

            const inventoryItem =
                inventory.find(item => item.article.id === article.id);

            const stock =
                inventoryItem?.stock ?? 0;

            option.textContent =
                `${article.code} - ${article.name} — ${this.formatCurrency(article.salePrice)} — ${article.type === "INVENTORY" ? `Existencia: ${stock}` : "Sin control de inventario"}`;

                this.elements.saleArticle
                .appendChild(option);

        });

        if (articles.some(article => article.id === previousArticleId)) {
            this.elements.saleArticle.value = previousArticleId;
        } else if (articles.length) {
            this.elements.saleArticle.value = articles[0].id;
        }

        if (this.elements.btnAddToCart) {
            this.elements.btnAddToCart.disabled = articles.length === 0;
        }

        this.updateSelectedArticleStock();

    },

    updateSelectedArticleStock() {

        if (!this.elements.saleStock) return;

        const articleId =
            this.elements.saleArticle.value;

        const article =
            getArticles.execute().find(
                item => item.id === articleId
            );

        if (!article) {
            this.elements.saleStock.textContent = "Existencia: —";
            return;
        }

        if (article.type !== "INVENTORY") {
            this.elements.saleStock.textContent =
                "Existencia: no controlada";
            return;
        }

        const inventoryItem =
            getInventory.execute().find(
                item => item.article.id === article.id
            );

        const stock = inventoryItem?.stock ?? 0;

        this.elements.saleStock.textContent =
            `Existencia disponible: ${stock}`;

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
                    "No hay una Caja abierta. Abre la Caja antes de cobrar."
                );
            }

            this.openCheckoutDialog();

        } catch (error) {

            Logger.error(
                "Ventas",
                error.message
            );

        }

    },

    openCheckoutDialog() {

        const total = this.cart.reduce(
            (sum, item) =>
                sum + Number(item.quantity) * Number(item.unitPrice),
            0
        );

        const dialog = document.createElement("dialog");
        dialog.className = "sales-checkout-dialog";

        const title = document.createElement("h2");
        title.textContent = "Cobrar venta";
        dialog.appendChild(title);

        const totalLine = document.createElement("p");
        totalLine.textContent = `Total: ${this.formatCurrency(total)}`;
        totalLine.className = "checkout-total";
        dialog.appendChild(totalLine);

        const errorMessage = document.createElement("p");
        errorMessage.className = "checkout-error";
        errorMessage.hidden = true;
        errorMessage.setAttribute("role", "alert");
        dialog.appendChild(errorMessage);

        const field = document.createElement("div");
        field.className = "field";

        const label = document.createElement("label");
        label.textContent = "Efectivo recibido";
        label.htmlFor = "checkoutReceived";
        field.appendChild(label);

        const input = document.createElement("input");
        input.id = "checkoutReceived";
        input.type = "number";
        input.min = total.toFixed(2);
        input.step = "0.01";
        input.value = total.toFixed(2);
        field.appendChild(input);

        const change = document.createElement("strong");
        change.className = "checkout-change";
        change.textContent = `Cambio: ${this.formatCurrency(0)}`;
        field.appendChild(change);

        dialog.appendChild(field);

        const actions = document.createElement("div");
        actions.className = "form-actions";

        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.textContent = "Finalizar venta";

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Volver al carrito";

        const updateChange = () => {
            const received = Number(input.value);
            const difference = received - total;
            change.textContent =
                `Cambio: ${this.formatCurrency(Math.max(0, difference))}`;
            confirm.disabled = !Number.isFinite(received) || received < total;
        };

        input.addEventListener("input", updateChange);
        confirm.addEventListener("click", () => {
            this.finalizeCheckout(dialog, total, Number(input.value));
        });
        cancel.addEventListener("click", () => {
            dialog.close();
            dialog.remove();
        });

        actions.appendChild(confirm);
        actions.appendChild(cancel);
        dialog.appendChild(actions);

        document.body.appendChild(dialog);
        this.checkoutDialog = dialog;
        dialog.showModal();
        input.focus();
        input.select();
        updateChange();

    },

    finalizeCheckout(dialog, total, received) {

        try {

            if (!Number.isFinite(received) || received < total) {
                throw new Error(
                    "El efectivo recibido es insuficiente."
                );
            }

            const currentCash = getCurrentCash.execute();

            if (!currentCash) {
                throw new Error(
                    "La Caja ya no está abierta."
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
                    transaction.id,
                    {
                        method: "CASH",
                        received
                    }
                );

            Logger.success(
                "Ventas",
                `Venta completada: ${completed.id}`
            );

            this.cart = [];
            this.renderCart();
            this.renderHistory();

            dialog.close();
            dialog.remove();
            this.checkoutDialog = null;

        } catch (error) {

            if (dialog?.isConnected) {
                const message = dialog.querySelector(".checkout-error");
                if (message) {
                    message.textContent = `⚠️ ${error.message}`;
                    message.hidden = false;
                }
            }

            Logger.error(
                "Ventas",
                error.message
            );

        }

    },

    renderHistory() {

        const search =
            (this.elements.salesHistorySearch?.value ?? "").trim().toLowerCase();

        const transactions =
            getTransactions.execute().filter(transaction => {
                if (!search) return true;
                const articleText = transaction.items
                    .map(item => {
                        const article = getArticles.execute().find(a => a.id === item.articleId);
                        return `${article?.name ?? ""} ${article?.code ?? ""}`;
                    })
                    .join(" ");
                const haystack = `${transaction.id} ${this.formatDate(transaction.createdAt)} ${articleText}`.toLowerCase();
                return haystack.includes(search);
            });

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
                this.getOperationalStatus(transaction);

            row.appendChild(status);

            const actions =
                document.createElement("td");

            if (transaction.status === "COMPLETED" && !transaction.isFullyReturned()) {

                const returnButton =
                    document.createElement("button");

                returnButton.type = "button";
                returnButton.textContent = "Devolver";
                returnButton.addEventListener(
                    "click",
                    () => this.openReturnDialog(transaction.id)
                );

                actions.appendChild(returnButton);

            }

            row.appendChild(actions);
            body.appendChild(row);

        });

    },

    openReturnDialog(transactionId) {

        const transaction =
            getTransactions.execute()
                .find(item => item.id === transactionId);

        if (!transaction || transaction.status !== "COMPLETED" || transaction.isFullyReturned()) {
            return;
        }

        this.pendingReturnTransactionId = transactionId;
        this.pendingReturnItems = [];

        const dialog = document.createElement("dialog");
        dialog.className = "sales-return-dialog";

        const title = document.createElement("h2");
        title.textContent = `Devolver venta #${transaction.id.slice(0, 8)}`;
        dialog.appendChild(title);

        const description = document.createElement("p");
        description.textContent = "Selecciona las cantidades que el cliente devuelve. La venta original permanece en el historial.";
        dialog.appendChild(description);

        const table = document.createElement("table");
        const head = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["Artículo", "Vendido", "Devuelto", "Pendiente", "Devolver"].forEach(text => {
            const cell = document.createElement("th");
            cell.textContent = text;
            headRow.appendChild(cell);
        });
        head.appendChild(headRow);
        table.appendChild(head);

        const body = document.createElement("tbody");

        transaction.items.forEach(item => {
            const row = document.createElement("tr");
            const article = getArticles.execute().find(entry => entry.id === item.articleId);
            const returned = transaction.returns.find(entry => entry.articleId === item.articleId);
            const returnedQuantity = Number(returned?.quantity ?? 0);
            const remaining = Number(item.quantity) - returnedQuantity;

            const name = document.createElement("td");
            name.textContent = article?.name ?? "Artículo no disponible";
            row.appendChild(name);

            const sold = document.createElement("td");
            sold.textContent = String(item.quantity);
            row.appendChild(sold);

            const already = document.createElement("td");
            already.textContent = String(returnedQuantity);
            row.appendChild(already);

            const pending = document.createElement("td");
            pending.textContent = String(remaining);
            row.appendChild(pending);

            const inputCell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.max = String(remaining);
            input.step = "0.01";
            input.value = "0";
            input.dataset.articleId = item.articleId;
            input.dataset.unitPrice = String(item.unitPrice);
            input.addEventListener("input", () => {
                const value = Number(input.value);
                const safe = Number.isFinite(value) ? Math.min(Math.max(value, 0), remaining) : 0;
                input.value = String(safe);
            });
            inputCell.appendChild(input);
            row.appendChild(inputCell);

            body.appendChild(row);
        });

        table.appendChild(body);
        dialog.appendChild(table);

        const actions = document.createElement("div");
        actions.className = "form-actions";

        const confirmButton = document.createElement("button");
        confirmButton.type = "button";
        confirmButton.textContent = "Registrar devolución";
        confirmButton.addEventListener("click", () => {
            const items = [];
            body.querySelectorAll("input[data-article-id]").forEach(input => {
                const quantity = Number(input.value);
                if (quantity > 0) {
                    items.push({
                        articleId: input.dataset.articleId,
                        quantity
                    });
                }
            });

            if (!items.length) {
                Logger.error("Ventas", "Selecciona al menos un artículo para devolver.");
                return;
            }

            this.pendingReturnItems = items;
            this.returnSale(transactionId);
        });

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cerrar";
        cancelButton.addEventListener("click", () => this.closeReturnDialog());

        actions.appendChild(confirmButton);
        actions.appendChild(cancelButton);
        dialog.appendChild(actions);

        document.body.appendChild(dialog);
        this.returnDialog = dialog;
        dialog.showModal();

    },

    closeReturnDialog() {

        if (this.returnDialog) {
            this.returnDialog.close();
            this.returnDialog.remove();
        }

        this.returnDialog = null;
        this.pendingReturnTransactionId = null;
        this.pendingReturnItems = [];

    },

    returnSale(transactionId) {

        try {

            const confirmed =
                window.confirm(
                    "¿Registrar esta devolución? El importe correspondiente se descontará de la Caja y los artículos regresarán al inventario."
                );

            if (!confirmed) {
                return;
            }

            const result =
                returnTransaction.execute(
                    transactionId,
                    this.pendingReturnItems
                );

            Logger.success(
                "Ventas",
                `Devolución registrada: ${result.transaction.id}`
            );

            this.closeReturnDialog();
            this.renderHistory();

        } catch (error) {

            Logger.error(
                "Ventas",
                error.message
            );

        }

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

    getOperationalStatus(transaction) {

        if (transaction.status === "COMPLETED") {

            if (transaction.isFullyReturned()) {
                return "Devuelta";
            }

            if (transaction.hasReturns()) {
                return "Devolución parcial";
            }

        }

        return this.translateStatus(transaction.status);

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

        this.closeReturnDialog();

        if (this.checkoutDialog) {
            this.checkoutDialog.close();
            this.checkoutDialog.remove();
            this.checkoutDialog = null;
        }

        // El carrito se conserva al cambiar de módulo.
        // Solo se vacía después de completar la venta.
        this.elements = {};

    }

};

export default Ventas;
