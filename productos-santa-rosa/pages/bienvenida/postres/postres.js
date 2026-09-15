const productos = [

  // postres
  {
    nombre: "Carlota de Limón",
    precio: 20,
    tipo: "postres",
    activo: true,
    descripcion: "Adornado con nuez y frutas",
    imagen: "/imagenes/postrecarlota.png",
    mensaje: "Quiero Carlota de Limón"
  },

    {
    nombre: "Flan caramelo en vaso",
    precio: 18,
    tipo: "postres",
    activo: true,
    descripcion: "Adornado con nuez y un toque de caramelo",
    imagen: "../../../../imagenes/postreflan.png",
    mensaje: "Quiero Flan caramelo en vaso"
  },

    {
    nombre: "Arroz con Leche",
    precio: 18,
    tipo: "postres",
    activo: true,
    descripcion: "Adornado con pasas",
    imagen: "../../../../imagenes/postrearrozconleche.png",
    mensaje: "Quiero Arroz con Leche"
  },

    {
    nombre: "Gelatina de mosaico de frutas",
    precio: 20,
    tipo: "postres",
    activo: true,
    descripcion: "Adornado con Frutas",
    imagen: "../../../../imagenes/postremosaicofrutas.png",
    mensaje: "Quiero Gelatina de Mosaico de Frutas"
  },

    {
    nombre: "Gelatina mosaico en vaso",
    precio: 18,
    tipo: "postres",
    activo: true,
    descripcion: "delicioso postre en un vaso",
    imagen: "../../../../imagenes/postremosaicovaso.png",
    mensaje: "Quiero Gelatina Mosaico en Vaso"
  },

    {
    nombre: "Flan Napolitano",
    precio: 25,
    tipo: "postres",
    activo: true,
    descripcion: "adonado con cajeta o con caramelo",
    imagen: "../../../../imagenes/postreflannapolitano.jpg",
    mensaje: "Quiero Flan Napolitano"
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
  const h2 = document.createElement("h2");
  h2.textContent = titulo;
  h2.className = "categoria-titulo";

  const grid = document.createElement("div");
  grid.className = "grid";

  lista
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
    .forEach(producto => {
      const card = document.createElement("article");
      card.className = "producto";

      const descripcion = producto.descripcion?.trim()
        ? escaparHTML(producto.descripcion)
        : "Una opción artesanal de Santa Rosa.";

      const mensajePublico = producto.mensaje || `Quiero ${producto.nombre}`;

      card.innerHTML = `
        <img src="${escaparHTML(producto.imagen)}"
             alt="${escaparHTML(producto.nombre)}"
             loading="lazy">

        <p class="nombre">${escaparHTML(producto.nombre)}</p>

        <p class="precio-label">Precio al público</p>
        <p class="precio">$${Number(producto.precio).toFixed(2)}</p>

        <p class="descripcion">${descripcion}</p>

        <div class="acciones">
          <a class="btn"
             href="https://wa.me/5212225655003?text=${encodeURIComponent(mensajePublico)}"
             target="_blank" rel="noopener noreferrer">
             💬 Pedir por WhatsApp
          </a>
        </div>
      `;

      grid.appendChild(card);
    });

  if (titulo) contenido.appendChild(h2);
  contenido.appendChild(grid);
}


crearSeccion(
  "",
  productos.filter(p => p.tipo === "postres" && p.activo)
);

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

cerrarModal.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", event => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    modal.style.display = "none";
  }
});
