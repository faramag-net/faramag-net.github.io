/**
 * ==========================================================
 * PDV
 * Archivo: sidebar.js
 * Descripción: Menú principal.
 * Versión: 0.6.5
 * ==========================================================
 */

import Logger
from "../../../core/logger.js";

import ModulesService
from "../../../services/modules.service.js";

const Sidebar = {

//==================================================
// Estado
//==================================================

    container: null,

    menu: null,

    onSelect: null,

    selected: null,

//==================================================
// Inicialización
//==================================================

    async init(container){

        this.container =
            container;

        Logger.success(
            "Sidebar",
            "Sidebar inicializado."
        );
        
        this.selected =
            "dashboard";

        await this.render();

    },

//==================================================
// Métodos públicos
//==================================================

    async select(id) {

        this.selected =
            id;

        await this.render();

        Logger.info(
            "Sidebar",
            `Seleccionado: ${id}`
        );

        if (this.onSelect) {

            this.onSelect(id);

        }

    },

    expand(){

    },

    collapse(){

    },

    toggle(){

    },

//==================================================
// Métodos privados
//==================================================

    createMenuItem(
        module,
        active
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "sidebar-button";

        if (active) {

            button.classList.add(
                "active"
            );

        }

        button.textContent =
            module.title;

        button.dataset.route =
            module.id;

        button.addEventListener(

            "click",

            (event) => {

                this.select(

                    event.currentTarget
                        .dataset
                        .route

                );

            }

        );

        return button;

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
                        module,
                        module.id ===
                        this.selected
                    );

                this.menu.append(
                    item
                );

            }

        );
        
    },

};

export default Sidebar;