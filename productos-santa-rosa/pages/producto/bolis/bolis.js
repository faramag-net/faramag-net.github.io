const productos = [
  {
    nombre: "Mango",
    precio: 20,
    imagen: "../../../../imagenes/bcafe.jpg",
    mensaje: "Quiero boli de mango"
  },

  {
    nombre: "Fresa",
    precio: 20,
    imagen: "../../../../imagenes/bfresa.jpg",
    mensaje: "Quiero boli de fresa"
  },

  {
    nombre: "Chocolate",
    precio: 20,
    imagen: "../../../../imagenes/bchocolate.jpg",
    mensaje: "Quiero boli de chocolate"
  },

  {
    nombre: "Limón",
    precio: 20,
    imagen: "../../../../imagenes/blimon.jpg",
    mensaje: "Quiero boli de limón"
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
