/**
 * ==========================================================
 * PDV
 * Archivo: close-cash.js
 * Módulo: Domain / Cash / Use Case
 * Descripción: Cierra la Caja y registra el efectivo contado.
 * Versión: 0.9.5
 * ==========================================================
 */

export default class CloseCash {

    constructor(cashRepository, getCurrentCash) {

        this.cashRepository = cashRepository;
        this.getCurrentCash = getCurrentCash;

    }

    execute(closingAmount) {

        const current =
            this.getCurrentCash.execute();

        if (!current) {

            throw new Error(
                "No existe una Caja abierta."
            );

        }

        current.cash.close(closingAmount);

        this.cashRepository.update(
            current.cash
        );

        return {

            cash: current.cash,

            salesTotal: current.salesTotal,

            expectedAmount: current.expectedAmount,

            closingAmount: current.cash.closingAmount,

            difference: Number(
                (current.cash.closingAmount - current.expectedAmount).toFixed(2)
            )

        };

    }

}
