/**
 * ==========================================================
 * PDV
 * Archivo: complete-transaction.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Completa una venta y genera sus salidas de inventario.
 * Versión: 0.9.2
 * ==========================================================
 */

import {
    TRANSACTION_STATUS
} from "../transaction.js";

export default class CompleteTransaction {

    constructor(

        transactionRepository,
        articleRepository,
        createMovement,
        getInventory

    ) {

        this.transactionRepository =
            transactionRepository;

        this.articleRepository =
            articleRepository;

        this.createMovement =
            createMovement;

        this.getInventory =
            getInventory;

    }

    execute(transactionId) {

        const transaction =
            this.transactionRepository.findById(
                transactionId
            );

        if (!transaction) {

            throw new Error(
                "La venta no existe."
            );

        }

        if (
            transaction.status !==
            TRANSACTION_STATUS.DRAFT
        ) {

            throw new Error(
                "Solo una venta en borrador puede completarse."
            );

        }

        const inventory =
            this.getInventory.execute();

        const movementData = [];

        transaction.items.forEach(item => {

            const article =
                this.articleRepository.findById(
                    item.articleId
                );

            if (!article) {

                throw new Error(
                    "Uno de los artículos de la venta ya no existe."
                );

            }

            if (!article.active) {

                throw new Error(
                    `El artículo "${article.name}" está inactivo.`
                );

            }

            if (article.type !== "INVENTORY") {

                return;

            }

            const inventoryItem =
                inventory.find(
                    itemInventory =>
                        itemInventory.article.id === article.id
                );

            const stock =
                inventoryItem?.stock ?? 0;

            if (Number(item.quantity) > stock) {

                throw new Error(
                    `Existencias insuficientes para "${article.name}".`
                );

            }

            movementData.push({

                articleId: article.id,

                type: "EXIT",

                quantity: Number(item.quantity)

            });

        });

        movementData.forEach(data => {

            this.createMovement.execute(
                data
            );

        });

        transaction.complete();

        this.transactionRepository.update(
            transaction
        );

        return transaction;

    }

}
