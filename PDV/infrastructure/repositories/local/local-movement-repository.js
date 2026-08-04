/**
 * ==========================================================
 * PDV
 * Archivo: local-movement-repository.js
 * Módulo: Infrastructure / Repository
 * Descripción: Repositorio local de movimientos.
 * Versión: 0.9.1
 * ==========================================================
 */

import MovementRepository
    from "../../../domain/movement/movement-repository.js";

import Movement
    from "../../../domain/movement/movement.js";

import Database
    from "../../../database/database.js";

import DB_KEYS
    from "../../../database/db-keys.js";

export default class LocalMovementRepository
    extends MovementRepository {

    save(movement) {

        const movements =
            Database.get(
                DB_KEYS.MOVEMENTS
            ) ?? [];

        movements.push(
            movement.toJSON()
        );

        Database.set(
            DB_KEYS.MOVEMENTS,
            movements
        );

    }

    findAll() {

        const movements =
            Database.get(
                DB_KEYS.MOVEMENTS
            ) ?? [];

        return movements.map(
            data => new Movement(data)
        );

    }

}