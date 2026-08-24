/**
 * ==========================================================
 * PDV
 * Archivo: return-transaction.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Registra una devolución TOTAL de una venta.
 * Versión: 0.9.9
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

    execute(transactionId) {

        const transaction =
            this.transactionRepository.findById(transactionId);

        if (!transaction) {
            throw new Error("La venta no existe.");
        }

        if (transaction.status !== TRANSACTION_STATUS.COMPLETED) {
            throw new Error("Solo una venta completada puede tener devoluciones.");
        }

        if (transaction.hasReturns()) {
            throw new Error("La venta ya tiene una devolución registrada.");
        }

        const currentCash = this.getCurrentCash.execute();

        if (!currentCash) {
            throw new Error(
                "No hay una Caja abierta. Abre la Caja antes de registrar una devolución."
            );
        }

        // La devolución es siempre TOTAL: se restituyen todos los artículos
        // de la venta en una sola operación.
        transaction.items.forEach(item => {

            const article =
                this.articleRepository.findById(item.articleId);

            if (!article) {
                throw new Error("Uno de los artículos de la venta ya no existe.");
            }

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

        transaction.addFullReturn(currentCash.cash.id);
        this.transactionRepository.update(transaction);

        return transaction;

    }

}
