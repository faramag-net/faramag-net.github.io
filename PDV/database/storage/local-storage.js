/**
 * ==========================================================
 * PDV
 * Archivo: local-storage.js
 * Módulo: Database / Storage
 * Descripción: Adaptador para LocalStorage.
 * Versión: 0.8.0
 * ==========================================================
 */

const LocalStorage = {

    get(key) {

        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : null;

    },

    set(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    },

    remove(key) {

        localStorage.removeItem(key);

    },

    exists(key) {

        return localStorage.getItem(key) !== null;

    }

};

export default LocalStorage;