/**
 * ==========================================================
 * PDV
 * Archivo: complete-transaction.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Completa una venta, la asocia a Caja y genera sus salidas de inventario.
 * Versión: 0.9.5
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
        getInventory,
        getCurrentCash

    ) {

        this.transactionRepository = transactionRepository;
        this.articleRepository = articleRepository;
        this.createMovement = createMovement;
        this.getInventory = getInventory;
        this.getCurrentCash = getCurrentCash;

    }

    execute(transactionId, payment = {}) {

        const transaction =
            this.transactionRepository.findById(transactionId);

        if (!transaction) {
            throw new Error("La venta no existe.");
        }

        if (transaction.status !== TRANSACTION_STATUS.DRAFT) {
            throw new Error(
                "Solo una venta en borrador puede completarse."
            );
        }

        const currentCash = this.getCurrentCash.execute();

        if (!currentCash) {
            throw new Error(
                "No hay una Caja abierta. Abre la Caja antes de registrar una venta."
            );
        }

        const inventory = this.getInventory.execute();
        const movementData = [];

        // Primero se valida TODA la venta. No se registra ningún movimiento
        // hasta comprobar que todos los artículos pueden venderse.
        transaction.items.forEach(item => {

            const article =
                this.articleRepository.findById(item.articleId);

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

            const stock = inventoryItem?.stock ?? 0;

            if (Number(item.quantity) > stock) {
                throw new Error(
                    `Existencias insuficientes para "${article.name}". Disponible: ${stock}.`
                );
            }

            movementData.push({
                articleId: article.id,
                type: "EXIT",
                quantity: Number(item.quantity),
                transactionId: transaction.id,
                reason: "SALE"
            });

        });

        // La venta queda vinculada a la sesión de Caja y al cobro.
        transaction.cashId = currentCash.cash.id;
        transaction.paymentMethod = payment.method ?? "CASH";
        transaction.paymentReceived = Number(payment.received);

        // Se valida el cobro antes de crear cualquier movimiento para evitar
        // una venta parcialmente registrada si el efectivo es insuficiente.
        transaction.complete();

        movementData.forEach(data => {
            this.createMovement.execute(data);
        });

        this.transactionRepository.update(transaction);

        return transaction;

    }

}
