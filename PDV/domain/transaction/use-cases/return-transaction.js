/**
 * ==========================================================
 * PDV
 * Archivo: return-transaction.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Registra una devolución parcial o total de una venta.
 * Versión: 0.9.10
 * ==========================================================
 */

import {
    TRANSACTION_STATUS
} from "../transaction.js";

export default class ReturnTransaction {

    constructor(
        transactionRepository,
        articleRepository,
        createMovement,
        getCurrentCash
    ) {

        this.transactionRepository = transactionRepository;
        this.articleRepository = articleRepository;
        this.createMovement = createMovement;
        this.getCurrentCash = getCurrentCash;

    }

    execute(transactionId, returnItems) {

        const transaction =
            this.transactionRepository.findById(transactionId);

        if (!transaction) {
            throw new Error("La venta no existe.");
        }

        if (transaction.status !== TRANSACTION_STATUS.COMPLETED) {
            throw new Error(
                "Solo una venta completada puede tener devoluciones."
            );
        }

        if (transaction.isFullyReturned()) {
            throw new Error("La venta ya fue devuelta por completo.");
        }

        const currentCash = this.getCurrentCash.execute();

        if (!currentCash) {
            throw new Error(
                "No hay una Caja abierta. Abre la Caja antes de registrar una devolución."
            );
        }

        if (!Array.isArray(returnItems) || !returnItems.length) {
            throw new Error("No se seleccionaron artículos para devolver.");
        }

        // Validamos toda la operación antes de crear movimientos.
        const normalized = returnItems.map(item => ({
            articleId: item.articleId,
            quantity: Number(item.quantity)
        }));

        normalized.forEach(item => {
            const article =
                this.articleRepository.findById(item.articleId);

            if (!article) {
                throw new Error("Uno de los artículos de la devolución ya no existe.");
            }

            if (article.type !== "INVENTORY") {
                return;
            }

            if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
                throw new Error("La cantidad a devolver debe ser mayor que cero.");
            }
        });

        // La entidad valida que no se devuelva más de lo vendido/presente.
        const operation =
            transaction.addReturn(
                normalized,
                currentCash.cash.id
            );

        normalized.forEach(item => {

            const article =
                this.articleRepository.findById(item.articleId);

            if (article.type === "INVENTORY") {
                this.createMovement.execute({
                    articleId: article.id,
                    type: "ENTRY",
                    quantity: Number(item.quantity),
                    transactionId: transaction.id,
                    reason: "RETURN"
                });
            }

        });

        this.transactionRepository.update(transaction);

        return {
            transaction,
            operation
        };

    }

}
