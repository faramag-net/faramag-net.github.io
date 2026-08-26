/**
 * ==========================================================
 * PDV
 * Archivo: get-cash-summary.js
 * Módulo: Domain / Cash / Use Case
 * Descripción: Calcula el resumen de una sesión de Caja.
 * Versión: 0.9.13
 * ==========================================================
 */

export default class GetCashSummary {

    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    execute(cash) {

        if (!cash) {
            throw new Error("La sesión de Caja es obligatoria.");
        }

        const transactions = this.transactionRepository.findAll();

        const salesTotal = transactions
            .filter(transaction =>
                transaction.cashId === cash.id &&
                transaction.paymentMethod === "CASH"
            )
            .reduce(
                (total, transaction) => total + Number(transaction.total ?? 0),
                0
            );

        const refundsTotal = transactions
            .reduce(
                (total, transaction) =>
                    total +
                    (Array.isArray(transaction.returnOperations)
                        ? transaction.returnOperations
                            .filter(operation => operation.cashId === cash.id)
                            .reduce(
                                (operationTotal, operation) =>
                                    operationTotal + Number(operation.amount ?? 0),
                                0
                            )
                        : (transaction.returnCashId === cash.id
                            ? Number(transaction.returnedAmount ?? 0)
                            : 0)),
                0
            );

        const cancellationsTotal = transactions
            .filter(transaction => transaction.cancelCashId === cash.id)
            .reduce(
                (total, transaction) => total + Number(transaction.total ?? 0),
                0
            );

        const netSalesTotal =
            salesTotal - refundsTotal - cancellationsTotal;

        const expectedAmount =
            Number((cash.openingAmount + netSalesTotal).toFixed(2));

        const closingAmount = cash.closingAmount;

        const difference =
            closingAmount === null
                ? null
                : Number((closingAmount - expectedAmount).toFixed(2));

        return {
            cash,
            salesTotal: Number(salesTotal.toFixed(2)),
            refundsTotal: Number(refundsTotal.toFixed(2)),
            cancellationsTotal: Number(cancellationsTotal.toFixed(2)),
            netSalesTotal: Number(netSalesTotal.toFixed(2)),
            expectedAmount,
            closingAmount,
            difference
        };

    }

}
