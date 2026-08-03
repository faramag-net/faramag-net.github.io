/**
 * ==========================================================
 * PDV
 * Archivo: activate-article.js
 * Módulo: Domain / Article / Use Case
 * Descripción: Caso de uso para activar un artículo.
 * Versión: 0.9.0
 * ==========================================================
 */

export default class ActivateArticle {

    constructor(repository) {

        this.repository = repository;

    }

    execute(id) {

        const article =
            this.repository.findById(id);

        if (!article) {

            throw new Error(
                "El artículo no existe."
            );

        }

        article.activate();

        this.repository.update(article);

        return article;

    }

}