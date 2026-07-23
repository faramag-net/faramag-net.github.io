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

        this.id = data.id ?? crypto.randomUUID();

        this.code = data.code ?? "";
        this.barcode = data.barcode ?? "";

        this.name = data.name ?? "";
        this.description = data.description ?? "";

        this.categoryId = data.categoryId ?? null;
        this.brand = data.brand ?? "";

        this.type = data.type ?? "INVENTORY";

        this.purchasePrice = data.purchasePrice ?? 0;
        this.salePrice = data.salePrice ?? 0;

        this.inventoryControlled =
            data.inventoryControlled ?? true;

        this.active =
            data.active ?? true;

        this.createdAt =
            data.createdAt ?? new Date().toISOString();

        this.updatedAt =
            data.updatedAt ?? new Date().toISOString();

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

        if (this.salePrice < 0) {

            throw new Error(
                "El precio de venta no puede ser negativo."
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

    touch() {

        this.updatedAt =
            new Date().toISOString();

    }

    toJSON() {

        return {

            id: this.id,

            code: this.code,

            barcode: this.barcode,

            name: this.name,

            description: this.description,

            categoryId: this.categoryId,

            brand: this.brand,

            type: this.type,

            purchasePrice: this.purchasePrice,

            salePrice: this.salePrice,

            inventoryControlled: this.inventoryControlled,

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