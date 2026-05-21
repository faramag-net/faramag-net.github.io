const form = document.getElementById('productForm');
const tabla = document.getElementById('tablaProductos');

let productos = [];

form.addEventListener('submit', function(e) {

  e.preventDefault();

  const producto = document.getElementById('producto').value;
  const precio = document.getElementById('precio').value;
  const tienda = document.getElementById('tienda').value;
  const contacto = document.getElementById('contacto').value;

  const fecha = new Date().toLocaleString();

  const nuevoProducto = {
    producto,
    precio,
    tienda,
    contacto,
    fecha
  };

  productos.push(nuevoProducto);

  mostrarProductos();

  form.reset();
});

function mostrarProductos() {

  tabla.innerHTML = '';

  productos.forEach(p => {

    tabla.innerHTML += `
      <tr>
        <td>${p.producto}</td>
        <td>$${p.precio}</td>
        <td>${p.tienda}</td>
        <td>${p.contacto}</td>
        <td>${p.fecha}</td>
      </tr>
    `;
  });
}
