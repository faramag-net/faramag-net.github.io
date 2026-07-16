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

    onSelect: null,

    selected: null,

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

    expand(){

    },

    collapse(){

    },

    toggle(){

    },

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

    }

};

export default Sidebar;