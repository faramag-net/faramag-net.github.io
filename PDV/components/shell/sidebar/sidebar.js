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
        
        await this.render();

    },

    async render(){

        const modules =
            await ModulesService.getMenu();

        this.menu =
            this.container.querySelector(
                "#sidebar-menu"
            );

        this.menu.replaceChildren();

        modules.forEach(

            module => {

                const item =
                    this.createMenuItem(
                        module
                    );

                this.menu.append(
                    item
                );

            }

        );

    },

    createMenuItem(module) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";
        
        button.className =
            "sidebar-button";

        button.textContent =
            module.title;

        button.dataset.route =
            module.id;

        return button;

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