/**
 * ==========================================================
 * PDV
 * Archivo: update-article.js
 * Módulo: Domain / Article / Use Case
 * Descripción: Caso de uso para actualizar un artículo.
 * Versión: 0.9.0
 * ==========================================================
 */

export default class UpdateArticle {

    constructor(repository) {

        this.repository = repository;

    }

    execute(id, data) {

        const article =
            this.repository.findById(id);

        if (!article) {

            throw new Error(
                "El artículo no existe."
            );

        }

        article.update(data);

        this.repository.update(article);

        return article;

    }

}