/**
 * ==========================================================
 * PDV
 * Archivo: create-transaction.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Crea una venta en estado DRAFT.
 * Versión: 0.9.5
 * ==========================================================
 */

import Transaction
    from "../transaction.js";

export default class CreateTransaction {

    constructor(

        repository,
        articleRepository,
        getInventory

    ) {

        this.repository = repository;

        this.articleRepository =
            articleRepository;

        this.getInventory =
            getInventory;

    }

    execute(data) {

        const items =
            Array.isArray(data.items)
                ? data.items
                : [];

        const inventory =
            this.getInventory.execute();

        const normalizedItems =
            items.map(item => {

                const article =
                    this.articleRepository.findById(
                        item.articleId
                    );

                if (!article) {

                    throw new Error(
                        "Uno de los artículos de la venta no existe."
                    );

                }

                if (!article.active) {

                    throw new Error(
                        `El artículo "${article.name}" está inactivo.`
                    );

                }

                const quantity =
                    Number(item.quantity);

                if (quantity <= 0) {

                    throw new Error(
                        "La cantidad debe ser mayor que cero."
                    );

                }

                if (article.type === "INVENTORY") {

                    const inventoryItem =
                        inventory.find(
                            itemInventory =>
                                itemInventory.article.id === article.id
                        );

                    const stock =
                        inventoryItem?.stock ?? 0;

                    if (quantity > stock) {

                        throw new Error(
                            `Existencias insuficientes para "${article.name}".`
                        );

                    }

                }

                return {

                    articleId: article.id,

                    quantity,

                    unitPrice: article.salePrice,

                    total: Number(
                        (quantity * article.salePrice).toFixed(2)
                    )

                };

            });

        const transaction =
            new Transaction({

                ...data,

                items: normalizedItems,
                id: crypto.randomUUID()

            });

        this.repository.save(
            transaction
        );

        return transaction;

    }

}
