/**
 * ==========================================================
 * PDV
 * Archivo: movement.js
 * Módulo: Domain / Movement
 * Descripción: Entidad del dominio Movimiento.
 * Versión: 0.9.1
 * ==========================================================
 */

export default class Movement {

    constructor(data = {}) {

        this.id =
            data.id ?? null;

        this.articleId =
            data.articleId ?? null;

        this.type =
            data.type ?? "";

        this.quantity =
            data.quantity ?? 0;

        this.transactionId =
            data.transactionId ?? null;

        this.reason =
            data.reason ?? null;

        this.createdAt =
            data.createdAt ??
            new Date().toISOString();

        this.validate();

    }

    validate() {

        if (!this.articleId) {

            throw new Error(
                "El artículo es obligatorio."
            );

        }

        if (!this.type.trim()) {

            throw new Error(
                "El tipo de movimiento es obligatorio."
            );

        }

        if (this.quantity <= 0) {

            throw new Error(
                "La cantidad debe ser mayor que cero."
            );

        }

    }

    toJSON() {

        return {

            id: this.id,

            articleId: this.articleId,

            type: this.type,

            quantity: this.quantity,

            transactionId: this.transactionId,

            reason: this.reason,

            createdAt: this.createdAt

        };

    }

}