const productos = [
  {
    nombre: "Jitomate Saladet",
    precio: null,
    tipo: "frescos",
    activo: true,
    descripcion: "Fresco y natural.",
    imagen: "../../../../imagenes/jitomatecaja.webp",
    mensaje: "Quiero información sobre Jitomate Saladet"
  },
  {
    nombre: "Jitomate Bola",
    precio: null,
    tipo: "frescos",
    activo: true,
    descripcion: "Tamaño uniforme, ideal para ensaladas, hamburguesas y consumo fresco.",
    imagen: "../../../../imagenes/tomatebola.jpg",
    mensaje: "Quiero información sobre Jitomate Bola"
  },
  {
    nombre: "Jitomate en Tara",
    precio: null,
    tipo: "frescos",
    activo: false,
    descripcion: "Presentación a granel para mayoreo, distribución y centros de abasto.",
    imagen: "../../../../imagenes/jitomatetara.jpg",
    mensaje: "Quiero información sobre Jitomate en Tara"
  }
];

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
  h2.textContent = titulo;
  h2.className = "categoria-titulo";

  const grid = document.createElement("div");
  grid.className = "grid";

  lista.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })).forEach(producto => {
    const card = document.createElement("article");
    card.className = "producto";

    const descripcion = producto.descripcion?.trim()
      ? escaparHTML(producto.descripcion)
      : "Una opción de Santa Rosa.";
    const mensajePublico = producto.mensaje || `Quiero información sobre ${producto.nombre}`;
    const precioHTML = producto.precio == null || producto.precio === ""
      ? '<p class="precio consulta">Consultar</p>'
      : `<p class="precio">$${Number(producto.precio).toFixed(2)}</p>`;

    card.innerHTML = `
      <img src="${escaparHTML(producto.imagen)}" alt="${escaparHTML(producto.nombre)}" loading="lazy">
      <p class="nombre">${escaparHTML(producto.nombre)}</p>
      <p class="precio-label">Precio</p>
      ${precioHTML}
      <p class="descripcion">${descripcion}</p>
      <div class="acciones">
        <a class="btn" href="https://wa.me/5212225655003?text=${encodeURIComponent(mensajePublico)}" target="_blank" rel="noopener noreferrer">💬 Pedir por WhatsApp</a>
      </div>`;
    grid.appendChild(card);
  });

  contenido.appendChild(h2);
  contenido.appendChild(grid);
}

crearSeccion("🥬 Productos Frescos", productos.filter(p => p.tipo === "frescos" && p.activo));
crearSeccion("🌶️ Productos Tradicionales", productos.filter(p => p.tipo === "tradicionales" && p.activo));

const modal = document.getElementById("modalImagen");
const imagenGrande = document.getElementById("imagenGrande");
const cerrarModal = document.getElementById("cerrarModal");

document.addEventListener("click", event => {
  const imagen = event.target.closest(".producto img");
  if (!imagen) return;
  imagenGrande.src = imagen.src;
  imagenGrande.alt = imagen.alt;
  modal.style.display = "flex";
});

cerrarModal.addEventListener("click", () => { modal.style.display = "none"; });
modal.addEventListener("click", event => { if (event.target === modal) modal.style.display = "none"; });
document.addEventListener("keydown", event => { if (event.key === "Escape") modal.style.display = "none"; });
