/**
 * ==========================================================
 * PDV
 * Archivo: local-article-repository.js
 * Módulo: Infrastructure / Repository
 * Descripción: Repositorio local de artículos.
 * Versión: 0.8.0
 * ==========================================================
 */

import ArticleRepository
    from "../../../domain/article/article-repository.js";

import Article
    from "../../../domain/article/article.js";

import Database
    from "../../../database/database.js";

import DB_KEYS
    from "../../../database/db-keys.js";

export default class LocalArticleRepository
    extends ArticleRepository {

    save(article) {

        const articles =
            Database.get(
                DB_KEYS.ARTICLES
            ) ?? [];

        if (articles.some(item => item.id === article.id)) {
            throw new Error(
                "El artículo ya existe."
            );
        }

        articles.push(
            article.toJSON()
        );

        Database.set(
            DB_KEYS.ARTICLES,
            articles
        );

    }

    findAll() {

        const articles =
            Database.get(
                DB_KEYS.ARTICLES
            ) ?? [];

        return articles.map(
            data => new Article(data)
        );

    }

    findById(id) {

        const articles =
            Database.get(
                DB_KEYS.ARTICLES
            ) ?? [];

        const data =
            articles.find(
                article => article.id === id
            );

        return data
            ? new Article(data)
            : null;

    }

    update(article) {

        const articles =
            Database.get(
                DB_KEYS.ARTICLES
            ) ?? [];

        const index =
            articles.findIndex(
                item => item.id === article.id
            );

        if (index === -1) {

            throw new Error(
                "El artículo no existe."
            );

        }

        articles[index] =
            article.toJSON();

        Database.set(
            DB_KEYS.ARTICLES,
            articles
        );

    }

}