const productos = [

  {
    nombre: "Kiwi",
    precio: 20,
    imagen: "../../../../imagenes/kiwi.png",
    mensaje: "Quiero paleta de kiwi"
  },

  {
    nombre: "Naranja",
    precio: 20,
    imagen: "../../../../imagenes/naranja.png",
    mensaje: "Quiero paleta de naranja"
  },

  {
    nombre: "Toronja",
    precio: 20,
    imagen: "../../../../imagenes/toronja.png",
    mensaje: "Quiero paleta de toronja"
  },

  {
    nombre: "Limón",
    precio: 20,
    imagen: "../../../../imagenes/limon.png",
    mensaje: "Quiero paleta de limón"
  },

  {
    nombre: "Piña",
    precio: 20,
    imagen: "../../../../imagenes/pinia.png",
    mensaje: "Quiero paleta de piña"
  },

  {
    nombre: "Sandía",
    precio: 20,
    imagen: "../../../../imagenes/sandia.png",
    mensaje: "Quiero paleta de sandía"
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
