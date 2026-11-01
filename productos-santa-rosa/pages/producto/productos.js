const categorias = [
  { nombre: "Bolis", emoji: "🧊", clase: "bolis", enlace: "./bolis/" },
  { nombre: "Paletas", emoji: "🍦", clase: "paletas", enlace: "./paletas/" },
  { nombre: "Nieves", emoji: "🥄", clase: "nieves", enlace: "./nieves/" },
  { nombre: "Inicio", emoji: "🏠", clase: "inicio", enlace: "../bienvenida/" }
];

const contenedor = document.getElementById("categorias");
categorias.forEach(categoria => {
  const boton = document.createElement("a");
  boton.classList.add("btn", categoria.clase);
  boton.href = categoria.enlace;
  boton.textContent = `${categoria.emoji} Ver ${categoria.nombre}`;
  contenedor.appendChild(boton);
});
