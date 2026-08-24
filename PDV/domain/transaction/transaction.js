/**
 * ==========================================================
 * PDV
 * Archivo: transaction.js
 * Módulo: Domain / Transaction
 * Descripción: Entidad del dominio Transacción / Venta.
 * Versión: 0.9.10
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

        this.returns =
            Array.isArray(data.returns)
                ? data.returns.map(item => ({ ...item }))
                : [];

        this.returnOperations =
            Array.isArray(data.returnOperations)
                ? data.returnOperations.map(operation => ({
                    ...operation,
                    items: Array.isArray(operation.items)
                        ? operation.items.map(item => ({ ...item }))
                        : []
                }))
                : [];

        this.returnCashId =
            data.returnCashId ?? null;

        this.returnedAmount =
            data.returnedAmount === null || data.returnedAmount === undefined
                ? null
                : Number(data.returnedAmount);

        this.returnedAt =
            data.returnedAt ?? null;

        // Se conservan para compatibilidad con ventas antiguas que fueron
        // canceladas antes de eliminar Cancelar del flujo de Ventas.
        this.cancelCashId =
            data.cancelCashId ?? null;

        this.cancelledAt =
            data.cancelledAt ?? null;

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

        if (this.returnedAmount !== null &&
            (!Number.isFinite(this.returnedAmount) || this.returnedAmount < 0)) {
            throw new Error(
                "El monto devuelto no es válido."
            );
        }

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

    cancel() {

        if (this.status !== TRANSACTION_STATUS.COMPLETED) {
            throw new Error(
                "Solo una venta completada puede cancelarse."
            );
        }

        if (this.hasReturns()) {
            throw new Error(
                "Una venta con devoluciones no puede cancelarse."
            );
        }

        this.status = TRANSACTION_STATUS.CANCELLED;
        this.touch();

    }

    addReturn(returnItems, cashId) {

        if (this.status !== TRANSACTION_STATUS.COMPLETED) {
            throw new Error(
                "Solo una venta completada puede tener devoluciones."
            );
        }

        if (!cashId) {
            throw new Error(
                "La devolución debe estar asociada a una Caja abierta."
            );
        }

        if (!Array.isArray(returnItems) || !returnItems.length) {
            throw new Error(
                "La devolución debe contener al menos un artículo."
            );
        }

        const normalized = returnItems.map(item => ({
            articleId: item.articleId,
            quantity: Number(item.quantity)
        }));

        normalized.forEach(item => {

            if (!item.articleId || !Number.isFinite(item.quantity) || item.quantity <= 0) {
                throw new Error(
                    "La cantidad a devolver debe ser mayor que cero."
                );
            }

            const sold =
                this.items.find(entry => entry.articleId === item.articleId);

            if (!sold) {
                throw new Error(
                    "El artículo no pertenece a esta venta."
                );
            }

            const returned =
                this.returns.find(entry => entry.articleId === item.articleId);

            const remaining =
                Number(sold.quantity) - Number(returned?.quantity ?? 0);

            if (item.quantity > remaining) {
                throw new Error(
                    `No se pueden devolver más unidades de las pendientes para "${item.articleId}".`
                );
            }

        });

        let operationAmount = 0;

        normalized.forEach(item => {

            const sold =
                this.items.find(entry => entry.articleId === item.articleId);

            const existing =
                this.returns.find(entry => entry.articleId === item.articleId);

            if (existing) {
                existing.quantity =
                    Number(existing.quantity) + Number(item.quantity);
            } else {
                this.returns.push({
                    articleId: item.articleId,
                    quantity: Number(item.quantity)
                });
            }

            operationAmount +=
                Number(item.quantity) * Number(sold.unitPrice);

        });

        const operation = {
            id: crypto.randomUUID(),
            cashId,
            amount: Number(operationAmount.toFixed(2)),
            items: normalized.map(item => ({ ...item })),
            createdAt: new Date().toISOString()
        };

        this.returnOperations.push(operation);
        this.returnCashId = cashId;
        this.returnedAmount = Number(
            this.returns.reduce((total, item) => {
                const sold = this.items.find(entry => entry.articleId === item.articleId);
                return total + (Number(item.quantity) * Number(sold?.unitPrice ?? 0));
            }, 0).toFixed(2)
        );
        this.returnedAt = operation.createdAt;
        this.touch();

        return operation;

    }

    hasReturns() {
        return this.returns.some(
            item => Number(item.quantity) > 0
        );
    }

    isFullyReturned() {

        if (!this.items.length) {
            return false;
        }

        return this.items.every(item => {

            const returned =
                this.returns.find(
                    entry => entry.articleId === item.articleId
                );

            return Number(returned?.quantity ?? 0) >= Number(item.quantity);

        });

    }

    registerCancellationCash(cashId) {

        if (!cashId) {
            throw new Error(
                "La cancelación debe estar asociada a una Caja abierta."
            );
        }

        this.cancelCashId = cashId;
        this.cancelledAt = new Date().toISOString();
        this.touch();

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
            returns: this.returns.map(item => ({ ...item })),
            returnOperations: this.returnOperations.map(operation => ({
                ...operation,
                items: operation.items.map(item => ({ ...item }))
            })),
            returnCashId: this.returnCashId,
            returnedAmount: this.returnedAmount,
            returnedAt: this.returnedAt,
            cancelCashId: this.cancelCashId,
            cancelledAt: this.cancelledAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };

    }

}
