/**
 * ==========================================================
 * PDV
 * Archivo: local-transaction-repository.js
 * Módulo: Infrastructure / Repository
 * Descripción: Repositorio local de transacciones.
 * Versión: 0.9.2
 * ==========================================================
 */

import TransactionRepository
    from "../../../domain/transaction/transaction-repository.js";

import Transaction
    from "../../../domain/transaction/transaction.js";

import Database
    from "../../../database/database.js";

import DB_KEYS
    from "../../../database/db-keys.js";

export default class LocalTransactionRepository
    extends TransactionRepository {

    save(transaction) {

        const transactions =
            Database.get(
                DB_KEYS.TRANSACTIONS
            ) ?? [];

        if (transactions.some(item => item.id === transaction.id)) {
            throw new Error(
                "La venta ya existe."
            );
        }

        transactions.push(
            transaction.toJSON()
        );

        Database.set(
            DB_KEYS.TRANSACTIONS,
            transactions
        );

    }

    findAll() {

        const transactions =
            Database.get(
                DB_KEYS.TRANSACTIONS
            ) ?? [];

        return transactions
            .map(
                data => new Transaction(data)
            )
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );

    }

    findById(id) {

        const transactions =
            Database.get(
                DB_KEYS.TRANSACTIONS
            ) ?? [];

        const data =
            transactions.find(
                transaction =>
                    transaction.id === id
            );

        return data
            ? new Transaction(data)
            : null;

    }

    update(transaction) {

        const transactions =
            Database.get(
                DB_KEYS.TRANSACTIONS
            ) ?? [];

        const index =
            transactions.findIndex(
                item =>
                    item.id === transaction.id
            );

        if (index === -1) {

            throw new Error(
                "La venta no existe."
            );

        }

        transactions[index] =
            transaction.toJSON();

        Database.set(
            DB_KEYS.TRANSACTIONS,
            transactions
        );

    }

}
