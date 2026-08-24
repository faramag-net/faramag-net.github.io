/**
 * ==========================================================
 * PDV
 * Archivo: transaction.js
 * Módulo: Domain / Transaction
 * Descripción: Entidad del dominio Transacción / Venta.
 * Versión: 0.9.5
 * ==========================================================
 */

export const TRANSACTION_STATUS = Object.freeze({

    DRAFT: "DRAFT",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED"

});

export const PAYMENT_METHOD = Object.freeze({

    CASH: "CASH"

});

export default class Transaction {

    constructor(data = {}) {

        this.id = data.id ?? null;

        this.status =
            data.status ?? TRANSACTION_STATUS.DRAFT;

        this.items =
            Array.isArray(data.items)
                ? data.items.map(item => ({ ...item }))
                : [];

        this.total =
            data.total ?? this.calculateTotal();

        this.cashId =
            data.cashId ?? null;

        this.paymentMethod =
            data.paymentMethod ?? null;

        this.createdAt =
            data.createdAt ?? new Date().toISOString();

        this.updatedAt =
            data.updatedAt ?? new Date().toISOString();

        this.validate();

    }

    validate() {

        if (!this.items.length) {
            throw new Error(
                "La venta debe contener al menos un artículo."
            );
        }

        this.items.forEach(item => {

            if (!item.articleId) {
                throw new Error(
                    "El artículo de la venta es obligatorio."
                );
            }

            if (Number(item.quantity) <= 0) {
                throw new Error(
                    "La cantidad de cada artículo debe ser mayor que cero."
                );
            }

            if (Number(item.unitPrice) <= 0) {
                throw new Error(
                    "El precio de cada artículo debe ser mayor que cero."
                );
            }

        });

        if (!Object.values(TRANSACTION_STATUS).includes(this.status)) {
            throw new Error(
                "El estado de la venta no es válido."
            );
        }

        if (this.paymentMethod !== null &&
            !Object.values(PAYMENT_METHOD).includes(this.paymentMethod)) {
            throw new Error(
                "El método de pago de la venta no es válido."
            );
        }

        this.total = this.calculateTotal();

    }

    calculateTotal() {

        return Number(
            this.items.reduce(
                (total, item) =>
                    total +
                    (Number(item.quantity) * Number(item.unitPrice)),
                0
            ).toFixed(2)
        );

    }

    complete() {

        if (this.status !== TRANSACTION_STATUS.DRAFT) {
            throw new Error(
                "Solo una venta en borrador puede completarse."
            );
        }

        if (!this.cashId) {
            throw new Error(
                "La venta debe estar asociada a una Caja abierta."
            );
        }

        if (!this.paymentMethod) {
            throw new Error(
                "La venta debe tener un método de pago."
            );
        }

        this.status = TRANSACTION_STATUS.COMPLETED;
        this.touch();

    }

    touch() {
        this.updatedAt = new Date().toISOString();
    }

    toJSON() {

        return {
            id: this.id,
            status: this.status,
            items: this.items.map(item => ({ ...item })),
            total: this.total,
            cashId: this.cashId,
            paymentMethod: this.paymentMethod,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };

    }

}
