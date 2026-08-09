const productos = [

  // postres
  {
    nombre: "Carlota de Limón",
    precio: 20,
    tipo: "postres",
    activo: true,
    descripcion: "Adornado con nuez y frutas",
    imagen: "../../../../imagenes/postrecarlota.png",
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
    precio: 22,
    tipo: "postres",
    activo: true,
    descripcion: "adonado con cajeta o con caramelo",
    imagen: "../../../../imagenes/postreflannapolitano.jpg",
    mensaje: "Quiero Flan Napolitano"
  },

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
  "",
  productos.filter(p => p.tipo === "postres" && p.activo)
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
