import { renderPhotoPicker, movePhotos, getPhotos } from "../../core/media/fotos.js";

/*
 * Productos Santa Rosa
 * Módulo: Mapa
 * Versión: 1.1.1
 * Build: 20260926.1135
 * Objetivo: Separar tiendas de clientes/prospectos y mantener el mapa como módulo propio.
 */
const MAP_KEY = "psr_map_clients";
const ROUTE_KEY = "psr_route_clients";
const CATEGORIES_KEY = "psr_map_categories";
const TRAZOS_KEY = "psr_map_trazos";
const MAP_LONG_PRESS_MS = 500;

const DEFAULT_CATEGORIES = [
  { id: "cliente", nombre: "Cliente", color: "#16803c" },
  { id: "prospecto", nombre: "Prospecto", color: "#d97706" },
  { id: "tienda", nombre: "Tienda", color: "#2563eb" },
  { id: "restaurante", nombre: "Restaurante", color: "#9333ea" },
  { id: "otro", nombre: "Otro", color: "#64748b" }
];

const mapa = L.map("mapa", {
  zoomControl: true,
  touchZoom: true,
  zoomAnimation: false,
  // En móvil el pinch debe poder cambiar el zoom de forma continua.
  // Con 0.25 el gesto se siente a saltos y obliga a repetir el pellizco.
  zoomSnap: 0,
  zoomDelta: 1,
  bounceAtZoomLimits: false
}).setView([19.0414, -98.2063], 12);
mapa.createPane("trazosPane");
mapa.getPane("trazosPane").style.zIndex = 350;
const capaTrazos = L.layerGroup().addTo(mapa);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxNativeZoom: 19,
  maxZoom: 22,
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
let trazosMapa = cargarJSON(TRAZOS_KEY, []);
let trazando = false;
let puntosTrazoActual = [];
let lineaTrazoActual = null;
let puntosTrazoMarcadores = [];
let inicioToqueMapa = 0;
let ultimoToqueMapaLargo = false;
let huboToqueMapa = false;
let mapaLongPressTimer = null;
let mapaToqueInicio = null;
let mapaLongPressCancelado = false;
let multiToqueActivo = false;
let cancelarGestorPinActivo = null;

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

function guardarTrazos() {
  localStorage.setItem(TRAZOS_KEY, JSON.stringify(trazosMapa));
}

function crearIdTrazo() {
  return `trazo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function limpiarVistaTrazoActual() {
  if (lineaTrazoActual) {
    lineaTrazoActual.remove();
    lineaTrazoActual = null;
  }
  puntosTrazoMarcadores.forEach(m => m.remove());
  puntosTrazoMarcadores = [];
}

function dibujarTrazo(trazo) {
  const puntos = (trazo.puntos || [])
    .map(p => [Number(p.lat), Number(p.lng)])
    .filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (puntos.length < 2) return;

  const halo = L.polyline(puntos, {
    pane: "trazosPane",
    color: "#ffffff",
    weight: 8,
    opacity: 0.55,
    lineCap: "round",
    lineJoin: "round",
    interactive: false
  });
  const linea = L.polyline(puntos, {
    pane: "trazosPane",
    color: "#16a34a",
    weight: 4,
    opacity: 0.52,
    dashArray: "12 8",
    lineCap: "round",
    lineJoin: "round",
    interactive: true
  });
  const grupo = L.layerGroup([halo, linea]).addTo(capaTrazos);
  linea.bindPopup(`
    <div class="popup-cliente popup-trazo">
      <div class="popup-titulo"><span class="popup-dot popup-trazo-dot"></span><b>📏 Trazo</b></div>
      <div class="popup-meta">${escapeHtml(formatearFechaTrazo(trazo.createdAt))} · ${puntos.length} puntos</div>
      <div class="popup-botones popup-botones-trazo">
        <button type="button" data-accion="eliminar-trazo" data-trazo-id="${escapeHtml(trazo.id)}">🗑️ Eliminar</button>
      </div>
    </div>
  `);
  trazo._layer = grupo;
}

function formatearFechaTrazo(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Fecha desconocida";
  return d.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

function renderTrazos() {
  capaTrazos.clearLayers();
  trazosMapa.forEach(dibujarTrazo);
}

function actualizarControlesTrazo() {
  const btn = document.getElementById("btnTrazar");
  const controles = document.getElementById("controlesTrazo");
  const texto = document.getElementById("estadoTrazo");
  if (!btn || !controles || !texto) return;
  btn.textContent = trazando ? "✏️ Trazando…" : "✏️ Trazar ruta";
  btn.classList.toggle("activo", trazando);
  controles.hidden = !trazando;
  texto.textContent = trazando
    ? `${puntosTrazoActual.length} ${puntosTrazoActual.length === 1 ? "punto" : "puntos"}. Toca el mapa para continuar.`
    : "Puedes dibujar rutas o calles sobre el mapa sin modificar sus objetos.";
}

function iniciarTrazo() {
  if (trazando) return;
  trazando = true;
  puntosTrazoActual = [];
  limpiarVistaTrazoActual();
  actualizarControlesTrazo();
  actualizarEstado("✏️ Trazo iniciado. Toca el mapa para marcar puntos.");
}

function actualizarTrazoActual() {
  limpiarVistaTrazoActual();
  if (puntosTrazoActual.length === 0) {
    actualizarControlesTrazo();
    return;
  }
  const latlngs = puntosTrazoActual.map(p => [p.lat, p.lng]);
  if (puntosTrazoActual.length >= 2) {
    const halo = L.polyline(latlngs, { pane: "trazosPane", color: "#ffffff", weight: 8, opacity: 0.55, lineCap: "round", lineJoin: "round", interactive: false });
    const linea = L.polyline(latlngs, { pane: "trazosPane", color: "#16a34a", weight: 4, opacity: 0.52, dashArray: "12 8", lineCap: "round", lineJoin: "round", interactive: false });
    lineaTrazoActual = L.layerGroup([halo, linea]).addTo(capaTrazos);
  }
  puntosTrazoActual.forEach((p, i) => {
    const punto = L.circleMarker([p.lat, p.lng], { pane: "trazosPane", radius: 4, color: "#15803d", weight: 2, fillColor: "#bbf7d0", fillOpacity: 0.95, interactive: false }).addTo(capaTrazos);
    puntosTrazoMarcadores.push(punto);
  });
  actualizarControlesTrazo();
}

function agregarPuntoTrazo(lat, lng) {
  if (!trazando) return;
  puntosTrazoActual.push({ lat: Number(lat), lng: Number(lng) });
  actualizarTrazoActual();
  actualizarEstado(`📍 Punto ${puntosTrazoActual.length} marcado.`);
}

function deshacerUltimoPuntoTrazo() {
  if (!trazando || !puntosTrazoActual.length) return;
  puntosTrazoActual.pop();
  actualizarTrazoActual();
  actualizarEstado(puntosTrazoActual.length ? `↶ Último punto eliminado. Quedan ${puntosTrazoActual.length}.` : "↶ Trazo vacío.");
}

function cancelarTrazo() {
  if (!trazando) return;
  trazando = false;
  puntosTrazoActual = [];
  limpiarVistaTrazoActual();
  actualizarControlesTrazo();
  actualizarEstado("Trazo cancelado.");
}

function finalizarTrazo() {
  if (!trazando) return;
  if (puntosTrazoActual.length < 2) {
    alert("Marca al menos 2 puntos para finalizar el trazo.");
    return;
  }
  const now = new Date().toISOString();
  const trazo = {
    id: crearIdTrazo(),
    puntos: puntosTrazoActual.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) })),
    createdAt: now,
    updatedAt: now
  };
  trazosMapa.push(trazo);
  guardarTrazos();
  trazando = false;
  puntosTrazoActual = [];
  limpiarVistaTrazoActual();
  renderTrazos();
  actualizarControlesTrazo();
  actualizarEstado(`✓ Trazo guardado con ${trazo.puntos.length} puntos.`);
}

function eliminarTrazo(id) {
  const trazo = trazosMapa.find(t => String(t.id) === String(id));
  if (!trazo) return;
  if (!window.confirm("¿Eliminar este trazo del mapa?")) return;
  trazosMapa = trazosMapa.filter(t => String(t.id) !== String(id));
  guardarTrazos();
  renderTrazos();
  actualizarEstado("🗑️ Trazo eliminado.");
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
  if (tipo === "tienda") return "🏪 Tienda";
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

function photoEntityForRegistro(registro) {
  return {
    entityType: registro?.tipo === "real" ? "cliente" : (registro?.tipo === "tienda" ? "empresa" : "mapa"),
    entityId: registro?.routeClientId || registro?.marketPlaceId || registro?.id || ""
  };
}

async function popupHtml(registro) {
  const photoRef = photoEntityForRegistro(registro);
  let tieneFotos = false;
  try {
    const fotos = await getPhotos(photoRef.entityType, photoRef.entityId);
    tieneFotos = fotos.length > 0;
  } catch (error) {
    console.warn("No fue posible consultar las fotografías del registro:", error);
  }
  const categoria = categoriaPorId(registro.categoriaId);
  const tipo = obtenerNombreTipo(registro.tipo);
  const comentario = registro.comentarios
    ? `<div class="popup-nota">💬 ${escapeHtml(registro.comentarios)}</div>`
    : "";

  return `
    <div class="popup-cliente">
      <div class="popup-titulo"><span class="popup-dot" style="--cat-color:${escapeHtml(categoria.color)}"></span><b>${escapeHtml(registro.nombre)}</b>${tieneFotos ? `<button type="button" class="popup-fotos-btn" data-accion="fotos" data-id="${escapeHtml(registro.id)}" aria-label="Ver fotografías" title="Ver fotografías">📷</button>` : ""}</div>
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

function cancelarLongPressMapa() {
  if (mapaLongPressTimer) {
    clearTimeout(mapaLongPressTimer);
    mapaLongPressTimer = null;
  }
}

function registrarInicioToqueMapa(event) {
  if (!event.touches || event.touches.length !== 1) return;
  if (multiToqueActivo) return;
  // Un toque que inicia sobre un pin también debe poder convertirse en
  // arrastre del mapa. Solo el toque corto del pin se resolverá como popup.
  const touch = event.touches[0];
  inicioToqueMapa = Date.now();
  mapaToqueInicio = { x: touch.clientX, y: touch.clientY, latlng: null };
  ultimoToqueMapaLargo = false;
  mapaLongPressCancelado = false;
  cancelarLongPressMapa();

  mapaLongPressTimer = setTimeout(() => {
    if (mapaLongPressCancelado || multiToqueActivo || !mapaToqueInicio || trazando) return;
    ultimoToqueMapaLargo = true;
    mapaLongPressTimer = null;
    const punto = mapa.mouseEventToLatLng({ clientX: mapaToqueInicio.x, clientY: mapaToqueInicio.y });
    mapaToqueInicio.latlng = punto;
    abrirModal({ lat: punto.lat, lon: punto.lng });
    try { navigator.vibrate?.(20); } catch (_) {}
  }, MAP_LONG_PRESS_MS);
}

function registrarMovimientoToqueMapa(event) {
  if (!mapaToqueInicio || !event.touches || event.touches.length !== 1) return;
  const touch = event.touches[0];
  const distancia = Math.hypot(touch.clientX - mapaToqueInicio.x, touch.clientY - mapaToqueInicio.y);
  if (distancia > 10) {
    mapaLongPressCancelado = true;
    cancelarLongPressMapa();
    mapaToqueInicio = null;
    inicioToqueMapa = 0;
    ultimoToqueMapaLargo = false;
  }
}

function registrarFinToqueMapa(event) {
  cancelarLongPressMapa();
  if (!inicioToqueMapa) return;
  const duracion = Date.now() - inicioToqueMapa;
  if (duracion >= MAP_LONG_PRESS_MS) ultimoToqueMapaLargo = true;
  inicioToqueMapa = 0;
  mapaToqueInicio = null;
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

    // En móvil el movimiento del pin se controla de forma explícita.
    // Así un toque corto sigue abriendo la información y nunca se confunde
    // con la pulsación larga del mapa para crear una empresa.
    const elementoPin = marker.getElement();
    const esDispositivoTactil = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (elementoPin && esDispositivoTactil) {
          // No bloquear la propagación táctil del pin: el mapa debe poder
      // iniciar pan/zoom aunque el primer dedo caiga sobre un pin.
      // El gesto corto del pin se resuelve como popup; el arrastre largo
      // se controla abajo.
      marker.dragging.disable();

      let pinTimer = null;
      let pinInicio = null;
      let pinMoviendo = false;
      let pinCancelado = false;
      let pinAnterior = null;

      const cancelarPin = () => {
        if (pinTimer) { clearTimeout(pinTimer); pinTimer = null; }
      };

      const cancelarGestorPin = () => {
        cancelarPin();
        pinCancelado = true;
        pinInicio = null;
        pinMoviendo = false;
      };

      elementoPin.addEventListener("touchstart", event => {
        if (!event.touches || event.touches.length !== 1 || multiToqueActivo) return;
        pinInicio = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
        pinMoviendo = false;
        pinCancelado = false;
        pinAnterior = marker.getLatLng();
        cancelarPin();
        cancelarLongPressMapa();
        mapaLongPressCancelado = true;
        cancelarGestorPinActivo = cancelarGestorPin;
        pinTimer = setTimeout(() => {
          if (pinCancelado || multiToqueActivo) return;
          pinMoviendo = true;
          mapa.dragging.disable();
          actualizarEstado(`📍 Moviendo el pin de ${registro.nombre}…`);
          try { navigator.vibrate?.(30); } catch (_) {}
        }, MAP_LONG_PRESS_MS);
      }, { passive: true });

      elementoPin.addEventListener("touchmove", event => {
        if (!event.touches || event.touches.length !== 1 || !pinInicio || multiToqueActivo) return;
        const touch = event.touches[0];
        const dx = touch.clientX - pinInicio.x;
        const dy = touch.clientY - pinInicio.y;
        const distancia = Math.hypot(dx, dy);

        if (!pinMoviendo && distancia > 10) {
          pinCancelado = true;
          cancelarPin();
          pinInicio = null;
          return;
        }

        if (!pinMoviendo) return;
        event.preventDefault();
        const punto = mapa.mouseEventToLatLng({ clientX: touch.clientX, clientY: touch.clientY });
        marker.setLatLng(punto);
      }, { passive: false });

      elementoPin.addEventListener("touchend", event => {
        if (multiToqueActivo) {
          cancelarGestorPin();
          if (cancelarGestorPinActivo === cancelarGestorPin) cancelarGestorPinActivo = null;
          return;
        }
        const fueMovimiento = pinMoviendo;
        cancelarPin();
        pinInicio = null;
        if (cancelarGestorPinActivo === cancelarGestorPin) cancelarGestorPinActivo = null;

        if (!fueMovimiento) {
          pinCancelado = false;
          // Toque corto: Leaflet generará el click y abrirá el popup.
          // No lo abrimos manualmente para no interferir con pan/zoom.
          return;
        }

        mapa.dragging.enable();
        pinMoviendo = false;
        const nueva = marker.getLatLng();
        const nuevaLat = Number(nueva.lat);
        const nuevaLng = Number(nueva.lng);
        const mensaje =
          `¿Quieres actualizar el pin de "${registro.nombre}" a esta nueva ubicación?\n\n` +
          `Si eliges "Aceptar", se guardará la nueva ubicación.\n` +
          `Si eliges "Cancelar", el pin regresará a su ubicación anterior.`;

        if (!window.confirm(mensaje)) {
          marker.setLatLng(pinAnterior);
          actualizarEstado(`↩️ El pin de ${registro.nombre} regresó a su ubicación anterior.`);
          return;
        }

        registro.latitud = nuevaLat;
        registro.longitud = nuevaLng;
        registro.updatedAt = new Date().toISOString();
        guardarMapa();
        if (registro.tipo === 'tienda' && registro.marketPlaceId) {
          try {
            const market = JSON.parse(localStorage.getItem('psr_market_clients')) || [];
            const tienda = market.find(p => String(p.id) === String(registro.marketPlaceId));
            if (tienda) {
              tienda.latitud = nuevaLat;
              tienda.longitud = nuevaLng;
              tienda.updatedAt = new Date().toISOString();
              localStorage.setItem('psr_market_clients', JSON.stringify(market));
            }
          } catch (_) {}
        }
        if (esReal(registro)) sincronizarClienteReal(registro);
        actualizarEstado(`✓ Ubicación de ${registro.nombre} actualizada.`);
        marker.bindPopup("<div class=\"popup-cargando-fotos\">Cargando…</div>");
        marker.once("popupopen", async () => {
          marker.setPopupContent(await popupHtml(registro));
        });
      }, { passive: true });

      elementoPin.addEventListener("touchcancel", () => {
        cancelarPin();
        pinInicio = null;
        pinMoviendo = false;
        pinCancelado = true;
        mapa.dragging.enable();
      }, { passive: true });
    }

    marker.on("dragstart", () => {
      const inicio = Number(marker._psrTouchStartedAt || 0);
      const esToque = inicio > 0;
      const duracion = esToque ? Date.now() - inicio : MAP_LONG_PRESS_MS;
      if (esToque && duracion < MAP_LONG_PRESS_MS) {
        marker.dragging.disable();
        marker._psrArrastreRechazado = true;
        actualizarEstado(`⏱️ Mantén presionado el pin al menos ${MAP_LONG_PRESS_MS / 1000} s para moverlo.`);
        return;
      }
      marker._psrArrastreRechazado = false;
    });

    marker.bindPopup("<div class=\"popup-cargando-fotos\">Cargando…</div>");
    marker.once("popupopen", async () => {
      marker.setPopupContent(await popupHtml(registro));
    });

    // La nueva ubicación no se guarda hasta que el usuario la confirme.
    let ubicacionAnterior = {
      lat: Number(registro.latitud),
      lng: Number(registro.longitud)
    };

    marker.on("dragstart", () => {
      const actual = marker.getLatLng();
      ubicacionAnterior = { lat: Number(actual.lat), lng: Number(actual.lng) };
      actualizarEstado(`📍 Moviendo el pin de ${registro.nombre}…`);
    });

    marker.on("dragend", () => {
      if (marker._psrArrastreRechazado) {
        marker.setLatLng([ubicacionAnterior.lat, ubicacionAnterior.lng]);
        marker._psrArrastreRechazado = false;
        return;
      }
      marker._psrTouchStartedAt = 0;
      const nueva = marker.getLatLng();
      const nuevaLat = Number(nueva.lat);
      const nuevaLng = Number(nueva.lng);
      const mensaje =
        `¿Quieres actualizar el pin de "${registro.nombre}" a esta nueva ubicación?\n\n` +
        `Si eliges "Aceptar", se guardará la nueva ubicación.\n` +
        `Si eliges "Cancelar", el pin regresará a su ubicación anterior.`;

      const confirmar = window.confirm(mensaje);

      if (!confirmar) {
        marker.setLatLng([ubicacionAnterior.lat, ubicacionAnterior.lng], { animate: true });
        actualizarEstado(`↩️ El pin de ${registro.nombre} regresó a su ubicación anterior.`);
        return;
      }

      registro.latitud = nuevaLat;
      registro.longitud = nuevaLng;
      registro.updatedAt = new Date().toISOString();
      guardarMapa();
      if (registro.tipo === 'tienda' && registro.marketPlaceId) {
        try {
          const market = JSON.parse(localStorage.getItem('psr_market_clients')) || [];
          const tienda = market.find(p => String(p.id) === String(registro.marketPlaceId));
          if (tienda) { tienda.latitud = nuevaLat; tienda.longitud = nuevaLng; tienda.updatedAt = new Date().toISOString(); localStorage.setItem('psr_market_clients', JSON.stringify(market)); }
        } catch (_) {}
      }
      if (esReal(registro)) sincronizarClienteReal(registro);
      actualizarEstado(`✓ Ubicación de ${registro.nombre} actualizada.`);
      marker.bindPopup("<div class=\"popup-cargando-fotos\">Cargando…</div>");
    marker.once("popupopen", async () => {
      marker.setPopupContent(await popupHtml(registro));
    });
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
  const draftId = registro?.id || crearId();
  modal.dataset.photoEntityId = registro?.routeClientId || registro?.marketPlaceId || draftId;
  modal.dataset.photoEntityType = registro?.tipo === "real" ? "cliente" : (registro?.tipo === "tienda" ? "empresa" : "mapa");
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
  document.getElementById("subtituloModalMapa").textContent = nuevo ? "Cliente, prospecto o tienda" : obtenerNombreTipo(registro.tipo);
  const tipoActual = registro?.tipo || "real";
  document.querySelectorAll('input[name="tipoRegistro"]').forEach(input => { input.checked = input.value === tipoActual; input.disabled = !!registro && tipoActual === "tienda"; });
  document.getElementById("mapaCategoria").disabled = !!registro && tipoActual === "tienda";
  document.getElementById("btnEliminarRegistro").hidden = nuevo;
  document.getElementById("coordenadasTexto").textContent = `${Number(registro?.latitud ?? lat).toFixed(7)}, ${Number(registro?.longitud ?? lon).toFixed(7)}`;
  modal.classList.add("visible");
  modal.setAttribute("aria-hidden", "false");
  renderPhotoPicker({ container: document.getElementById("mapaFotos"), entityType: modal.dataset.photoEntityType, entityId: modal.dataset.photoEntityId, label: "Fotografías" });
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

  const categoriaId = tipo === "tienda" ? "tienda" : document.getElementById("mapaCategoria").value;
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

    if (tipoAnterior === "real" && tipo === "prospecto") {
      const confirmarCambio = confirm(
        `¿Cambiar a "${nombre}" de 👤 Cliente real a 🎯 Prospecto?\n\n` +
        `Este cambio hará que deje de aparecer en Visitas.\n` +
        `El registro permanecerá en el mapa como prospecto.`
      );

      if (!confirmarCambio) {
        return;
      }
    }

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
    const draftPhotoId = modal.dataset.photoEntityId || crearId();
    const registro = { id: draftPhotoId, createdAt: new Date().toISOString(), mapVisible: true, ...datos };
    if (tipo === "real") crearClienteRealDesdeMapa(registro);
    clientesMapa.push(registro);
    if (tipo === "real" && registro.routeClientId) movePhotos("cliente", id, registro.routeClientId).catch(() => {});
    if (tipo === "tienda" && registro.marketPlaceId) movePhotos("empresa", id, registro.marketPlaceId).catch(() => {});
  }

  guardarMapa();
  cerrarModal();
  renderMarcadores();
  actualizarEstado(`✓ ${tipo === "tienda" ? "Tienda" : (tipo === "prospecto" ? "Prospecto" : "Cliente")} guardado.`);
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
    cerrarGaleriaFotosMapa();
    document.getElementById("fotoGrandeMapaWrap")?.classList.remove("visible");
  }
});

document.getElementById("btnNuevoCliente").addEventListener("click", () => {
  const centro = mapa.getCenter();
  abrirModal({ lat: centro.lat, lon: centro.lng });
});
document.getElementById("btnCerrarPanel").addEventListener("click", () => panel.classList.add("oculto"));
document.getElementById("btnAbrirPanel").addEventListener("click", () => panel.classList.remove("oculto"));
document.getElementById("buscarMapa").addEventListener("input", renderMarcadores);
document.getElementById("btnQuitarFiltros").addEventListener("click", () => {
  categoriasSeleccionadas = new Set();
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

document.getElementById("btnMiUbicacion")?.addEventListener("click", () => mostrarMiUbicacion(true));
document.getElementById("btnUbicacionPermanente").addEventListener("click", () => mostrarMiUbicacion(true));
document.getElementById("btnNuevaCategoria").addEventListener("click", crearCategoria);
document.getElementById("btnTrazar")?.addEventListener("click", () => trazando ? cancelarTrazo() : iniciarTrazo());
const btnFinalizarTrazo = document.getElementById("btnFinalizarTrazo");
let finalizarTrazoPorToque = false;

btnFinalizarTrazo?.addEventListener("pointerdown", event => {
  event.stopPropagation();
  if (event.pointerType === "touch") {
    event.preventDefault();
    finalizarTrazoPorToque = true;
    finalizarTrazo();
  }
}, { passive: false });

btnFinalizarTrazo?.addEventListener("touchstart", event => {
  event.preventDefault();
  event.stopPropagation();
}, { passive: false });

btnFinalizarTrazo?.addEventListener("touchend", event => {
  event.preventDefault();
  event.stopPropagation();
  if (!finalizarTrazoPorToque) finalizarTrazo();
  finalizarTrazoPorToque = false;
}, { passive: false });

btnFinalizarTrazo?.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  if (finalizarTrazoPorToque) {
    finalizarTrazoPorToque = false;
    return;
  }
  finalizarTrazo();
});
document.getElementById("btnDeshacerTrazo")?.addEventListener("click", deshacerUltimoPuntoTrazo);
document.getElementById("btnCancelarTrazo")?.addEventListener("click", cancelarTrazo);

const mapaDom = mapa.getContainer();

function esControlInteractivoMapa(target) {
  return Boolean(target?.closest?.("button, input, select, textarea, a, label, .mapa-panel"));
}

mapaDom.addEventListener("touchstart", event => {
  if (esControlInteractivoMapa(event.target)) return;
  // Dos dedos: cancelar absolutamente todos los long-press/gestos de pin.
  if (event.touches && event.touches.length >= 2) {
    multiToqueActivo = true;
    cancelarLongPressMapa();
    cancelarGestorPinActivo?.();
    cancelarGestorPinActivo = null;
    mapaToqueInicio = null;
    inicioToqueMapa = 0;
    ultimoToqueMapaLargo = false;
    mapaLongPressCancelado = true;
    huboToqueMapa = false;
    return;
  }
  if (multiToqueActivo) return;
  huboToqueMapa = true;
  registrarInicioToqueMapa(event);
}, { passive: true, capture: true });

mapaDom.addEventListener("touchmove", event => {
  if (event.touches && event.touches.length >= 2) {
    multiToqueActivo = true;
    cancelarLongPressMapa();
    cancelarGestorPinActivo?.();
    cancelarGestorPinActivo = null;
    mapaToqueInicio = null;
    inicioToqueMapa = 0;
    ultimoToqueMapaLargo = false;
    mapaLongPressCancelado = true;
    return;
  }
  if (multiToqueActivo) return;
  registrarMovimientoToqueMapa(event);
}, { passive: true, capture: true });

mapaDom.addEventListener("touchend", event => {
  if (multiToqueActivo) {
    if (!event.touches || event.touches.length === 0) {
      multiToqueActivo = false;
      mapaLongPressCancelado = false;
      huboToqueMapa = false;
    }
    return;
  }
  registrarFinToqueMapa(event);
}, { passive: true, capture: true });

mapaDom.addEventListener("touchcancel", () => {
  cancelarLongPressMapa();
  cancelarGestorPinActivo?.();
  cancelarGestorPinActivo = null;
  inicioToqueMapa = 0;
  mapaToqueInicio = null;
  ultimoToqueMapaLargo = false;
  huboToqueMapa = false;
  mapaLongPressCancelado = true;
}, { passive: true, capture: true });

mapa.on("click", e => {
  const target = e.originalEvent?.target;
  if (target?.closest?.(".leaflet-marker-icon, button, input, select, textarea, a, label, .mapa-panel")) {
    huboToqueMapa = false;
    ultimoToqueMapaLargo = false;
    return;
  }
  if (trazando) {
    agregarPuntoTrazo(e.latlng.lat, e.latlng.lng);
    return;
  }

  // En móvil la creación ya fue resuelta directamente por la pulsación larga.
  // El click posterior de Leaflet no debe volver a abrir el formulario.
  const esToque = huboToqueMapa || Boolean(e.originalEvent?.type && /touch|pointer/.test(e.originalEvent.type));
  if (esToque) {
    huboToqueMapa = false;
    ultimoToqueMapaLargo = false;
    return;
  }

  abrirModal({ lat: e.latlng.lat, lon: e.latlng.lng });
});

async function abrirGaleriaFotosMapa(registro) {
  const ref = photoEntityForRegistro(registro);
  try {
    const fotos = await getPhotos(ref.entityType, ref.entityId);
    if (!fotos.length) return;
    const modalFotos = document.getElementById("modalFotosMapa");
    const grid = document.getElementById("galeriaFotosMapa");
    const grande = document.getElementById("fotoGrandeMapa");
    const titulo = document.getElementById("tituloFotosMapa");
    titulo.textContent = `📷 ${registro.nombre}`;
    grid.innerHTML = "";
    const urls = fotos.map(foto => ({ foto, url: URL.createObjectURL(foto.blob) }));
    urls.forEach(({ foto, url }, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mapa-foto-miniatura";
      btn.innerHTML = `<img src="${url}" alt="Fotografía ${index + 1}"><span>${Math.round(foto.size / 1024)} KB</span>`;
      btn.addEventListener("click", () => {
        grande.src = url;
        grande.alt = `Fotografía ${index + 1} de ${registro.nombre}`;
        document.getElementById("fotoGrandeMapaWrap").classList.add("visible");
      });
      grid.appendChild(btn);
    });
    modalFotos.classList.add("visible");
    modalFotos.setAttribute("aria-hidden", "false");
    modalFotos._photoUrls = urls.map(item => item.url);
  } catch (error) {
    console.error(error);
    alert("No fue posible cargar las fotografías.");
  }
}

function cerrarGaleriaFotosMapa() {
  const modalFotos = document.getElementById("modalFotosMapa");
  const grandeWrap = document.getElementById("fotoGrandeMapaWrap");
  grandeWrap.classList.remove("visible");
  modalFotos.classList.remove("visible");
  modalFotos.setAttribute("aria-hidden", "true");
  (modalFotos._photoUrls || []).forEach(url => URL.revokeObjectURL(url));
  modalFotos._photoUrls = [];
  document.getElementById("galeriaFotosMapa").innerHTML = "";
  document.getElementById("fotoGrandeMapa").removeAttribute("src");
}

document.addEventListener("click", async event => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;
  const registro = clientesMapa.find(c => String(c.id) === String(boton.dataset.id));
  if (!registro) return;
  const marker = marcadores.get(String(registro.id));
  if (boton.dataset.accion === "fotos") {
    if (marker) marker.closePopup();
    await abrirGaleriaFotosMapa(registro);
    return;
  }
  if (boton.dataset.accion === "editar") {
    if (marker) marker.closePopup();
    abrirModal({ registro });
  }
  if (boton.dataset.accion === "google") abrirGoogleMaps(registro);
  if (boton.dataset.accion === "eliminar-trazo") {
    if (boton.closest(".leaflet-popup")) mapa.closePopup();
    eliminarTrazo(boton.dataset.trazoId);
  }
});

document.getElementById("btnCerrarFotosMapa")?.addEventListener("click", cerrarGaleriaFotosMapa);
document.getElementById("btnCerrarFotoGrandeMapa")?.addEventListener("click", () => document.getElementById("fotoGrandeMapaWrap").classList.remove("visible"));
document.getElementById("modalFotosMapa")?.addEventListener("click", event => {
  if (event.target.id === "modalFotosMapa") cerrarGaleriaFotosMapa();
});
document.getElementById("fotoGrandeMapaWrap")?.addEventListener("click", event => {
  if (event.target.id === "fotoGrandeMapaWrap") event.currentTarget.classList.remove("visible");
});

sincronizarClientesVisitasEnMapa();
renderCategorias();
renderMarcadores();
renderTrazos();
actualizarControlesTrazo();
mostrarMiUbicacion(false);

if (clientesMapa.length) {
  const puntos = clientesMapa
    .filter(c => Number.isFinite(Number(c.latitud)) && Number.isFinite(Number(c.longitud)))
    .map(c => [Number(c.latitud), Number(c.longitud)]);
  if (puntos.length) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 15 });
}

// Mercado: sincroniza las empresas geolocalizadas como categoría Tienda, sin mezclarlas con clientes/prospectos.
function sincronizarEmpresasMercadoEnMapa() {
  let market = [];
  try { market = JSON.parse(localStorage.getItem('psr_market_clients')) || []; } catch (_) { market = []; }
  let changed = false;
  market.filter(p => p && p.estatus !== 'inactivo' && Number.isFinite(Number(p.latitud)) && Number.isFinite(Number(p.longitud))).forEach(p => {
    let registro = clientesMapa.find(c => c.marketPlaceId && String(c.marketPlaceId) === String(p.id));
    if (!registro) {
      registro = clientesMapa.find(c => c.tipo === 'tienda' && normalizar(c.nombre) === normalizar(p.nombre));
    }
    if (!registro) {
      clientesMapa.push(registro = { id: crearId(), marketPlaceId: p.id, nombre: p.nombre, telefono: p.contacto || p.telefono || '', direccion: p.direccion || '', comentarios: p.comentarios || '', categoriaId: 'tienda', tipo: 'tienda', latitud: Number(p.latitud), longitud: Number(p.longitud), mapVisible: true, createdAt: p.createdAt || new Date().toISOString(), updatedAt: p.updatedAt || new Date().toISOString() });
      changed = true;
    } else {
      if (registro.marketPlaceId !== p.id) { registro.marketPlaceId = p.id; changed = true; }
      if (registro.categoriaId !== 'tienda') { registro.categoriaId = 'tienda'; changed = true; }
      if (registro.tipo !== 'tienda') { registro.tipo = 'tienda'; changed = true; }
      if (Number(registro.latitud) !== Number(p.latitud) || Number(registro.longitud) !== Number(p.longitud)) { registro.latitud = Number(p.latitud); registro.longitud = Number(p.longitud); changed = true; }
      if (registro.nombre !== p.nombre) { registro.nombre = p.nombre; changed = true; }
    }
  });
  if (changed) guardarMapa();
}

// Se ejecuta una vez al cargar para que las tiendas geolocalizadas de Mercado aparezcan en el mapa.
sincronizarEmpresasMercadoEnMapa();
renderMarcadores();
