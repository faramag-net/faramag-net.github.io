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

}