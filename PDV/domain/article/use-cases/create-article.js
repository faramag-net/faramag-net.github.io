/**
 * ==========================================================
 * PDV
 * Archivo: create-article.js
 * Módulo: Domain / Article / Use Case
 * Descripción: Caso de uso para crear un artículo.
 * Versión: 0.8.0
 * ==========================================================
 */

import Article from "../article.js";

export default class CreateArticle {

    constructor(repository) {

        this.repository = repository;

    }

    execute(data) {

        const article =
            new Article({

                ...data,

                id: crypto.randomUUID()

            });

        this.repository.save(article);

        return article;

    }

}