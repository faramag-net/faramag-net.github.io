const mapa = L.map("mapa", { zoomControl: true }).setView([19.0414, -98.2063], 12);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapa);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const estado = document.getElementById("estadoUbicacion");
const latInput = document.getElementById("latitudMapa");
const lonInput = document.getElementById("longitudMapa");
let marcadorManual = null;

function actualizarCoordenadas(lat, lon) {
  latInput.value = Number(lat).toFixed(7);
  lonInput.value = Number(lon).toFixed(7);
}

function colocarMarcador(lat, lon, zoom = 16) {
  if (!marcadorManual) {
    marcadorManual = L.marker([lat, lon], { draggable: true }).addTo(mapa);
    marcadorManual.bindPopup("Arrastra este marcador o toca el mapa para cambiar la ubicación.");
    marcadorManual.on("dragend", () => {
      const p = marcadorManual.getLatLng();
      actualizarCoordenadas(p.lat, p.lng);
      estado.textContent = "Ubicación ajustada manualmente.";
    });
  } else {
    marcadorManual.setLatLng([lat, lon]);
  }
  actualizarCoordenadas(lat, lon);
  mapa.setView([lat, lon], Math.max(mapa.getZoom(), zoom));
}

mapa.on("click", (e) => {
  colocarMarcador(e.latlng.lat, e.latlng.lng);
  estado.textContent = "Ubicación seleccionada en el mapa.";
});

document.getElementById("btnIrCoordenadas")?.addEventListener("click", () => {
  const lat = Number(latInput.value);
  const lon = Number(lonInput.value);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    alert("Escribe una latitud (-90 a 90) y longitud (-180 a 180) válidas.");
    return;
  }
  colocarMarcador(lat, lon);
  estado.textContent = "Ubicación colocada mediante coordenadas.";
});

document.getElementById("btnMiUbicacion")?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Este dispositivo/navegador no permite obtener la ubicación.");
    return;
  }
  const boton = document.getElementById("btnMiUbicacion");
  boton.disabled = true;
  boton.textContent = "📍 Obteniendo...";
  estado.textContent = "Solicitando la ubicación real del dispositivo...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      colocarMarcador(latitude, longitude, 17);
      estado.textContent = `Ubicación del dispositivo. Precisión aproximada: ${Math.round(accuracy || 0)} m.`;
      boton.disabled = false;
      boton.textContent = "📍 Mi ubicación";
    },
    (error) => {
      boton.disabled = false;
      boton.textContent = "📍 Mi ubicación";
      if (error.code === 1) estado.textContent = "Permiso de ubicación bloqueado para este sitio.";
      else if (error.code === 2) estado.textContent = "El dispositivo no pudo determinar la ubicación.";
      else estado.textContent = "La ubicación tardó demasiado. Intenta nuevamente.";
      alert(estado.textContent);
    },
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
  );
});

const clientes = JSON.parse(localStorage.getItem("psr_route_clients")) || [];
const puntos = [];
clientes.forEach(cliente => {
  if (!Number.isFinite(Number(cliente.latitud)) || !Number.isFinite(Number(cliente.longitud))) return;
  const punto = [Number(cliente.latitud), Number(cliente.longitud)];
  puntos.push(punto);
  L.marker(punto).addTo(mapa).bindPopup(`<b>${escapeHtml(cliente.nombre)}</b><br>📞 ${escapeHtml(cliente.telefono || "-")}<br>📍 ${escapeHtml(cliente.direccion || "-")}`);
});
if (puntos.length) mapa.fitBounds(puntos, { padding: [30, 30] });

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
