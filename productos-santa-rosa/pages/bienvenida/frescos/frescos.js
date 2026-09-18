const productos = [
  {
    nombre: "Jitomate Saladet",
    precio: null,
    tipo: "frescos",
    activo: true,
    descripcion: "Fresco, disponible a granel y mayoreo para negocio, distribución y centros de abasto.",
    imagen: "../../../../imagenes/jitomatecaja.webp",
    mensaje: "Quiero información sobre Jitomate Saladet"
  },

  {
    nombre: "Jitomate Bola",
    precio: null,
    tipo: "frescos",
    activo: true,
    descripcion: "Fresco, disponible a granel y mayoreo para negocio, distribución y centros de abasto.",
    imagen: "../../../../imagenes/tomatebola.jpg",
    mensaje: "Quiero información sobre Jitomate Bola"
  },

  {
  nombre: "Pepino",
  precio: null,
  tipo: "frescos",
  activo: true,
  descripcion: "Fresco, disponible a granel y mayoreo para negocio, distribución y centros de abasto.",
  imagen: "../../../../imagenes/pepino.jpg",
  mensaje: "Quiero información sobre Pepino"
},

{
  nombre: "Chile Miahuateco",
  precio: null,
  tipo: "frescos",
  activo: true,
  descripcion: "Fresco, disponible a granel y mayoreo para negocio, distribución y centros de abasto.",
  imagen: "../../../../imagenes/chilemiahuateco.jpg",
  mensaje: "Quiero información sobre Chile Miahuateco"
},

{
  nombre: "Chile Seco Miahuateco",
  precio: null,
  tipo: "frescos",
  activo: true,
  descripcion: "Chile seco de origen Miahuateco, disponible a granel y mayoreo para negocio, distribución y centros de abasto.",
  imagen: "../../../../imagenes/chilesecomiahuateco.jpg",
  mensaje: "Quiero información sobre Chile Seco Miahuateco"
},

{
  nombre: "Mole poblano en Pasta",
  precio: null,
  tipo: "tradicionales",
  activo: true,
  descripcion: "Mole poblano en pasta de textura espesa, con ajonjolí, chocolate y chile Miahuateco, elaborado en la región de Santa Rosa Tecamachalco.",
  imagen: "../../../../imagenes/mole.jpg",
  mensaje: "Quiero información sobre Mole en Pasta"
},

{
  nombre: "Cajeta de San Juan de los Lagos",
  precio: null,
  tipo: "tradicionales",
  activo: true,
  descripcion: "Deliciosa y auténtica Cajeta artesanal de San Juan de los Lagos 100% Leche de Vaca, disponible a granel y mayoreo para negocio",
  imagen: "../../../../imagenes/cajeta.jpg",
  mensaje: "Quiero información sobre Cajeta"
},



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
