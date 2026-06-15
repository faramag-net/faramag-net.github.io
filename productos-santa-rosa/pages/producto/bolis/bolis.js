const productos = [
  {
    nombre: "Beso de Ángel",
    precio: 22,
    imagen: "../../../../imagenes/bolibeso.png",
    mensaje: "Quiero boli de Beso de Angel"
  },

  {
    nombre: "Mango Chamoy",
    precio: 20,
    imagen: "../../../../imagenes/bolimangochamoy.png",
    mensaje: "Quiero boli de Mango Chamoy"
  },

  {
    nombre: "Coco",
    precio: 22,
    imagen: "../../../../imagenes/bolicoco.png",
    mensaje: "Quiero boli de Chocolate"
  },

    {
    nombre: "Fresa",
    precio: 22,
    imagen: "../../../../imagenes/bolifresa.png",
    mensaje: "Quiero boli de Fresa"
  },

  {
    nombre: "Tropical",
    precio: 20,
    imagen: "../../../../imagenes/bolitropical.png",
    mensaje: "Quiero boli Tropical"
  },

  {
    nombre: "Frutos Rojos",
    precio: 22,
    imagen: "../../../../imagenes/bolifrutos.png",
    mensaje: "Quiero boli Frutos Rojos"
  },

  {
    nombre: "Mamey",
    precio: 22,
    imagen: "../../../../imagenes/bolimamey.png",
    mensaje: "Quiero boli de Mamey"
  },

  {
    nombre: "Choco Nutella",
    precio: 22,
    imagen: "../../../../imagenes/bolinuetlla.png",
    mensaje: "Quiero boli Choco Nutella"
  },

  {
    nombre: "Tropical",
    precio: 20,
    imagen: "../../../../imagenes/bolioasis.png",
    mensaje: "Quiero boli Oasis"
  },

  {
    nombre: "Tropical",
    precio: 20,
    imagen: "../../../../imagenes/bolioreo.png",
    mensaje: "Quiero boli Oreo"
  }
 
];

const grid = document.getElementById("grid");

productos.forEach(producto => {

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
