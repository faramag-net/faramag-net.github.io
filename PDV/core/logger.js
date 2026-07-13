/**
 * ==========================================================
 * PDV
 * Archivo: logger.js
 * Módulo: Core
 * Descripción: Administrador de mensajes del sistema.
 * Versión: 0.1.0
 * ==========================================================
 */

const Logger = {

    info(message){

        console.info(
            `[PDV] ${message}`
        );

    },

    success(message){

        console.log(
            `✅ [PDV] ${message}`
        );

    },

    warning(message){

        console.warn(
            `⚠️ [PDV] ${message}`
        );

    },

    error(message){

        console.error(
            `❌ [PDV] ${message}`
        );

    },

    module(module, message){

        console.log(
            `[PDV] [${module}] ${message}`
        );

    },

    table(data){

        console.table(data);

    },

    line(){

        console.log(
            "======================================"
        );

    }

};

export default Logger;