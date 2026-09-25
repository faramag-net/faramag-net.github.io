const MAP_KEY = "psr_map_clients";
const ROUTE_KEY = "psr_route_clients";
const CATEGORIES_KEY = "psr_map_categories";

const DEFAULT_CATEGORIES = [
  { id: "cliente", nombre: "Cliente", color: "#16803c" },
  { id: "prospecto", nombre: "Prospecto", color: "#d97706" },
  { id: "tienda", nombre: "Tienda", color: "#2563eb" },
  { id: "restaurante", nombre: "Restaurante", color: "#9333ea" },
  { id: "otro", nombre: "Otro", color: "#64748b" }
];

const mapa = L.map("mapa", { zoomControl: true }).setView([19.0414, -98.2063], 12);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap"
}).addTo(mapa);

const estado = document.getElementById("estadoUbicacion");
const panel = document.querySelector(".mapa-panel");
const modal = document.getElementById("modalCliente");
const form = document.getElementById("formClienteMapa");
const marcadores = new Map();
let clientesMapa = cargarJSON(MAP_KEY, []);
let categorias = cargarJSON(CATEGORIES_KEY, DEFAULT_CATEGORIES);
let categoriasSeleccionadas = new Set(categorias.map(c => c.id));
let marcadorNuevo = null;
let marcadorMiUbicacion = null;

function cargarJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch (_) {
    return fallback;
  }
}

function guardarMapa() {
  localStorage.setItem(MAP_KEY, JSON.stringify(clientesMapa));
}

function guardarCategorias() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categorias));
}

function esCategoriaPermanente(id) {
  return DEFAULT_CATEGORIES.some(c => c.id === id);
}

function sincronizarClientesVisitasEnMapa() {
  const routeClients = cargarJSON(ROUTE_KEY, []);
  let cambio = false;

  routeClients.forEach(cliente => {
    const lat = Number(cliente.latitud);
    const lon = Number(cliente.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    let registro = clientesMapa.find(c => String(c.routeClientId) === String(cliente.id));
    if (!registro) {
      registro = clientesMapa.find(c => normalizar(c.nombre) === normalizar(cliente.nombre) && c.tipo === "real");
    }

    // Si el cliente fue quitado del mapa, conservar su registro oculto
    // para que no vuelva a aparecer automáticamente al recargar.
    if (registro?.mapVisible === false) {
      return;
    }

    if (!registro) {
      registro = {
        id: crearId(),
        routeClientId: cliente.id,
        nombre: cliente.nombre || "Cliente",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        comentarios: "",
        categoriaId: categorias.some(c => c.id === "cliente") ? "cliente" : categorias[0]?.id,
        tipo: "real",
        latitud: lat,
        longitud: lon,
        createdAt: cliente.createdAt || new Date().toISOString(),
        updatedAt: cliente.updatedAt || new Date().toISOString()
      };
      clientesMapa.push(registro);
      cambio = true;
    } else {
      if (registro.routeClientId !== cliente.id) { registro.routeClientId = cliente.id; cambio = true; }
      if (registro.nombre !== cliente.nombre) { registro.nombre = cliente.nombre || registro.nombre; cambio = true; }
      if (registro.telefono !== (cliente.telefono || "")) { registro.telefono = cliente.telefono || ""; cambio = true; }
      if (registro.direccion !== (cliente.direccion || "")) { registro.direccion = cliente.direccion || ""; cambio = true; }
      if (Number(registro.latitud) !== lat || Number(registro.longitud) !== lon) { registro.latitud = lat; registro.longitud = lon; cambio = true; }
      const tipoRoute = cliente.tipo === "prospecto" ? "prospecto" : "real";
      if (registro.tipo !== tipoRoute) { registro.tipo = tipoRoute; cambio = true; }
      if (!registro.categoriaId || !categorias.some(c => c.id === registro.categoriaId)) { registro.categoriaId = categorias.some(c => c.id === "cliente") ? "cliente" : categorias[0]?.id; cambio = true; }
    }
  });

  if (cambio) guardarMapa();
}

function crearCategoria() {
  const nombre = prompt("Nombre de la nueva categoría:");
  if (!nombre || !nombre.trim()) return;
  const limpio = nombre.trim();
  if (categorias.some(c => normalizar(c.nombre) === normalizar(limpio))) return alert("Ya existe una categoría con ese nombre.");
  const color = prompt("Color del pin (hexadecimal, por ejemplo #0ea5e9):", "#0ea5e9")?.trim() || "#0ea5e9";
  const colorValido = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0ea5e9";
  const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  categorias.push({ id, nombre: limpio, color: colorValido, personalizada: true });
  categoriasSeleccionadas.add(id);
  guardarCategorias();
  renderCategorias();
  renderMarcadores();
}

function renombrarCategoria(id) {
  const categoria = categoriaPorId(id);
  if (!categoria || esCategoriaPermanente(id)) return;
  const nuevoNombre = prompt(`Nuevo nombre para \"${categoria.nombre}\":`, categoria.nombre);
  if (!nuevoNombre || !nuevoNombre.trim()) return;
  const limpio = nuevoNombre.trim();
  if (normalizar(limpio) === normalizar(categoria.nombre)) return;
  if (categorias.some(c => c.id !== id && normalizar(c.nombre) === normalizar(limpio))) {
    return alert("Ya existe una categoría con ese nombre.");
  }
  categoria.nombre = limpio;
  guardarCategorias();
  renderCategorias();
  renderMarcadores();
}

function eliminarCategoria(id) {
  const categoria = categoriaPorId(id);
  if (!categoria || esCategoriaPermanente(id)) return alert("Las categorías predeterminadas no se pueden eliminar.");
  const destino = categorias.filter(c => c.id !== id);
  if (!destino.length) return;
  const opciones = destino.map((c, i) => `${i + 1}. ${c.nombre}`).join("\n");
  const respuesta = prompt(`La categoría \"${categoria.nombre}\" tiene registros. Escribe el número de la categoría a la que quieres pasarlos:\n\n${opciones}`);
  const indice = Number(respuesta) - 1;
  if (!Number.isInteger(indice) || !destino[indice]) return;
  const nueva = destino[indice];
  clientesMapa.forEach(registro => {
    if (registro.categoriaId === id) registro.categoriaId = nueva.id;
  });
  categorias = destino;
  categoriasSeleccionadas.delete(id);
  categoriasSeleccionadas.add(nueva.id);
  guardarCategorias();
  guardarMapa();
  renderCategorias();
  renderMarcadores();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoriaPorId(id) {
  return categorias.find(c => c.id === id) || categorias[0];
}

function crearIconoCategoria(categoria) {
  const color = categoria?.color || "#64748b";
  return L.divIcon({
    className: "pin-categoria-wrapper",
    html: `<span class="pin-categoria" style="--pin-color:${escapeHtml(color)}"><span></span></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -38]
  });
}

function obtenerNombreTipo(tipo) {
  return tipo === "prospecto" ? "🎯 Prospecto" : "👤 Cliente real";
}

function crearId() {
  return `map-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function esReal(registro) {
  return registro.tipo === "real";
}

function sincronizarClienteReal(registro) {
  if (!esReal(registro)) return;
  const lista = cargarJSON(ROUTE_KEY, []);
  const indice = lista.findIndex(c => String(c.id) === String(registro.routeClientId));
  if (indice === -1) return;

  const cliente = lista[indice];
  cliente.nombre = registro.nombre;
  cliente.telefono = registro.telefono || "";
  cliente.direccion = registro.direccion || "";
  cliente.latitud = Number(registro.latitud);
  cliente.longitud = Number(registro.longitud);
  cliente.updatedAt = new Date().toISOString();
  localStorage.setItem(ROUTE_KEY, JSON.stringify(lista));
}

function crearClienteRealDesdeMapa(registro) {
  const lista = cargarJSON(ROUTE_KEY, []);
  const nombre = normalizar(registro.nombre);
  const existente = lista.find(c => normalizar(c.nombre) === nombre);

  if (existente) {
    registro.routeClientId = existente.id;
    existente.telefono = registro.telefono || existente.telefono || "";
    existente.direccion = registro.direccion || existente.direccion || "";
    existente.latitud = Number(registro.latitud);
    existente.longitud = Number(registro.longitud);
    existente.tipo = "real";
    existente.updatedAt = new Date().toISOString();
  } else {
    const nuevo = {
      id: `cliente-${Date.now()}`,
      nombre: registro.nombre,
      telefono: registro.telefono || "",
      direccion: registro.direccion || "",
      latitud: Number(registro.latitud),
      longitud: Number(registro.longitud),
      estatus: "activo",
      createdAt: new Date().toISOString(),
      tipo: "real",
      updatedAt: new Date().toISOString()
    };
    lista.push(nuevo);
    registro.routeClientId = nuevo.id;
  }
  localStorage.setItem(ROUTE_KEY, JSON.stringify(lista));
}

function marcarRouteClientComoProspecto(registro) {
  const lista = cargarJSON(ROUTE_KEY, []);
  let cliente = lista.find(c => String(c.id) === String(registro.routeClientId));

  if (!cliente) {
    const nombre = normalizar(registro.nombre);
    cliente = lista.find(c => normalizar(c.nombre) === nombre);
  }

  if (!cliente) return;

  cliente.tipo = "prospecto";
  cliente.updatedAt = new Date().toISOString();
  localStorage.setItem(ROUTE_KEY, JSON.stringify(lista));
}

function renderCategorias() {
  const lista = document.getElementById("listaCategorias");
  lista.innerHTML = categorias.map(c => `
    <label class="categoria-check">
      <input type="checkbox" data-categoria="${escapeHtml(c.id)}" ${categoriasSeleccionadas.has(c.id) ? "checked" : ""}>
      <span class="dot-categoria" style="--cat-color:${escapeHtml(c.color)}"></span>
      <span>${escapeHtml(c.nombre)}</span>
      ${esCategoriaPermanente(c.id) ? "" : `
        <button type="button" class="btn-editar-categoria" data-editar-categoria="${escapeHtml(c.id)}" title="Cambiar nombre">✏️</button>
        <button type="button" class="btn-eliminar-categoria" data-eliminar-categoria="${escapeHtml(c.id)}" title="Eliminar categoría">🗑️</button>
      `}
    </label>
  `).join("");

  const select = document.getElementById("mapaCategoria");
  select.innerHTML = categorias.map(c =>
    `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nombre)}</option>`
  ).join("");

  lista.querySelectorAll("input[data-categoria]").forEach(input => {
    input.addEventListener("change", () => {
      if (input.checked) categoriasSeleccionadas.add(input.dataset.categoria);
      else categoriasSeleccionadas.delete(input.dataset.categoria);
      renderMarcadores();
    });
  });
  lista.querySelectorAll("button[data-editar-categoria]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      renombrarCategoria(btn.dataset.editarCategoria);
    });
  });
  lista.querySelectorAll("button[data-eliminar-categoria]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      eliminarCategoria(btn.dataset.eliminarCategoria);
    });
  });
}

function coincideBusqueda(registro) {
  const q = normalizar(document.getElementById("buscarMapa").value);
  if (!q) return true;
  const texto = [
    registro.nombre,
    registro.telefono,
    registro.direccion,
    registro.comentarios,
    categoriaPorId(registro.categoriaId)?.nombre,
    registro.tipo
  ].map(normalizar).join(" ");
  return texto.includes(q);
}

function registroVisible(registro) {
  return registro.mapVisible !== false && categoriasSeleccionadas.has(registro.categoriaId) && coincideBusqueda(registro);
}

function abrirGoogleMaps(registro) {
  const lat = Number(registro.latitud);
  const lon = Number(registro.longitud);
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function popupHtml(registro) {
  const categoria = categoriaPorId(registro.categoriaId);
  const tipo = obtenerNombreTipo(registro.tipo);
  const comentario = registro.comentarios
    ? `<div class="popup-nota">💬 ${escapeHtml(registro.comentarios)}</div>`
    : "";

  return `
    <div class="popup-cliente">
      <div class="popup-titulo"><span class="popup-dot" style="--cat-color:${escapeHtml(categoria.color)}"></span><b>${escapeHtml(registro.nombre)}</b></div>
      <div class="popup-meta">${tipo} · ${escapeHtml(categoria.nombre)}</div>
      ${registro.telefono ? `<div>📞 ${escapeHtml(registro.telefono)}</div>` : ""}
      ${registro.direccion ? `<div>📍 ${escapeHtml(registro.direccion)}</div>` : ""}
      ${comentario}
      <div class="popup-botones">
        <button type="button" data-accion="editar" data-id="${escapeHtml(registro.id)}">✏️ Editar</button>
        <button type="button" data-accion="google" data-id="${escapeHtml(registro.id)}">🗺️ Google Maps</button>
      </div>
    </div>
  `;
}

function renderMarcadores() {
  marcadores.forEach(marker => marker.remove());
  marcadores.clear();

  const visibles = clientesMapa.filter(registroVisible);
  visibles.forEach(registro => {
    if (!Number.isFinite(Number(registro.latitud)) || !Number.isFinite(Number(registro.longitud))) return;
    const categoria = categoriaPorId(registro.categoriaId);
    const marker = L.marker([Number(registro.latitud), Number(registro.longitud)], {
      draggable: true,
      icon: crearIconoCategoria(categoria)
    }).addTo(mapa);

    marker.bindPopup(popupHtml(registro));
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      registro.latitud = Number(p.lat);
      registro.longitud = Number(p.lng);
      registro.updatedAt = new Date().toISOString();
      guardarMapa();
      if (esReal(registro)) sincronizarClienteReal(registro);
      actualizarEstado(`📍 Ubicación de ${registro.nombre} actualizada.`);
    });
    marcadores.set(String(registro.id), marker);
  });

  actualizarEstado(`${visibles.length} ${visibles.length === 1 ? "registro visible" : "registros visibles"}.`);
}

function actualizarEstado(texto) {
  estado.textContent = texto;
}

async function obtenerDireccionEscrita(latitud, longitud) {
  const campo = document.getElementById("mapaDireccion");
  if (!campo || !Number.isFinite(Number(latitud)) || !Number.isFinite(Number(longitud))) return "";

  try {
    // Usamos el mismo servicio de geocodificación inversa que funciona
    // actualmente en Visitas para obtener la dirección escrita.
    const respuesta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitud}&lon=${longitud}`
    );

    if (!respuesta.ok) return "";

    const datos = await respuesta.json();
    const direccion = String(datos.display_name || "").trim();

    if (direccion) {
      campo.value = direccion;
      return direccion;
    }
  } catch (error) {
    console.warn("No fue posible obtener la dirección escrita:", error);
  }

  return "";
}

function abrirModal({ registro = null, lat = null, lon = null, obtenerDireccion = true } = {}) {
  const nuevo = !registro;
  document.getElementById("mapaId").value = registro?.id || "";
  document.getElementById("mapaLatitud").value = Number(registro?.latitud ?? lat).toFixed(7);
  document.getElementById("mapaLongitud").value = Number(registro?.longitud ?? lon).toFixed(7);
  document.getElementById("mapaNombre").value = registro?.nombre || "";
  document.getElementById("mapaTelefono").value = registro?.telefono || "";
  document.getElementById("mapaDireccion").value = registro?.direccion || "";
  document.getElementById("mapaComentarios").value = registro?.comentarios || "";
  document.getElementById("mapaCategoria").value = registro?.categoriaId || categorias[0]?.id || "";
  document.querySelector(`input[name="tipoRegistro"][value="${registro?.tipo || "real"}"]`).checked = true;
  document.getElementById("tituloModalMapa").textContent = nuevo ? "📍 Nuevo registro" : `✏️ Editar ${registro.nombre}`;
  document.getElementById("subtituloModalMapa").textContent = nuevo ? "Cliente o prospecto" : obtenerNombreTipo(registro.tipo);
  document.getElementById("btnEliminarRegistro").hidden = nuevo;
  document.getElementById("coordenadasTexto").textContent = `${Number(registro?.latitud ?? lat).toFixed(7)}, ${Number(registro?.longitud ?? lon).toFixed(7)}`;
  modal.classList.add("visible");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => document.getElementById("mapaNombre").focus(), 50);

  // Al crear un registro nuevo, obtener automáticamente la dirección
  // correspondiente al punto seleccionado en el mapa.
  if (nuevo && obtenerDireccion && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
    const campoDireccion = document.getElementById("mapaDireccion");
    campoDireccion.value = "Obteniendo dirección…";
    obtenerDireccionEscrita(Number(lat), Number(lon)).then(direccion => {
      if (!direccion && campoDireccion.value === "Obteniendo dirección…") {
        campoDireccion.value = "";
      }
    });
  }
}

function cerrarModal() {
  modal.classList.remove("visible");
  modal.setAttribute("aria-hidden", "true");
}

function eliminarRegistro() {
  const id = document.getElementById("mapaId").value;
  const registro = clientesMapa.find(c => String(c.id) === String(id));
  if (!registro) return;
  const esClienteReal = esReal(registro);
  const mensaje = esClienteReal
    ? `¿Eliminar a "${registro.nombre}" del mapa?\n\nEl cliente seguirá existiendo en Visitas.`
    : `¿Eliminar a "${registro.nombre}" del mapa?`;
  if (!confirm(mensaje)) return;
  if (esClienteReal) {
    registro.mapVisible = false;
    registro.updatedAt = new Date().toISOString();
  } else {
    clientesMapa = clientesMapa.filter(c => String(c.id) !== String(id));
  }
  guardarMapa();
  cerrarModal();
  renderMarcadores();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const id = document.getElementById("mapaId").value;
  const tipo = document.querySelector('input[name="tipoRegistro"]:checked')?.value || "real";
  const nombre = document.getElementById("mapaNombre").value.trim();
  const latitud = Number(document.getElementById("mapaLatitud").value);
  const longitud = Number(document.getElementById("mapaLongitud").value);

  if (!nombre) return alert("Escribe el nombre del cliente o prospecto.");
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return alert("La ubicación del pin no es válida.");

  const categoriaId = document.getElementById("mapaCategoria").value;
  const datos = {
    nombre,
    telefono: document.getElementById("mapaTelefono").value.trim(),
    direccion: document.getElementById("mapaDireccion").value.trim(),
    comentarios: document.getElementById("mapaComentarios").value.trim(),
    categoriaId,
    tipo,
    latitud,
    longitud,
    updatedAt: new Date().toISOString()
  };

  if (id) {
    const registro = clientesMapa.find(c => String(c.id) === String(id));
    if (!registro) return;
    const tipoAnterior = registro.tipo;
    Object.assign(registro, datos, { mapVisible: true });

    if (tipo === "real") {
      // Al volver a Cliente real, vuelve a quedar disponible en Visitas.
      crearClienteRealDesdeMapa(registro);
      sincronizarClienteReal(registro);
    } else {
      // Prospecto permanece en el mapa, pero deja de mostrarse en Visitas.
      marcarRouteClientComoProspecto(registro);
    }
  } else {
    const registro = { id: crearId(), createdAt: new Date().toISOString(), mapVisible: true, ...datos };
    if (tipo === "real") crearClienteRealDesdeMapa(registro);
    clientesMapa.push(registro);
  }

  guardarMapa();
  cerrarModal();
  renderMarcadores();
  actualizarEstado(`✓ ${tipo === "prospecto" ? "Prospecto" : "Cliente"} guardado.`);
});

function abrirModalExistente() {
  const modalExistente = document.getElementById("modalExistente");
  modalExistente.classList.add("visible");
  modalExistente.setAttribute("aria-hidden", "false");
  document.getElementById("buscarClienteExistente").value = "";
  renderClientesExistentes();
  setTimeout(() => document.getElementById("buscarClienteExistente").focus(), 50);
}

function cerrarModalExistente() {
  const modalExistente = document.getElementById("modalExistente");
  modalExistente.classList.remove("visible");
  modalExistente.setAttribute("aria-hidden", "true");
}

function renderClientesExistentes() {
  const lista = document.getElementById("listaClientesExistentes");
  const busqueda = normalizar(document.getElementById("buscarClienteExistente").value);
  const routeClients = cargarJSON(ROUTE_KEY, []).filter(c => c.tipo !== "prospecto");
  const colocados = new Set(
    clientesMapa.filter(c => c.mapVisible !== false && c.routeClientId).map(c => String(c.routeClientId))
  );

  const disponibles = routeClients.filter(c => {
    if (colocados.has(String(c.id))) return false;
    const texto = normalizar(`${c.nombre || ""} ${c.telefono || ""} ${c.direccion || ""}`);
    return !busqueda || texto.includes(busqueda);
  });

  if (!disponibles.length) {
    lista.innerHTML = `<p class="sin-resultados">No hay clientes de Visitas disponibles para agregar.</p>`;
    return;
  }

  lista.innerHTML = disponibles.map(c => `
    <button type="button" class="cliente-existente-item" data-cliente-existente="${escapeHtml(c.id)}">
      <strong>${escapeHtml(c.nombre || "Sin nombre")}</strong>
      ${c.telefono ? `<span>📞 ${escapeHtml(c.telefono)}</span>` : ""}
      ${c.direccion ? `<span>📍 ${escapeHtml(c.direccion)}</span>` : ""}
    </button>
  `).join("");

  lista.querySelectorAll("[data-cliente-existente]").forEach(btn => {
    btn.addEventListener("click", () => agregarClienteExistente(btn.dataset.clienteExistente));
  });
}

function agregarClienteExistente(clienteId) {
  const routeClients = cargarJSON(ROUTE_KEY, []);
  const cliente = routeClients.find(c => String(c.id) === String(clienteId));
  if (!cliente) return;

  let registro = clientesMapa.find(c => String(c.routeClientId) === String(cliente.id));
  const lat = Number(cliente.latitud);
  const lon = Number(cliente.longitud);
  const centro = mapa.getCenter();

  if (!registro) {
    registro = {
      id: crearId(),
      routeClientId: cliente.id,
      nombre: cliente.nombre || "Cliente",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      comentarios: cliente.notas || "",
      categoriaId: categorias.some(c => c.id === "cliente") ? "cliente" : categorias[0]?.id,
      tipo: "real",
      mapVisible: true,
      latitud: Number.isFinite(lat) ? lat : centro.lat,
      longitud: Number.isFinite(lon) ? lon : centro.lng,
      createdAt: cliente.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clientesMapa.push(registro);
  } else {
    registro.mapVisible = true;
    registro.tipo = "real";
  }

  guardarMapa();
  cerrarModalExistente();
  renderMarcadores();
  mapa.setView([Number(registro.latitud), Number(registro.longitud)], Math.max(mapa.getZoom(), 16));
  actualizarEstado(`✓ ${registro.nombre} agregado al mapa.`);
}

document.getElementById("btnEliminarRegistro").addEventListener("click", eliminarRegistro);
document.getElementById("btnCerrarModal").addEventListener("click", cerrarModal);
document.getElementById("btnAgregarExistente").addEventListener("click", abrirModalExistente);
document.getElementById("btnCerrarExistente").addEventListener("click", cerrarModalExistente);
document.getElementById("btnCancelarExistente").addEventListener("click", cerrarModalExistente);
document.getElementById("buscarClienteExistente").addEventListener("input", renderClientesExistentes);
document.getElementById("btnCancelarModal").addEventListener("click", cerrarModal);
modal.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    cerrarModal();
    cerrarModalExistente();
  }
});

document.getElementById("btnNuevoCliente").addEventListener("click", () => {
  const centro = mapa.getCenter();
  abrirModal({ lat: centro.lat, lon: centro.lng });
});
document.getElementById("btnCerrarPanel").addEventListener("click", () => panel.classList.add("oculto"));
document.getElementById("btnAbrirPanel").addEventListener("click", () => panel.classList.remove("oculto"));
document.getElementById("buscarMapa").addEventListener("input", renderMarcadores);
document.getElementById("btnTodasCategorias").addEventListener("click", () => {
  categoriasSeleccionadas = new Set(categorias.map(c => c.id));
  renderCategorias();
  renderMarcadores();
});
document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
  document.getElementById("buscarMapa").value = "";
  categoriasSeleccionadas = new Set(categorias.map(c => c.id));
  renderCategorias();
  renderMarcadores();
});

function mostrarMiUbicacion(centrar = false) {
  if (!navigator.geolocation) {
    actualizarEstado("Este dispositivo/navegador no permite obtener la ubicación.");
    return;
  }
  const boton = document.getElementById("btnMiUbicacion");
  boton.disabled = true;
  boton.textContent = "📍 Obteniendo...";
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      if (marcadorMiUbicacion) marcadorMiUbicacion.remove();
      marcadorMiUbicacion = L.circleMarker([lat, lon], {
        radius: 9,
        color: "#fff",
        weight: 3,
        fillColor: "#4285f4",
        fillOpacity: 1,
        interactive: false
      }).addTo(mapa);
      if (centrar) mapa.setView([lat, lon], Math.max(mapa.getZoom(), 16));
      boton.disabled = false;
      boton.textContent = "📍 Mi ubicación";
      actualizarEstado("🔵 Ubicación actualizada.");
    },
    () => {
      boton.disabled = false;
      boton.textContent = "📍 Mi ubicación";
      actualizarEstado("No fue posible obtener la ubicación.");
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

document.getElementById("btnMiUbicacion").addEventListener("click", () => mostrarMiUbicacion(true));
document.getElementById("btnNuevaCategoria").addEventListener("click", crearCategoria);

mapa.on("click", e => {
  abrirModal({ lat: e.latlng.lat, lon: e.latlng.lng });
});

document.addEventListener("click", event => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;
  const registro = clientesMapa.find(c => String(c.id) === String(boton.dataset.id));
  if (!registro) return;
  const marker = marcadores.get(String(registro.id));
  if (boton.dataset.accion === "editar") {
    if (marker) marker.closePopup();
    abrirModal({ registro });
  }
  if (boton.dataset.accion === "google") abrirGoogleMaps(registro);
});

sincronizarClientesVisitasEnMapa();
renderCategorias();
renderMarcadores();
mostrarMiUbicacion(false);

if (clientesMapa.length) {
  const puntos = clientesMapa
    .filter(c => Number.isFinite(Number(c.latitud)) && Number.isFinite(Number(c.longitud)))
    .map(c => [Number(c.latitud), Number(c.longitud)]);
  if (puntos.length) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 15 });
}
