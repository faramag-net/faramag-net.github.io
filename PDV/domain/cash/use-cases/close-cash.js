/**
 * ==========================================================
 * PDV
 * Archivo: close-cash.js
 * Módulo: Domain / Cash / Use Case
 * Descripción: Cierra la Caja y registra el resumen de la sesión.
 * Versión: 0.9.13
 * ==========================================================
 */

export default class CloseCash {

    constructor(cashRepository, getCurrentCash) {

        this.cashRepository = cashRepository;
        this.getCurrentCash = getCurrentCash;

    }

    execute(closingAmount) {

        const current = this.getCurrentCash.execute();

        if (!current) {
            throw new Error("No existe una Caja abierta.");
        }

        current.cash.close(closingAmount, current);

        this.cashRepository.update(current.cash);

        return {
            cash: current.cash,
            salesTotal: current.salesTotal,
            refundsTotal: current.refundsTotal,
            cancellationsTotal: current.cancellationsTotal,
            netSalesTotal: current.netSalesTotal,
            expectedAmount: current.expectedAmount,
            closingAmount: current.cash.closingAmount,
            difference: current.cash.difference
        };

    }

}
