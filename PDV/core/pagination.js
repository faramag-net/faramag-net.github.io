/**
 * ==========================================================
 * PDV
 * Archivo: pagination.js
 * Módulo: Core
 * Descripción: Utilidad de paginación para listas y tablas.
 * Versión: 0.9.20
 * ==========================================================
 */

const Pagination = {
    create({ container, onChange, total, page = 1, pageSize = 25 }) {
        container.replaceChildren();
        const pages = Math.max(1, Math.ceil(total / pageSize));

        const wrapper = document.createElement("div");
        wrapper.className = "pagination";

        const info = document.createElement("span");
        info.className = "pagination-info";
        const start = total === 0 ? 0 : ((page - 1) * pageSize) + 1;
        const end = Math.min(page * pageSize, total);
        info.textContent = total ? `Mostrando ${start}–${end} de ${total}` : "Sin registros";

        const controls = document.createElement("div");
        controls.className = "pagination-controls";

        const sizeLabel = document.createElement("label");
        sizeLabel.className = "pagination-size";
        sizeLabel.textContent = "Mostrar:";

        const size = document.createElement("select");
        for (const value of [25, 50, 100]) {
            const option = document.createElement("option");
            option.value = String(value);
            option.textContent = String(value);
            option.selected = value === pageSize;
            size.appendChild(option);
        }
        size.addEventListener("change", () => onChange(1, Number(size.value)));
        sizeLabel.appendChild(size);

        const previous = document.createElement("button");
        previous.type = "button";
        previous.textContent = "‹ Anterior";
        previous.disabled = page <= 1 || total === 0;
        previous.addEventListener("click", () => onChange(page - 1, pageSize));

        const next = document.createElement("button");
        next.type = "button";
        next.textContent = "Siguiente ›";
        next.disabled = page >= pages || total === 0;
        next.addEventListener("click", () => onChange(page + 1, pageSize));

        const pageInfo = document.createElement("span");
        pageInfo.className = "pagination-page";
        pageInfo.textContent = `Página ${total ? page : 1} de ${pages}`;

        controls.append(sizeLabel, previous, pageInfo, next);
        wrapper.append(info, controls);
        container.appendChild(wrapper);
    }
};

export default Pagination;
