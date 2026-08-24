/**
 * ==========================================================
 * PDV
 * Archivo: get-transactions.js
 * Módulo: Domain / Transaction / Use Case
 * Descripción: Obtiene el historial de ventas.
 * Versión: 0.9.5
 * ==========================================================
 */

export default class GetTransactions {

    constructor(repository) {

        this.repository = repository;

    }

    execute() {

        return this.repository.findAll();

    }

}
