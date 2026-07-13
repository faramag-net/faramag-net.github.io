/**
 * ==========================================================
 * PDV
 * Archivo: logger.js
 * Módulo: Core
 * Descripción: Administrador de mensajes de la aplicación.
 * Versión: 0.1.0
 * Autor: Familia Magallón Andrade
 * ==========================================================
 */

const Logger = {

    info(message){

        console.info(`[PDV] ${message}`);

    },

    success(message){

        console.log(`✅ ${message}`);

    },

    warning(message){

        console.warn(`⚠️ ${message}`);

    },

    error(message){

        console.error(`❌ ${message}`);

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