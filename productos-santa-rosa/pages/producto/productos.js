const categorias = [

  {
    nombre: "Bolis",
    emoji: "🧊",
    clase: "bolis",
    enlace: "./bolis/index.html"
  },

  {
    nombre: "Paletas",
    emoji: "🍦",
    clase: "paletas",
    enlace: "./paletas/index.html"
  }

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
