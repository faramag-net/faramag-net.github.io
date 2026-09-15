export function normalizarTexto(texto){

    return (texto || "")
        .trim()
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/\s+/g, " ");

}
