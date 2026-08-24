/**
 * ==========================================================
 * PDV
 * Archivo: cancel-transaction.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Cancela una venta completada y genera movimientos ENTRY compensatorios.
 * Versión: 0.9.6
 * ==========================================================
 */

import {
    TRANSACTION_STATUS
} from "../transaction.js";

export default class CancelTransaction {

    constructor(transactionRepository, articleRepository, createMovement) {

        this.transactionRepository = transactionRepository;
        this.articleRepository = articleRepository;
        this.createMovement = createMovement;

    }

    execute(transactionId) {

        const transaction =
            this.transactionRepository.findById(transactionId);

        if (!transaction) {
            throw new Error("La venta no existe.");
        }

        if (transaction.status !== TRANSACTION_STATUS.COMPLETED) {
            throw new Error("Solo una venta completada puede cancelarse.");
        }

        if (transaction.hasReturns()) {
            throw new Error("Una venta con devoluciones no puede cancelarse.");
        }

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
                    reason: "CANCEL"
                });
            }

        });

        transaction.cancel();
        this.transactionRepository.update(transaction);

        return transaction;

    }

}
