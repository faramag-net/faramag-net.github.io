/**
 * ==========================================================
 * PDV
 * Archivo: get-inventory.js
 * Módulo: Domain / Movement / Use Case
 * Descripción: Obtiene las existencias del inventario.
 * Versión: 0.9.1
 * ==========================================================
 */

export default class GetInventory {

    constructor(

        articleRepository,

        movementRepository

    ) {

        this.articleRepository =
            articleRepository;

        this.movementRepository =
            movementRepository;

    }

    execute() {

        const articles =
            this.articleRepository
                .findAll();

        const movements =
            this.movementRepository
                .findAll();

        return articles.map(article => {

            return {

                article,

                stock: 0

            };

        });

    }

}