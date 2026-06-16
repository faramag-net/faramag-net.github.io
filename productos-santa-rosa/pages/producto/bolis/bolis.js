const productos = [

  // LECHOSOS
  {
    nombre: "Beso de Ángel",
    precio: 22,
    tipo: "leche",
    imagen: "../../../../imagenes/bolibeso.png",
    mensaje: "Quiero boli de Beso de Angel"
  },

  {
    nombre: "Coco",
    precio: 22,
    tipo: "leche",
    imagen: "../../../../imagenes/bolicoco.png",
    mensaje: "Quiero boli de Coco"
  },

  {
    nombre: "Fresa",
    precio: 22,
    tipo: "leche",
    imagen: "../../../../imagenes/bolifresa.png",
    mensaje: "Quiero boli de Fresa"
  },

  {
    nombre: "Frutos Rojos",
    precio: 22,
    tipo: "leche",
    imagen: "../../../../imagenes/bolifrutos.png",
    mensaje: "Quiero boli Frutos Rojos"
  },

  {
    nombre: "Mamey",
    precio: 22,
    tipo: "leche",
    imagen: "../../../../imagenes/bolimamey.png",
    mensaje: "Quiero boli de Mamey"
  },

  {
    nombre: "Choco Nutella",
    precio: 22,
    tipo: "leche",
    imagen: "../../../../imagenes/bolinuetlla.png",
    mensaje: "Quiero boli Choco Nutella"
  },

  {
    nombre: "Oreo",
    precio: 22,
    tipo: "leche",
    imagen: "../../../../imagenes/bolioreo.png",
    mensaje: "Quiero boli Oreo"
  },

  // HIELO
  {
    nombre: "Mango Chamoy",
    precio: 20,
    tipo: "hielo",
    imagen: "../../../../imagenes/bolimangochamoy.png",
    mensaje: "Quiero boli de Mango Chamoy"
  },

  {
    nombre: "Tropical",
    precio: 20,
    tipo: "hielo",
    imagen: "../../../../imagenes/bolitropical.png",
    mensaje: "Quiero boli Tropical"
  },

  {
    nombre: "Mango",
    precio: 20,
    tipo: "hielo",
    imagen: "../../../../imagenes/bolimango.png",
    mensaje: "Quiero boli de Mango"
  },

  {
    nombre: "Oasis",
    precio: 20,
    tipo: "hielo",
    imagen: "../../../../imagenes/bolioasis.png",
    mensaje: "Quiero boli Oasis"
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

      <a class="btn"
         href="https://wa.me/5212225655003?text=${encodeURIComponent(producto.mensaje)}"
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
  "🧊 Bolis de Agua Refrescantes",
  productos.filter(p => p.tipo === "hielo")
);

crearSeccion(
  "🥛 Bolis de Leche Cremosos",
  productos.filter(p => p.tipo === "leche")
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
