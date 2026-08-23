/**
 * ==========================================================
 * PDV
 * Archivo: get-current-cash.js
 * Módulo: Domain / Cash / Use Case
 * Descripción: Obtiene la Caja abierta y calcula sus ventas.
 * Versión: 0.9.3
 * ==========================================================
 */

import { CASH_STATUS } from "../cash.js";

export default class GetCurrentCash {

    constructor(cashRepository, transactionRepository) {

        this.cashRepository = cashRepository;
        this.transactionRepository = transactionRepository;

    }

    execute() {

        const cash =
            this.cashRepository.findOpen();

        if (!cash) {
            return null;
        }

        const transactions =
            this.transactionRepository.findAll();

        const salesTotal =
            transactions
                .filter(transaction =>
                    transaction.status === "COMPLETED" &&
                    new Date(transaction.createdAt) >= new Date(cash.openedAt)
                )
                .reduce(
                    (total, transaction) =>
                        total + Number(transaction.total),
                    0
                );

        return {

            cash,

            salesTotal: Number(salesTotal.toFixed(2)),

            expectedAmount: Number(
                (cash.openingAmount + salesTotal).toFixed(2)
            )

        };

    }

}
