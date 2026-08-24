/**
 * ==========================================================
 * PDV
 * Archivo: open-cash.js
 * Módulo: Domain / Cash / Use Case
 * Descripción: Abre una nueva sesión de Caja.
 * Versión: 0.9.5
 * ==========================================================
 */

import Cash from "../cash.js";

export default class OpenCash {

    constructor(cashRepository) {
        this.cashRepository = cashRepository;
    }

    execute(openingAmount = 0) {

        const current =
            this.cashRepository.findOpen();

        if (current) {

            throw new Error(
                "Ya existe una Caja abierta."
            );

        }

        const cash =
            new Cash({
                id: crypto.randomUUID(),
                openingAmount: Number(openingAmount),
                status: "OPEN"
            });

        this.cashRepository.save(cash);

        return cash;

    }

}
