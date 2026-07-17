/**
 * ==========================================================
 * PDV
 * Archivo: database.js
 * Módulo: Database
 * Descripción: Administración de la base de datos local.
 * Versión: 0.6.5
 * ==========================================================
 */

import Logger from "../core/logger.js";

const Database = {

    init(){

        Logger.success(
            "Database",
            "Base de datos inicializada."
        );

    }

};

export default Database;