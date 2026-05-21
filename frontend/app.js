const form = document.getElementById('productForm');
const tabla = document.getElementById('tablaProductos');
const ubicacionBtn = document.getElementById('ubicacionBtn');

let productos = JSON.parse(localStorage.getItem('productos')) || [];

let latitud = '';
let longitud = '';

ubicacionBtn.addEventListener('click', () => {

  if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

      (position) => {

        latitud = position.coords.latitude;
        longitud = position.coords.longitude;

        ubicacionBtn.innerText = '✅ Ubicación lista';
      },

      () => {
        alert('No se pudo obtener ubicación');
      }

    );

  } else {

    alert('Tu navegador no soporta geolocalización');

  }

});

form.addEventListener('submit', function(e) {

  e.preventDefault();

  const producto = document.getElementById('producto').value;
  const precio = document.getElementById('precio').value;
  const tienda = document.getElementById('tienda').value;
  const contacto = document.getElementById('contacto').value;

  const fecha = new Date().toLocaleString();
  
  if(latitud === '' || longitud === ''){

  alert('Primero obtén la ubicación 📍');
  return;

  }
  
  const nuevoProducto = {
    producto,
    precio,
    tienda,
    contacto,
    fecha,
    latitud,
    longitud
  };
  
  productos.push(nuevoProducto);

  mostrarProductos();

  form.reset();
  ubicacionBtn.innerText = '📍 Obtener ubicación';
  latitud = '';
  longitud = '';
  
});

function mostrarProductos(){

  tabla.innerHTML = '';

  productos.forEach(p => {

    tabla.innerHTML += `
      <tr>
        <td>${p.producto}</td>
        <td>$${p.precio}</td>
        <td>${p.tienda}</td>
        <td>${p.contacto}</td>
        <td>
        <a href="https://www.google.com/maps?q=${p.latitud},${p.longitud}" target="_blank">
        Ver mapa
        </a>
        </td>
        <td>${p.fecha}</td>
      </tr>
    `;

  });

  localStorage.setItem(
    'productos',
    JSON.stringify(productos)
  );

}

mostrarProductos();
