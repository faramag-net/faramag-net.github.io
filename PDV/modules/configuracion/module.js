/**
 * ==========================================================
 * PDV
 * Archivo: module.js
 * Módulo: Configuración
 * Descripción: Administración de la configuración básica del sistema.
 * Versión: 0.9.14
 * ==========================================================
 */

import Logger from "../../core/logger.js";
import Database from "../../database/database.js";
import DB_KEYS from "../../database/db-keys.js";

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
            status: document.getElementById("configurationStatus")
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
