/**
 * ==========================================================
 * PDV
 * Archivo: article.js
 * Módulo: Domain / Article
 * Descripción: Entidad del dominio Artículo.
 * Versión: 0.8.0
 * ==========================================================
 */

export default class Article {

    constructor(data = {}) {

        this.id = data.id ?? null;

        this.code = data.code ?? "";

        this.name = data.name ?? "";
        this.description = data.description ?? "";

        this.type = data.type ?? "INVENTORY";

        this.purchasePrice = data.purchasePrice ?? 0;
        this.salePrice = data.salePrice ?? 0;

        this.active = data.active ?? true;

        this.createdAt = data.createdAt ?? new Date().toISOString();

        this.updatedAt = data.updatedAt ?? new Date().toISOString();

        this.validate();

    }

    validate() {

        if (!this.name.trim()) {

            throw new Error(
                "El nombre del artículo es obligatorio."
            );

        }

        if (!this.code.trim()) {

            throw new Error(
                "El código del artículo es obligatorio."
            );

        }

        if (this.salePrice <= 0) {

            throw new Error(
                "El precio de venta debe ser mayor que cero."
            );

        }

        if (this.purchasePrice < 0) {

            throw new Error(
                "El precio de compra no puede ser negativo."
            );

        }

    }

    activate() {

        if (!this.active) {

            this.active = true;

            this.touch();

        }

    }

    deactivate() {

        if (this.active) {

            this.active = false;

            this.touch();

        }

    }

    update(data) {

        this.code =
            data.code ?? this.code;

        this.name =
            data.name ?? this.name;

        this.description =
            data.description ?? this.description;

        this.type =
            data.type ?? this.type;

        this.purchasePrice =
            data.purchasePrice ?? this.purchasePrice;

        this.salePrice =
            data.salePrice ?? this.salePrice;

        this.validate();

        this.touch();

    }
    
    touch() {

        this.updatedAt =
            new Date().toISOString();

    }

    toJSON() {

        return {

            id: this.id,

            code: this.code,

            name: this.name,

            description: this.description,

            type: this.type,

            purchasePrice: this.purchasePrice,

            salePrice: this.salePrice,

            active: this.active,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

}

/**
 * ==========================================================
 * Entidad del Dominio
 *
 * Responsabilidades:
 *
 * - Representar un Artículo.
 * - Validar sus reglas.
 * - Cambiar su estado.
 * - Serializarse.
 *
 * No conoce:
 *
 * - LocalStorage
 * - Database
 * - Router
 * - HTML
 * - CSS
 * - Electron
 * ==========================================================
 */