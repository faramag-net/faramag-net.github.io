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

    info(module, message){

        console.info(
            `ℹ️ [${module}] ${message}`
        );

    },

    success(module, message){

        console.log(
            `✅ [${module}] ${message}`
        );

    },

    warning(module, message){

        console.warn(
            `⚠️ [${module}] ${message}`
        );

    },

    error(module, message){

        console.error(
            `❌ [${module}] ${message}`
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