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

import LocalStorage
    from "./storage/local-storage.js";

const Database = {

    init() {

        Logger.success(
            "Database",
            "Base de datos inicializada."
        );

    },

    get(key) {

        return LocalStorage.get(key);

    },

    set(key, value) {

        LocalStorage.set(key, value);

    },

    remove(key) {

        LocalStorage.remove(key);

    },

    exists(key) {

        return LocalStorage.exists(key);

    }

};

export default Database;