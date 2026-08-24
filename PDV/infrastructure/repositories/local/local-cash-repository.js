/**
 * ==========================================================
 * PDV
 * Archivo: local-cash-repository.js
 * Módulo: Infrastructure / Repository
 * Descripción: Repositorio local de Caja.
 * Versión: 0.9.3
 * ==========================================================
 */

import CashRepository
    from "../../../domain/cash/cash-repository.js";

import Cash
    from "../../../domain/cash/cash.js";

import Database
    from "../../../database/database.js";

import DB_KEYS
    from "../../../database/db-keys.js";

export default class LocalCashRepository
    extends CashRepository {

    save(cash) {

        const cashes =
            Database.get(DB_KEYS.CASH) ?? [];

        if (cashes.some(item => item.id === cash.id)) {
            throw new Error(
                "El ID de Caja ya existe."
            );
        }

        cashes.push(
            cash.toJSON()
        );

        Database.set(
            DB_KEYS.CASH,
            cashes
        );

    }

    findAll() {

        const cashes =
            Database.get(DB_KEYS.CASH) ?? [];

        return cashes
            .map(data => new Cash(data))
            .sort(
                (a, b) =>
                    new Date(b.openedAt) - new Date(a.openedAt)
            );

    }

    findById(id) {

        const data =
            (Database.get(DB_KEYS.CASH) ?? [])
                .find(item => item.id === id);

        return data
            ? new Cash(data)
            : null;

    }

    findOpen() {

        const data =
            (Database.get(DB_KEYS.CASH) ?? [])
                .find(item => item.status === "OPEN");

        return data
            ? new Cash(data)
            : null;

    }

    update(cash) {

        const cashes =
            Database.get(DB_KEYS.CASH) ?? [];

        const index =
            cashes.findIndex(
                item => item.id === cash.id
            );

        if (index === -1) {

            throw new Error(
                "La Caja no existe."
            );

        }

        cashes[index] =
            cash.toJSON();

        Database.set(
            DB_KEYS.CASH,
            cashes
        );

    }

}
