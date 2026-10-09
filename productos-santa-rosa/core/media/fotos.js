/*
 * Productos Santa Rosa
 * Módulo: Fotografías compartidas
 * Versión: 1.0.0
 * Objetivo: fotografías para Mapa, Visitas, Mercado y Compras, máximo 80 KB.
 */

const DB_NAME = "psr_media_v1";
const STORE = "photos";
const MAX_BYTES = 80 * 1024;

const uid = () => crypto.randomUUID();

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("entity", ["entityType", "entityId"], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function imageBlob(file, width, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, width / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("No se pudo comprimir la fotografía.")), "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la fotografía.")); };
    img.src = url;
  });
}

async function compressTo80KB(file) {
  let width = Math.min(1280, file?.width || 1280);
  let quality = 0.82;
  let blob = await imageBlob(file, width, quality);

  for (let i = 0; i < 10 && blob.size > MAX_BYTES; i++) {
    if (quality > 0.42) quality -= 0.07;
    else width = Math.max(320, Math.round(width * 0.82));
    blob = await imageBlob(file, width, quality);
  }

  if (blob.size > MAX_BYTES) {
    for (let widthTry = Math.min(width, 640); widthTry >= 240 && blob.size > MAX_BYTES; widthTry = Math.round(widthTry * 0.85)) {
      blob = await imageBlob(file, widthTry, 0.42);
    }
  }

  if (blob.size > MAX_BYTES) throw new Error("La fotografía no pudo comprimirse por debajo de 80 KB.");
  return blob;
}

export async function savePhoto(file, entityType, entityId, label = "Fotografía") {
  if (!file) throw new Error("No se seleccionó ninguna fotografía.");
  const blob = await compressTo80KB(file);
  const record = {
    id: uid(), entityType: String(entityType), entityId: String(entityId),
    name: `${String(label || "foto").trim() || "foto"}.jpg`,
    mimeType: "image/jpeg", size: blob.size, createdAt: new Date().toISOString(), blob
  };
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return record;
}

export async function getPhotos(entityType, entityId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const index = tx.objectStore(STORE).index("entity");
    const request = index.getAll([String(entityType), String(entityId)]);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhotosForEntity(entityType, entityId) {
  const rows = await getPhotos(entityType, entityId);
  if (!rows.length) return 0;
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    rows.forEach(row => store.delete(row.id));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return rows.length;
}

export async function deletePhoto(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function movePhotos(entityType, fromId, toId) {
  if (!fromId || !toId || String(fromId) === String(toId)) return;
  const rows = await getPhotos(entityType, fromId);
  if (!rows.length) return;
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    rows.forEach(row => store.put({ ...row, entityId: String(toId) }));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function bytesToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function exportPhotos() {
  const rows = await getAllPhotos();
  const photos = [];
  for (const row of rows) {
    photos.push({
      id: row.id, entityType: row.entityType, entityId: row.entityId,
      name: row.name, mimeType: row.mimeType || "image/jpeg", size: row.size,
      createdAt: row.createdAt, data: bytesToBase64(await row.blob.arrayBuffer())
    });
  }
  return { format: "productos-santa-rosa-fotos", version: 1, exportedAt: new Date().toISOString(), photos };
}

export async function importPhotos(payload) {
  if (!payload || payload.format !== "productos-santa-rosa-fotos" || !Array.isArray(payload.photos)) {
    throw new Error("Archivo de fotografías no válido.");
  }
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    payload.photos.forEach(item => {
      if (!item?.id || !item?.entityType || !item?.entityId || !item?.data) return;
      const bytes = base64ToBytes(item.data);
      if (bytes.byteLength > MAX_BYTES) return;
      store.put({ id: item.id, entityType: String(item.entityType), entityId: String(item.entityId), name: item.name || "foto.jpg", mimeType: item.mimeType || "image/jpeg", size: bytes.byteLength, createdAt: item.createdAt || new Date().toISOString(), blob: new Blob([bytes], { type: item.mimeType || "image/jpeg" }) });
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export function renderPhotoPicker({ container, entityType, entityId, label = "Fotografías", draftId = null }) {
  if (!container) return;
  const ownerId = String(draftId || entityId);
  container.innerHTML = `<div class="psr-photo-section"><div class="psr-photo-head"><strong>📷 ${label}</strong><span class="psr-photo-limit">máx. 80 KB</span></div><label class="psr-photo-add">📷 Tomar / seleccionar foto<input class="psr-photo-input" type="file" accept="image/*" capture="environment" hidden></label><div class="psr-photo-grid"></div></div>`;
  const grid = container.querySelector(".psr-photo-grid");

  const render = async () => {
    grid.innerHTML = "";
    const photos = await getPhotos(entityType, ownerId);
    photos.forEach(photo => {
      const url = URL.createObjectURL(photo.blob);
      const card = document.createElement("div");
      card.className = "psr-photo-card";
      card.innerHTML = `<img alt="Fotografía"><div><small>${Math.round(photo.size / 1024)} KB</small><button type="button">🗑️</button></div>`;
      card.querySelector("img").src = url;
      card.querySelector("button").onclick = async () => { if (!confirm("¿Eliminar esta fotografía?")) return; await deletePhoto(photo.id); URL.revokeObjectURL(url); render(); };
      grid.appendChild(card);
    });
  };

  container.querySelector(".psr-photo-input").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { await savePhoto(file, entityType, ownerId, label); await render(); }
    catch (error) { alert(error.message || "No se pudo guardar la fotografía."); }
  });
  render();
}
