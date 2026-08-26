/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Caja
 * Descripción: Administración de Caja e historial de sesiones.
 * Versión: 0.9.13
 * ==========================================================
 */

import Logger
    from "../../core/logger.js";

import LocalCashRepository
    from "../../infrastructure/repositories/local/local-cash-repository.js";

import LocalTransactionRepository
    from "../../infrastructure/repositories/local/local-transaction-repository.js";

import OpenCash
    from "../../domain/cash/use-cases/open-cash.js";

import GetCurrentCash
    from "../../domain/cash/use-cases/get-current-cash.js";

import GetCashSummary
    from "../../domain/cash/use-cases/get-cash-summary.js";

import CloseCash
    from "../../domain/cash/use-cases/close-cash.js";

const cashRepository =
    new LocalCashRepository();

const transactionRepository =
    new LocalTransactionRepository();

const openCash =
    new OpenCash(cashRepository);

const getCurrentCash =
    new GetCurrentCash(
        cashRepository,
        transactionRepository
    );

const getCashSummary =
    new GetCashSummary(transactionRepository);

const closeCash =
    new CloseCash(
        cashRepository,
        getCurrentCash
    );

const Caja = {

    elements: {},

    async init() {

        this.cache();
        this.events();
        this.render();

        Logger.success(
            "Caja",
            "Módulo iniciado."
        );

    },

    cache() {

        this.elements = {

            openCard:
                document.getElementById("cashOpenCard"),

            currentCard:
                document.getElementById("cashCurrentCard"),

            resultCard:
                document.getElementById("cashResultCard"),

            openingAmount:
                document.getElementById("cashOpeningAmount"),

            closingAmount:
                document.getElementById("cashClosingAmount"),

            openingDisplay:
                document.getElementById("cashOpeningDisplay"),

            salesDisplay:
                document.getElementById("cashSalesDisplay"),

            refundsDisplay:
                document.getElementById("cashRefundsDisplay"),

            netSalesDisplay:
                document.getElementById("cashNetSalesDisplay"),

            expectedDisplay:
                document.getElementById("cashExpectedDisplay"),

            closedExpected:
                document.getElementById("cashClosedExpected"),

            closedAmount:
                document.getElementById("cashClosedAmount"),

            closedDifference:
                document.getElementById("cashClosedDifference"),

            historyBody:
                document.getElementById("cashHistoryBody"),

            historyCount:
                document.getElementById("cashHistoryCount"),

            historyEmpty:
                document.getElementById("cashHistoryEmpty"),

            openButton:
                document.getElementById("btnOpenCash"),

            closeButton:
                document.getElementById("btnCloseCash")

        };

    },

    events() {

        this.elements.openButton.addEventListener(
            "click",
            () => this.open()
        );

        this.elements.closeButton.addEventListener(
            "click",
            () => this.close()
        );

    },

    render() {

        const current =
            getCurrentCash.execute();

        if (current) {
            this.showCurrent(current);
        } else {
            this.showOpen();
        }

        this.renderHistory();

    },

    showOpen() {

        this.elements.openCard.hidden = false;
        this.elements.currentCard.hidden = true;

    },

    showCurrent(current) {

        this.elements.openCard.hidden = true;
        this.elements.currentCard.hidden = false;

        this.elements.openingDisplay.textContent =
            this.formatCurrency(current.cash.openingAmount);

        this.elements.salesDisplay.textContent =
            this.formatCurrency(current.salesTotal);

        this.elements.refundsDisplay.textContent =
            this.formatCurrency(current.refundsTotal);

        this.elements.netSalesDisplay.textContent =
            this.formatCurrency(current.netSalesTotal);

        this.elements.expectedDisplay.textContent =
            this.formatCurrency(current.expectedAmount);

        this.elements.closingAmount.value =
            current.expectedAmount.toFixed(2);

    },

    open() {

        try {

            const amount =
                Number(this.elements.openingAmount.value);

            const cash =
                openCash.execute(amount);

            Logger.success(
                "Caja",
                `Caja abierta: ${cash.id}`
            );

            this.render();

        } catch (error) {

            Logger.error(
                "Caja",
                error.message
            );

        }

    },

    close() {

        try {

            const amount =
                Number(this.elements.closingAmount.value);

            const result =
                closeCash.execute(amount);

            this.elements.closedExpected.textContent =
                this.formatCurrency(result.expectedAmount);

            this.elements.closedAmount.textContent =
                this.formatCurrency(result.closingAmount);

            this.elements.closedDifference.textContent =
                this.formatCurrency(result.difference);

            this.elements.resultCard.hidden = false;

            Logger.success(
                "Caja",
                "Caja cerrada correctamente."
            );

            this.render();

        } catch (error) {

            Logger.error(
                "Caja",
                error.message
            );

        }

    },

    renderHistory() {

        const cashes =
            cashRepository.findAll();

        this.elements.historyBody.replaceChildren();

        this.elements.historyCount.textContent =
            `${cashes.length} ${cashes.length === 1 ? "sesión" : "sesiones"}`;

        this.elements.historyEmpty.hidden =
            cashes.length > 0;

        for (const cash of cashes) {

            const summary =
                getCashSummary.execute(cash);

            const row =
                document.createElement("tr");

            this.appendCell(row, this.formatDate(cash.openedAt));
            this.appendCell(row, cash.closedAt ? this.formatDate(cash.closedAt) : "—");
            this.appendCell(row, this.formatCurrency(cash.openingAmount));
            this.appendCell(row, this.formatCurrency(summary.netSalesTotal));
            this.appendCell(row, this.formatCurrency(summary.expectedAmount));
            this.appendCell(
                row,
                cash.closingAmount === null
                    ? "—"
                    : this.formatCurrency(cash.closingAmount)
            );
            this.appendCell(
                row,
                summary.difference === null
                    ? "—"
                    : this.formatCurrency(summary.difference)
            );
            this.appendCell(
                row,
                cash.status === "OPEN" ? "Abierta" : "Cerrada"
            );

            this.elements.historyBody.appendChild(row);

        }

    },

    appendCell(row, value) {

        const cell =
            document.createElement("td");

        cell.textContent = value;
        row.appendChild(cell);

    },

    formatDate(value) {

        return new Intl.DateTimeFormat(
            "es-MX",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        ).format(new Date(value));

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

    async destroy() {

        Logger.info(
            "Caja",
            "Módulo destruido."
        );

        this.elements = {};

    }

};

export default Caja;
