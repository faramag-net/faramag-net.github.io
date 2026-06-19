const productos = [

  // LECHOSOS
  {
    nombre: "Beso de Ángel",
    precio: 22,
    tipo: "leche",
    activo: true,
    descripcion: "Cereza con trozos de Nuez, arandanos y coco",
    imagen: "../../../../imagenes/paletabeso.png",
    mensaje: "Quiero paleta de Beso de Angel"
  },

  {
    nombre: "Coco",
    precio: 22,
    tipo: "leche",
    activo: true,
    descripcion: "",
    imagen: "../../../../imagenes/paletacoco.png",
    mensaje: "Quiero paleta de Coco"
  },

  {
    nombre: "Fresa",
    precio: 22,
    tipo: "leche",
    activo: true,
    descripcion: "Con trozos de fresa",
    imagen: "../../../../imagenes/paletafresa.png",
    mensaje: "Quiero paleta de Fresa"
  },

  {
    nombre: "Frutos Rojos",
    precio: 22,
    tipo: "leche",
    activo: false,
    descripcion: "",
    imagen: "../../../../imagenes/paletafrutos.png",
    mensaje: "Quiero paleta Frutos Rojos"
  },

  {
    nombre: "Mamey",
    precio: 22,
    tipo: "leche",
    activo: true,
    descripcion: "",
    imagen: "../../../../imagenes/paletamamey.png",
    mensaje: "Quiero paleta de Mamey"
  },

  {
    nombre: "Choco Nutella",
    precio: 22,
    tipo: "leche",
    activo: true,
    descripcion: "Chocolate y avellana en cada mordida",
    imagen: "../../../../imagenes/paletanutella.png",
    mensaje: "Quiero paleta Choco Nutella"
  },

  {
    nombre: "Oreo",
    precio: 22,
    tipo: "leche",
    activo: true,
    descripcion: "",
    imagen: "../../../../imagenes/paletaoreo.png",
    mensaje: "Quiero paleta Oreo"
  },

  // HIELO
  {
    nombre: "Mango Chamoy",
    precio: 20,
    tipo: "hielo",
    activo: false,
    descripcion: "Con pulpa y trozos de mango",
    imagen: "../../../../imagenes/paletamangochamoy.png",
    mensaje: "Quiero paleta de Mango Chamoy"
  },

  {
    nombre: "Tropical",
    precio: 20,
    tipo: "hielo",
    activo: true,
    descripcion: "Refrescante mezcla de frutas tropicales",
    imagen: "../../../../imagenes/paletatropical.png",
    mensaje: "Quiero paleta Tropical"
  },

  {
    nombre: "Mango",
    precio: 20,
    tipo: "hielo",
    activo: false,
    descripcion: "Con pulpa y trozos de mango",
    imagen: "../../../../imagenes/paletamango.png",
    mensaje: "Quiero paleta de Mango"
  },

  {
    nombre: "Oasis",
    precio: 20,
    tipo: "hielo",
    activo: true,
    descripcion: "Refrescante mezcla de fresa, naranja y papaya",
    imagen: "../../../../imagenes/paletaoasis.png",
    mensaje: "Quiero paleta Oasis"
  }

];

const contenido = document.getElementById("contenido");

function crearSeccion(titulo, lista) {

  const h2 = document.createElement("h2");
  h2.textContent = titulo;

  h2.className = "categoria-titulo";

  h2.textContent = titulo;

  const grid = document.createElement("div");
  grid.className = "grid";

  lista.forEach(producto => {

    const card = document.createElement("div");

    card.classList.add("producto");

    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}">

      <p>${producto.nombre} - $${producto.precio}</p>

      <p class="descripcion">
        ${producto.descripcion}
      </p>
      
      <a class="btn"
         href="https://wa.me/5216243516893?text=${encodeURIComponent(producto.mensaje)}"
         target="_blank">
         Pedir por WhatsApp
      </a>
    `;

    grid.appendChild(card);

  });

  contenido.appendChild(h2);
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

const modal =
    document.getElementById("modalImagen");

const imagenGrande =
    document.getElementById("imagenGrande");

const cerrarModal =
    document.getElementById("cerrarModal");

document.addEventListener("click", e => {

    if(e.target.matches(".producto img")){

        imagenGrande.src =
            e.target.src;

        modal.style.display =
            "flex";
    }

});

cerrarModal.addEventListener("click", () => {

    modal.style.display =
        "none";

});

modal.addEventListener("click", e => {

    if(e.target === modal){

        modal.style.display =
            "none";
    }

});
