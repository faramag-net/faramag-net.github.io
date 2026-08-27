/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Configuración
 * Descripción: Administración de la configuración básica del sistema.
 * Versión: 0.9.16
 * ==========================================================
 */

import Logger from "../../core/logger.js";
import Database from "../../database/database.js";
import DB_KEYS from "../../database/db-keys.js";
import BackupService from "../../services/backup/backup-service.js";

const DEFAULTS = Object.freeze({
    businessName: "PDV",
    ticketMessage: "Gracias por su compra.",
    ticketShowBusinessName: true
});

const Configuracion = {

    elements: {},

    async init() {

        Logger.success(
            "Configuración",
            "Módulo iniciado."
        );

        this.cache();
        this.load();
        this.events();

    },

    cache() {

        this.elements = {
            form: document.getElementById("configurationForm"),
            businessName: document.getElementById("businessName"),
            ticketMessage: document.getElementById("ticketMessage"),
            ticketShowBusinessName: document.getElementById("ticketShowBusinessName"),
            reset: document.getElementById("configurationReset"),
            status: document.getElementById("configurationStatus"),
            backupExport: document.getElementById("backupExport"),
            backupImport: document.getElementById("backupImport"),
            backupFile: document.getElementById("backupFile")
        };

    },

    events() {

        this.elements.form?.addEventListener("submit", (event) => {

            event.preventDefault();
            this.save();

        });

        this.elements.reset?.addEventListener("click", () => {

            this.reset();

        });

        this.elements.backupExport?.addEventListener("click", () => {

            this.exportBackup();

        });

        this.elements.backupImport?.addEventListener("click", () => {

            this.elements.backupFile?.click();

        });

        this.elements.backupFile?.addEventListener("change", (event) => {

            const file = event.target.files?.[0];

            if (file) {
                this.importBackup(file);
            }

        });

    },

    getConfig() {

        const stored =
            Database.get(DB_KEYS.CONFIG) ?? {};

        return {
            ...DEFAULTS,
            ...stored
        };

    },

    load() {

        const config = this.getConfig();

        this.elements.businessName.value =
            config.businessName;

        this.elements.ticketMessage.value =
            config.ticketMessage;

        this.elements.ticketShowBusinessName.checked =
            Boolean(config.ticketShowBusinessName);

    },

    save() {

        const config = {
            businessName:
                this.elements.businessName.value.trim() || DEFAULTS.businessName,
            ticketMessage:
                this.elements.ticketMessage.value.trim() || DEFAULTS.ticketMessage,
            ticketShowBusinessName:
                this.elements.ticketShowBusinessName.checked
        };

        Database.set(
            DB_KEYS.CONFIG,
            config
        );

        this.showStatus("Configuración guardada correctamente.");

        Logger.success(
            "Configuración",
            "Configuración guardada."
        );

    },

    reset() {

        Database.set(
            DB_KEYS.CONFIG,
            { ...DEFAULTS }
        );

        this.load();
        this.showStatus("Configuración restablecida.");

        Logger.info(
            "Configuración",
            "Configuración restablecida."
        );

    },

    exportBackup() {

        try {

            const backup = BackupService.export();
            const blob = new Blob(
                [JSON.stringify(backup, null, 2)],
                { type: "application/json" }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const stamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-");

            link.href = url;
            link.download = `PDV-backup-${stamp}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            this.showStatus("Respaldo exportado correctamente.");

            Logger.success(
                "Configuración",
                "Respaldo exportado."
            );

        } catch (error) {

            Logger.error(
                "Configuración",
                `No fue posible exportar el respaldo: ${error.message}`
            );

            this.showStatus("No fue posible exportar el respaldo.");

        }

    },

    async importBackup(file) {

        try {

            const confirmed = window.confirm(
                "Importar este respaldo reemplazará los datos locales actuales. ¿Deseas continuar?"
            );

            if (!confirmed) {
                if (this.elements.backupFile) {
                    this.elements.backupFile.value = "";
                }
                return;
            }

            const text = await file.text();
            const payload = JSON.parse(text);

            BackupService.import(payload);

            this.load();

            this.showStatus(
                "Respaldo restaurado correctamente. Recarga la aplicación para actualizar todos los módulos."
            );

            Logger.success(
                "Configuración",
                "Respaldo importado y restaurado."
            );

            if (this.elements.backupFile) {
                this.elements.backupFile.value = "";
            }

        } catch (error) {

            Logger.error(
                "Configuración",
                `No fue posible importar el respaldo: ${error.message}`
            );

            this.showStatus(
                `No fue posible importar el respaldo: ${error.message}`
            );

            if (this.elements.backupFile) {
                this.elements.backupFile.value = "";
            }

        }

    },

    showStatus(message) {

        if (!this.elements.status) return;

        this.elements.status.textContent = message;
        this.elements.status.hidden = false;

        window.clearTimeout(this.statusTimer);

        this.statusTimer =
            window.setTimeout(() => {
                this.elements.status.hidden = true;
            }, 3000);

    },

    async destroy() {

        Logger.info(
            "Configuración",
            "Módulo destruido."
        );

        this.elements = {};

    }

};

export default Configuracion;
