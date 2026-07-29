/**
 * ==========================================================
 * PDV
 * Archivo: get-articles.js
 * Módulo: Domain / Article / Use Case
 * Descripción: Caso de uso para obtener los artículos.
 * Versión: 0.8.0
 * ==========================================================
 */

export default class GetArticles {

    constructor(repository) {

        this.repository = repository;

    }

    execute() {

        return this.repository.findAll();

    }

}