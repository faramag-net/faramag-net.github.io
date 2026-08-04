/**
 * ==========================================================
 * PDV
 * Archivo: create-movement.js
 * Módulo: Domain / Movement / Use Case
 * Descripción: Caso de uso para crear un movimiento.
 * Versión: 0.9.1
 * ==========================================================
 */

import Movement
    from "../movement.js";

export default class CreateMovement {

    constructor(repository) {

        this.repository = repository;

    }

    execute(data) {

        const movement =
            new Movement({

                ...data,

                id: crypto.randomUUID()

            });

        this.repository.save(
            movement
        );

        return movement;

    }

}