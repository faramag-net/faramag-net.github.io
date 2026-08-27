/**
 * ==========================================================
 * PDV
 * Archivo: backup-service.js
 * Módulo: Services / Backup
 * Descripción: Exportación e importación tolerante de respaldos.
 * Versión: 0.9.16
 * ==========================================================
 */

import Database from "../../database/database.js";
import DB_KEYS from "../../database/db-keys.js";

const BACKUP_FORMAT = "PDV_BACKUP";
const BACKUP_FORMAT_VERSION = 1;

const COLLECTION_KEYS = Object.freeze([
    DB_KEYS.ARTICLES,
    DB_KEYS.TRANSACTIONS,
    DB_KEYS.MOVEMENTS,
    DB_KEYS.CASH
]);

const BackupService = {

    export() {

        const data = {
            [DB_KEYS.ARTICLES]: Database.get(DB_KEYS.ARTICLES) ?? [],
            [DB_KEYS.TRANSACTIONS]: Database.get(DB_KEYS.TRANSACTIONS) ?? [],
            [DB_KEYS.MOVEMENTS]: Database.get(DB_KEYS.MOVEMENTS) ?? [],
            [DB_KEYS.CASH]: Database.get(DB_KEYS.CASH) ?? [],
            [DB_KEYS.CONFIG]: Database.get(DB_KEYS.CONFIG) ?? {}
        };

        return {
            format: BACKUP_FORMAT,
            formatVersion: BACKUP_FORMAT_VERSION,
            appVersion: "0.9.16",
            exportedAt: new Date().toISOString(),
            data
        };

    },

    normalize(payload) {

        if (!payload || payload.format !== BACKUP_FORMAT) {
            throw new Error("El archivo no es un respaldo válido de PDV.");
        }

        const version = Number(payload.formatVersion ?? 1);

        if (!Number.isInteger(version) || version < 1) {
            throw new Error("La versión del respaldo no es válida.");
        }

        if (version > BACKUP_FORMAT_VERSION) {
            throw new Error(
                `El respaldo requiere una versión de formato más reciente (${version}).`
            );
        }

        const source = payload.data && typeof payload.data === "object"
            ? payload.data
            : {};

        const normalized = {};

        for (const key of COLLECTION_KEYS) {

            const value = source[key];

            if (value === undefined || value === null) {
                normalized[key] = [];
                continue;
            }

            if (!Array.isArray(value)) {
                throw new Error(`La colección "${key}" no es válida.`);
            }

            const seenIds = new Set();

            normalized[key] = value.map((item, index) => {

                if (!item || typeof item !== "object" || Array.isArray(item)) {
                    throw new Error(
                        `El registro ${index + 1} de "${key}" no es válido.`
                    );
                }

                if (!item.id || typeof item.id !== "string") {
                    throw new Error(
                        `El registro ${index + 1} de "${key}" no tiene un ID válido.`
                    );
                }

                if (seenIds.has(item.id)) {
                    throw new Error(
                        `El respaldo contiene un ID duplicado en "${key}": ${item.id}`
                    );
                }

                seenIds.add(item.id);

                // Conservamos campos desconocidos para no perder datos
                // pertenecientes a versiones futuras o módulos nuevos.
                return { ...item };

            });

        }

        const config = source[DB_KEYS.CONFIG];

        if (config === undefined || config === null) {
            normalized[DB_KEYS.CONFIG] = {};
        } else if (typeof config !== "object" || Array.isArray(config)) {
            throw new Error("La configuración del respaldo no es válida.");
        } else {
            normalized[DB_KEYS.CONFIG] = { ...config };
        }

        return normalized;

    },

    import(payload) {

        const data = this.normalize(payload);

        // La restauración reemplaza el estado local completo de las entidades
        // conocidas. Las claves nuevas que una versión posterior agregue no
        // rompen la importación porque se consideran opcionales.
        for (const key of COLLECTION_KEYS) {
            Database.set(key, data[key]);
        }

        Database.set(DB_KEYS.CONFIG, data[DB_KEYS.CONFIG]);

        return data;

    }

};

export default BackupService;
