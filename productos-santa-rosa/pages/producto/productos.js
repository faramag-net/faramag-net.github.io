const categorias = [

  {
    nombre: "Bolis",
    emoji: "🧊",
    clase: "bolis",
    enlace: "./bolis/"
  },

  {
    nombre: "Paletas",
    emoji: "🍦",
    clase: "paletas",
    enlace: "./paletas/"
  },

  {
    nombre: "Inicio",
    emoji: "🍰",
    clase: "postres",
    enlace: "../bienvenida/postres/"
  },

  {
    nombre: "Inicio",
    emoji: "🏠",
    clase: "inicio",
    enlace: "../bienvenida/"
  },

];

const contenedor = document.getElementById("categorias");

categorias.forEach(categoria => {

  const boton = document.createElement("a");

  boton.classList.add("btn");
  boton.classList.add(categoria.clase);

  boton.href = categoria.enlace;

  boton.innerHTML = `
    ${categoria.emoji} Ver ${categoria.nombre}
  `;

  contenedor.appendChild(boton);

});
