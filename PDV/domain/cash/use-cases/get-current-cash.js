/**
 * ==========================================================
 * PDV
 * Archivo: get-current-cash.js
 * Módulo: Domain / Cash / Use Case
 * Descripción: Obtiene la Caja abierta y calcula su saldo esperado.
 * Versión: 0.9.13
 * ==========================================================
 */

import GetCashSummary from "./get-cash-summary.js";

export default class GetCurrentCash {

    constructor(cashRepository, transactionRepository) {
        this.cashRepository = cashRepository;
        this.summary = new GetCashSummary(transactionRepository);
    }

    execute() {

        const cash = this.cashRepository.findOpen();

        if (!cash) {
            return null;
        }

        return this.summary.execute(cash);

    }

}
