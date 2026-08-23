/**
 * ==========================================================
 * PDV
 * Archivo: cash.js
 * Módulo: Domain / Cash
 * Descripción: Entidad de sesión de Caja.
 * Versión: 0.9.3
 * ==========================================================
 */

export const CASH_STATUS = Object.freeze({

    OPEN: "OPEN",

    CLOSED: "CLOSED"

});

export default class Cash {

    constructor(data = {}) {

        this.id =
            data.id ?? null;

        this.status =
            data.status ?? CASH_STATUS.OPEN;

        this.openingAmount =
            Number(data.openingAmount ?? 0);

        this.openedAt =
            data.openedAt ?? new Date().toISOString();

        this.closedAt =
            data.closedAt ?? null;

        this.closingAmount =
            data.closingAmount === null || data.closingAmount === undefined
                ? null
                : Number(data.closingAmount);

        this.validate();

    }

    validate() {

        if (!Object.values(CASH_STATUS).includes(this.status)) {

            throw new Error(
                "El estado de Caja no es válido."
            );

        }

        if (!Number.isFinite(this.openingAmount) || this.openingAmount < 0) {

            throw new Error(
                "El monto inicial de Caja debe ser un número mayor o igual a cero."
            );

        }

        if (this.closingAmount !== null &&
            (!Number.isFinite(this.closingAmount) || this.closingAmount < 0)) {

            throw new Error(
                "El monto de cierre debe ser un número mayor o igual a cero."
            );

        }

        if (this.status === CASH_STATUS.CLOSED && !this.closedAt) {

            throw new Error(
                "Una Caja cerrada debe tener fecha de cierre."
            );

        }

    }

    close(amount) {

        if (this.status !== CASH_STATUS.OPEN) {

            throw new Error(
                "La Caja ya está cerrada."
            );

        }

        const value = Number(amount);

        if (!Number.isFinite(value) || value < 0) {

            throw new Error(
                "El monto de cierre debe ser un número mayor o igual a cero."
            );

        }

        this.closingAmount =
            Number(value.toFixed(2));

        this.closedAt =
            new Date().toISOString();

        this.status =
            CASH_STATUS.CLOSED;

    }

    toJSON() {

        return {

            id: this.id,

            status: this.status,

            openingAmount: this.openingAmount,

            openedAt: this.openedAt,

            closedAt: this.closedAt,

            closingAmount: this.closingAmount

        };

    }

}
