/**
 * ==========================================================
 * PDV
 * Archivo: return-transaction.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Registra una devolución total o parcial mediante movimientos ENTRY.
 * Versión: 0.9.6
 * ==========================================================
 */

import {
    TRANSACTION_STATUS
} from "../transaction.js";

export default class ReturnTransaction {

    constructor(transactionRepository, articleRepository, createMovement) {

        this.transactionRepository = transactionRepository;
        this.articleRepository = articleRepository;
        this.createMovement = createMovement;

    }

    execute(transactionId, requestedItems = null) {

        const transaction =
            this.transactionRepository.findById(transactionId);

        if (!transaction) {
            throw new Error("La venta no existe.");
        }

        if (transaction.status !== TRANSACTION_STATUS.COMPLETED) {
            throw new Error("Solo una venta completada puede tener devoluciones.");
        }

        const itemsToReturn = this.normalizeItems(transaction, requestedItems);

        if (!itemsToReturn.length) {
            throw new Error("No hay artículos pendientes de devolución.");
        }

        itemsToReturn.forEach(item => {

            const article =
                this.articleRepository.findById(item.articleId);

            if (!article) {
                throw new Error("Uno de los artículos de la venta ya no existe.");
            }

            if (article.type === "INVENTORY") {
                this.createMovement.execute({
                    articleId: article.id,
                    type: "ENTRY",
                    quantity: item.quantity,
                    transactionId: transaction.id,
                    reason: "RETURN"
                });
            }

        });

        transaction.addReturn(itemsToReturn);
        this.transactionRepository.update(transaction);

        return transaction;

    }

    normalizeItems(transaction, requestedItems) {

        const requested =
            Array.isArray(requestedItems) && requestedItems.length
                ? requestedItems
                : transaction.items.map(item => ({
                    articleId: item.articleId,
                    quantity: item.quantity
                }));

        const returnedByArticle =
            new Map(
                transaction.returns.map(item => [
                    item.articleId,
                    Number(item.quantity)
                ])
            );

        const soldByArticle =
            new Map(
                transaction.items.map(item => [
                    item.articleId,
                    Number(item.quantity)
                ])
            );

        return requested.map(item => {

            const sold = soldByArticle.get(item.articleId) ?? 0;
            const alreadyReturned = returnedByArticle.get(item.articleId) ?? 0;
            const remaining = sold - alreadyReturned;
            const quantity = Number(item.quantity);

            if (!sold) {
                throw new Error("El artículo no pertenece a la venta.");
            }

            if (quantity <= 0) {
                throw new Error("La cantidad a devolver debe ser mayor que cero.");
            }

            if (quantity > remaining) {
                throw new Error(
                    `No se pueden devolver ${quantity} unidades. Disponibles para devolución: ${remaining}.`
                );
            }

            return {
                articleId: item.articleId,
                quantity
            };

        });

    }

}
