const productos = [

  // LECHOSOS
  {
    nombre: "Beso de Ángel",
    precio: 22,
    tipo: "gourmet",
    activo: true,
    descripcion: "Cereza con trozos de Nuez, arandanos y coco",
    imagen: "../../../../imagenes/paletabeso.png",
    mensaje: "Quiero paleta de Beso de Angel"
  },

  {
    nombre: "Coco",
    precio: 20,
    tipo: "leche",
    activo: true,
    descripcion: "Cremoso relleno con coco rallado",
    imagen: "../../../../imagenes/paletacoco.png",
    mensaje: "Quiero paleta de Coco"
  },

  {
    nombre: "Fresa",
    precio: 20,
    tipo: "leche",
    activo: true,
    descripcion: "Delicioso y cremoso con trozos de fresa",
    imagen: "../../../../imagenes/paletafresa.png",
    mensaje: "Quiero paleta de Fresa"
  },

  {
    nombre: "Frutos Rojos",
    precio: 22,
    tipo: "gourmet",
    activo: true,
    descripcion: "Rica combinacion de 🫐 Mora azul,🫐 Zarzamora y ❤️ Frambuesa",
    imagen: "../../../../imagenes/paletafrutos.jpg",
    mensaje: "Quiero paleta Frutos Rojos"
  },

  {
    nombre: "Mamey",
    precio: 20,
    tipo: "leche",
    activo: true,
    descripcion: "Cremoso y delicioso, con mamey natural",
    imagen: "../../../../imagenes/paletamamey.png",
    mensaje: "Quiero paleta de Mamey"
  },

  {
    nombre: "Choco Nutella",
    precio: 24,
    tipo: "gourmet",
    activo: true,
    descripcion: "Chocolate con una deliciosa cobertura de Nutella",
    imagen: "../../../../imagenes/paletanutella.png",
    mensaje: "Quiero paleta Choco Nutella"
  },

  {
    nombre: "Chocolate",
    precio: 20,
    tipo: "leche",
    activo: true,
    descripcion: "Intenso y delicioso chocolate",
    imagen: "../../../../imagenes/paletachocolate.jpg",
    mensaje: "Quiero paleta Chocolate"
  },

  {
    nombre: "Oreo",
    precio: 22,
    tipo: "gourmet",
    activo: true,
    descripcion: "Delicioso sabor a Oreo con trozos de galleta",
    imagen: "../../../../imagenes/paletaoreo.jpg",
    mensaje: "Quiero paleta Oreo"
  },

  // HIELO
  {
    nombre: "Mango con chile y chamoy",
    precio: 18,
    tipo: "hielo",
    activo: true,
    descripcion: "Picosita con pulpa y trozos de mango",
    imagen: "../../../../imagenes/paletamangochamoy.jpg",
    mensaje: "Quiero paleta de Mango con chile y chamoy"
  },

  {
    nombre: "Tropical",
    precio: 18,
    tipo: "hielo",
    activo: true,
    descripcion: "Refrescante mezcla de frutas tropicales",
    imagen: "../../../../imagenes/paletatropical.png",
    mensaje: "Quiero paleta Tropical"
  },

  {
    nombre: "Mango",
    precio: 18,
    tipo: "hielo",
    activo: true,
    descripcion: "Con pulpa y trozos de mango",
    imagen: "../../../../imagenes/paletamango.png",
    mensaje: "Quiero paleta de Mango"
  },

  {
    nombre: "Pepino con limón",
    precio: 18,
    tipo: "hielo",
    activo: true,
    descripcion: "Refrescante limón con pepino",
    imagen: "../../../../imagenes/paletapepino.jpg",
    mensaje: "Quiero paleta de Pepino con limón"
  },


  {
    nombre: "Piña",
    precio: 18,
    tipo: "hielo",
    activo: true,
    descripcion: "Con pulpa de piña",
    imagen: "../../../../imagenes/paletapina.png",
    mensaje: "Quiero paleta de Piña"
  },

  {
    nombre: "Piña con chile y chamoy",
    precio: 18,
    tipo: "hielo",
    activo: true,
    descripcion: "Picosita y refrescante",
    imagen: "../../../../imagenes/paletapinachamoy.jpg",
    mensaje: "Quiero paleta de Piña con chile y chamoy"
  },

  {
    nombre: "Oasis",
    precio: 18,
    tipo: "hielo",
    activo: true,
    descripcion: "Refrescante mezcla de fresa, naranja y papaya",
    imagen: "../../../../imagenes/paletaoasis.png",
    mensaje: "Quiero paleta Oasis"
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
  "🧊 Paletas de Agua Refrescantes",
  productos.filter(p => p.tipo === "hielo" && p.activo)
);

crearSeccion(
  "🥛 Paletas de Leche Cremosas",
  productos.filter(p => p.tipo === "leche" && p.activo)
);

crearSeccion(
  "✨ Paletas Gourmet",
  productos.filter(p => p.tipo === "gourmet" && p.activo)
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
