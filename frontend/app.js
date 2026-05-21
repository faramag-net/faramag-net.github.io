  const contador = document.getElementById('contador');
  const form = document.getElementById('productForm');
  const tabla = document.getElementById('tablaProductos');
  const ubicacionBtn = document.getElementById('ubicacionBtn');
  const exportarBtn = document.getElementById('exportarBtn');
  const buscar = document.getElementById('buscar');
  const sugerencias = document.getElementById('sugerencias');

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
    },
  
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  
  );
  
    } else {
  
      alert('Tu navegador no soporta geolocalización');
  
    }
  
  });
  
  form.addEventListener('submit', function(e) {
  
    e.preventDefault();
  
    const producto = document.getElementById('producto').value.trim();
    const precio = Number(document.getElementById('precio').value).toFixed(2);
    const tienda = document.getElementById('tienda').value.trim();
    const contacto = document.getElementById('contacto').value.trim();

    if(!producto || !tienda){

    alert('Producto y tienda son obligatorios');
    return;

    }
    
    const ahora = new Date();
  
    const fecha = ahora.toLocaleString();
    const fechaISO = ahora.toISOString();
    
    if(latitud === '' || longitud === ''){
  
    alert('Primero obtén la ubicación 📍');
    return;
  
    }
  
    if(Number(precio) <= 0){
  
    alert('El precio debe ser mayor a 0');
    return;
    }
    
    const nuevoProducto = {
      id: Date.now(),
      producto,
      precio,
      tienda,
      contacto,
      fecha,
      fechaISO,
      latitud,
      longitud
    };
    
    productos.push(nuevoProducto);
  
    mostrarProductos();
    actualizarSugerencias();
    
    form.reset();
    ubicacionBtn.innerText = '📍 Obtener ubicación';
    latitud = '';
    longitud = '';
    
  });
  
  function mostrarProductos(){
  
    tabla.innerHTML = '';
  
    const textoBusqueda = buscar.value.toLowerCase();
  
  const productosOrdenados = [...productos]
  
  .filter(p =>
    p.producto.toLowerCase().includes(textoBusqueda) ||
    p.tienda.toLowerCase().includes(textoBusqueda)
  )
  
  .sort(
    (a, b) => new Date(b.fechaISO || 0) - new Date(a.fechaISO || 0)
  );
  
    productosOrdenados.forEach(p => {
  
      const fila = `
      <tr>
        <td>${p.producto}</td>
        <td>$${p.precio}</td>
        <td>${p.tienda}</td>
        <td>${p.contacto}</td>
        <td>
  
        <a 
          href="https://www.google.com/maps?q=${p.latitud},${p.longitud}" 
          target="_blank"
          title="${p.latitud}, ${p.longitud}"
        >
          📍 Ver mapa
        </a>
  
        </td>
        <td>${p.fecha}
        </td>
        
        <td>
        <button class="eliminarBtn" onclick="eliminarProducto(${p.id})">
        🗑️
        </button>
        
      </td>
      </tr>
      `;
  
      tabla.innerHTML += fila;
  
    });
  
    contador.innerText = `
    Mostrando ${productosOrdenados.length} de ${productos.length} registros
    `;
    
    localStorage.setItem(
      'productos',
      JSON.stringify(productos)
    );
  
  }

function actualizarSugerencias(){

  sugerencias.innerHTML = '';

  const valoresUnicos = new Set();

  productos.forEach(p => {

    valoresUnicos.add(p.producto);
    valoresUnicos.add(p.tienda);

  });

  valoresUnicos.forEach(valor => {

    sugerencias.innerHTML += `
      <option value="${valor}">
    `;

  });

}

  mostrarProductos();
  actualizarSugerencias();

  buscar.addEventListener('input', mostrarProductos);

  exportarBtn.addEventListener('click', () => {
  
    if(productos.length === 0){
  
      alert('No hay datos para exportar');
      return;
  
    }
  
    let csv = 'Producto,Precio,Tienda,Contacto,Fecha,FechaISO,Latitud,Longitud\n';
  
    const productosOrdenados = [...productos].sort(
    (a, b) => new Date(b.fechaISO || 0) - new Date(a.fechaISO || 0)
  );
  
  productosOrdenados.forEach(p => {
  
      csv += `"${p.producto}","${p.precio}","${p.tienda}","${p.contacto}","${p.fecha}","${p.fechaISO}","${p.latitud}","${p.longitud}"\n`;
  
    });
  
    const blob = new Blob([csv], { type: 'text/csv' });
  
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
  
    a.href = url;
    a.download = 'productos.csv';
  
    a.click();
    alert('CSV exportado correctamente ✅');
    
    URL.revokeObjectURL(url);
  
  });
  
  function eliminarProducto(id){
  
    const confirmar = confirm('¿Eliminar registro?');
  
    if(!confirmar){
      return;
    }
  
    productos = productos.filter(p => p.id !== id);
  
    mostrarProductos();
    actualizarSugerencias();       
  }
