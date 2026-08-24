/**
 * ==========================================================
 * PDV
 * Archivo: get-current-cash.js
 * Módulo: Domain / Cash / Use Case
 * Descripción: Obtiene la Caja abierta y calcula su saldo esperado.
 * Versión: 0.9.10
 * ==========================================================
 */

export default class GetCurrentCash {

    constructor(cashRepository, transactionRepository) {
        this.cashRepository = cashRepository;
        this.transactionRepository = transactionRepository;
    }

    execute() {

        const cash = this.cashRepository.findOpen();

        if (!cash) {
            return null;
        }

        const transactions =
            this.transactionRepository.findAll();

        // Partimos de todas las ventas que ingresaron a esta Caja y
        // después descontamos devoluciones/cancelaciones realizadas
        // durante esta sesión. Así también funciona si se devuelve
        // una venta perteneciente a una Caja anterior.
        const salesTotal = transactions
            .filter(transaction =>
                transaction.cashId === cash.id &&
                transaction.paymentMethod === "CASH"
            )
            .reduce(
                (total, transaction) =>
                    total + Number(transaction.total),
                0
            );

        const refundsTotal = transactions
            .reduce(
                (total, transaction) =>
                    total +
                    (Array.isArray(transaction.returnOperations)
                        ? transaction.returnOperations
                            .filter(operation => operation.cashId === cash.id)
                            .reduce((operationTotal, operation) =>
                                operationTotal + Number(operation.amount ?? 0), 0)
                        : (transaction.returnCashId === cash.id
                            ? Number(transaction.returnedAmount ?? 0)
                            : 0)),
                0
            );

        // Se conserva el cálculo de cancelaciones únicamente para registros
        // históricos creados antes de eliminar Cancelar del flujo de Ventas.
        const cancellationsTotal = transactions
            .filter(transaction =>
                transaction.cancelCashId === cash.id
            )
            .reduce(
                (total, transaction) =>
                    total + Number(transaction.total),
                0
            );

        const netSalesTotal =
            salesTotal - refundsTotal - cancellationsTotal;

        return {
            cash,
            salesTotal: Number(salesTotal.toFixed(2)),
            refundsTotal: Number(refundsTotal.toFixed(2)),
            cancellationsTotal: Number(cancellationsTotal.toFixed(2)),
            netSalesTotal: Number(netSalesTotal.toFixed(2)),
            expectedAmount: Number(
                (cash.openingAmount + netSalesTotal).toFixed(2)
            )
        };

    }

}
