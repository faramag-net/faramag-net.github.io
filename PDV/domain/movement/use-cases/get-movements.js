/**
 * ==========================================================
 * PDV
 * Archivo: get-movements.js
 * Módulo: Domain / Movement / Use Case
 * Descripción: Caso de uso para obtener movimientos.
 * Versión: 0.9.1
 * ==========================================================
 */

export default class GetMovements {

    constructor(repository) {

        this.repository = repository;

    }

    execute() {

        return this.repository.findAll();

    }

}