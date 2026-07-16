/**
 * ==========================================================
 * PDV
 * Archivo: modules.service.js
 * Descripción: Administración de módulos.
 * Versión: 0.6.2
 * ==========================================================
 */

// Core
import Logger
from "../core/logger.js";

// Modules
import Registry
from "../modules/registry.js";

const ModulesService = {

async getAll() {

    const modules =
        await Promise.all(

            Registry.map(

                async (id) => {

                    try {

                        const manifest =
                            await import(
                                `../modules/${id}/manifest.js`
                            );

                        return manifest.default;

                    }

                    catch (error) {

                        Logger.warning(
                            "ModulesService",
                            `No fue posible cargar el módulo "${id}".`
                        );

                        console.error(error);

                        return null;

                    }

                }

            )

        );

    const result =
        modules.filter(Boolean);

    Logger.success(
        "ModulesService",
        `${result.length} módulos cargados.`
    );

    return result;

},


async getMenu() {

    const modules =
        await this.getAll();

    return modules

    .filter(

        module =>

            module.menu &&
            module.enabled

    )

        .sort(

            (a, b) =>

                a.order -
                b.order

        );

},

async get(id) {

    const modules =
        await this.getAll();

    const module =
        modules.find(
            module =>
                module.id === id
        );

    if (!module) {

        Logger.warning(
            "ModulesService",
            `El módulo "${id}" no existe.`
        );

    }

    return module;

    }

};

export default ModulesService;