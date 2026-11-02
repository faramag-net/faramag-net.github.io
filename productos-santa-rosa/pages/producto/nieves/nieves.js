// Catálogo de nieves Santa Rosa.
// Agrega aquí cada sabor cuando estén definidos su precio, descripción e imagen.
const productos = [];

const contenido = document.getElementById("contenido");

function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function crearSeccion(titulo, lista) {
  if (!lista.length) return;
  const h2 = document.createElement("h2");
  h2.className = "categoria-titulo";
  h2.textContent = titulo;
  const grid = document.createElement("div");
  grid.className = "grid";
  lista.forEach(producto => {
    const card = document.createElement("article");
    card.className = "producto";
    card.innerHTML = `
      <img src="${escaparHTML(producto.imagen)}" alt="${escaparHTML(producto.nombre)}" loading="lazy">
      <p class="nombre">${escaparHTML(producto.nombre)}</p>
      <p class="precio-label">Precio al público</p>
      <p class="precio">$${Number(producto.precio).toFixed(2)}</p>
      <p class="descripcion">${escaparHTML(producto.descripcion || "")}</p>
      <div class="acciones">
        <a class="btn" href="https://wa.me/5212225655003?text=${encodeURIComponent(producto.mensaje || `Quiero información sobre ${producto.nombre}`)}" target="_blank" rel="noopener noreferrer">💬 Pedir por WhatsApp</a>
      </div>`;
    grid.appendChild(card);
  });
  contenido.append(h2, grid);
}

crearSeccion("🥄 Nieves de garrafa", productos.filter(p => p.activo !== false));

const modal = document.getElementById("modalImagen");
const imagenGrande = document.getElementById("imagenGrande");
const cerrarModal = document.getElementById("cerrarModal");
if (modal && imagenGrande && cerrarModal) {
  document.addEventListener("click", event => {
    const imagen = event.target.closest(".producto img");
    if (!imagen) return;
    imagenGrande.src = imagen.src;
    imagenGrande.alt = imagen.alt;
    modal.style.display = "flex";
  });
  cerrarModal.addEventListener("click", () => modal.style.display = "none");
  modal.addEventListener("click", event => {
    if (event.target === modal) modal.style.display = "none";
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") modal.style.display = "none";
  });
}
