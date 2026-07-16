/**
 * ==========================================================
 * PDV
 * Archivo: sidebar.js
 * Descripción: Menú principal.
 * Versión: 0.6.3
 * ==========================================================
 */

import Logger
from "../../../core/logger.js";

import ModulesService
from "../../../services/modules.service.js";

const Sidebar = {

    container: null,

    menu: null,

    async init(container){

        this.container =
            container;

        Logger.success(
            "Sidebar",
            "Sidebar inicializado."
        );

    },

    async render(){

    },

    expand(){

    },

    collapse(){

    },

    toggle(){

    },

    select(id){

    }

};

export default Sidebar;