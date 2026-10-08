/*
 * Productos Santa Rosa
 * Módulo: Respaldos
 * Versión: 1.0.0
 * Objetivo: respaldo de datos esenciales y respaldo separado de fotografías.
 */
import { exportPhotos, importPhotos } from "../media/fotos.js";

const DATA_KEYS = [
  "psr_products", "psr_movements", "psr_inventory", "psr_sales", "psr_clients",
  "psr_market_clients", "psr_route_clients", "psr_client_products", "psr_client_history",
  "psr_visits", "psr_history", "psr_mercado_history", "psr_insumos", "psr_consignations",
  "psr_map_clients", "psr_map_categories", "psr_map_trazos", "psr_mercado_categories", "psr_mercado_products", "psr_mercado_presentations"
];

const DATA_FORMAT = "productos-santa-rosa-datos";
const VERSION = 1;

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildDataBackup() {
  const data = {};
  DATA_KEYS.forEach(key => {
    const value = read(key);
    if (value !== null) data[key] = value;
  });
  const settings = read("psr_settings");
  if (settings && typeof settings === "object" && !Array.isArray(settings)) {
    const comprasSettings = {};
    ["comprasCarritos","comprasLista","comprasHistorialEventos","comprasCarritosV1","comprasListaV1","comprasHistorialEventosV1"].forEach(key => {
      if (settings[key] !== undefined) comprasSettings[key] = settings[key];
    });
    if (Object.keys(comprasSettings).length) data.comprasSettings = comprasSettings;
  }
  return { format: DATA_FORMAT, version: VERSION, exportedAt: new Date().toISOString(), data };
}

export function exportDataBackup() {
  const payload = buildDataBackup();
  const stamp = new Date().toISOString().slice(0, 10);
  download(new Blob([JSON.stringify(payload)], { type: "application/json" }), `productos-santa-rosa-datos-${stamp}.psr.json`);
}

function openLegacyPhotoDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open("psr_market_photos_v1",1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function readLegacyPhotos(){try{const db=await openLegacyPhotoDB();return await new Promise((resolve,reject)=>{const r=db.transaction("photos","readonly").objectStore("photos").getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}catch{return[];}}
function bytesToBase64(buffer){let b="";const a=new Uint8Array(buffer);for(let i=0;i<a.length;i+=0x8000)b+=String.fromCharCode(...a.subarray(i,i+0x8000));return btoa(b);}
function base64ToBytes(base64){const b=atob(base64),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
async function writeLegacyPhotos(rows){if(!rows.length)return;const db=await new Promise((resolve,reject)=>{const r=indexedDB.open("psr_market_photos_v1",1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("photos"))r.result.createObjectStore("photos",{keyPath:"id"});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction("photos","readwrite"),store=tx.objectStore("photos");rows.forEach(x=>{const bytes=base64ToBytes(x.data);store.put({...x,blob:new Blob([bytes],{type:"image/jpeg"})});});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
export async function exportPhotoBackup() {
  const payload = await exportPhotos();
  payload.legacyMarketPhotos = [];
  for(const row of await readLegacyPhotos()){payload.legacyMarketPhotos.push({id:row.id,name:row.name,placeName:row.placeName,createdAt:row.createdAt,data:bytesToBase64(await row.blob.arrayBuffer())});}
  const stamp = new Date().toISOString().slice(0, 10);
  download(new Blob([JSON.stringify(payload)], { type: "application/json" }), `productos-santa-rosa-fotos-${stamp}.psr.json`);
}

export async function importDataBackup(file) {
  const payload = JSON.parse(await file.text());
  if (payload?.format !== DATA_FORMAT || !payload?.data || typeof payload.data !== "object") throw new Error("Archivo de datos no válido.");
  Object.entries(payload.data).forEach(([key, value]) => {
    if (key === "comprasSettings") return;
    if (!DATA_KEYS.includes(key)) return;
    let incoming = value;
    const current = read(key);
    if (Array.isArray(incoming) && Array.isArray(current) && incoming.every(x => x && typeof x === "object" && !Array.isArray(x) && x.id)) {
      const map = new Map(current.map(x => [String(x.id), x]));
      incoming.forEach(x => map.set(String(x.id), { ...(map.get(String(x.id)) || {}), ...x }));
      incoming = [...map.values()];
    }
    localStorage.setItem(key, JSON.stringify(incoming));
  });
  // Reconciliar el catálogo de Mercado inmediatamente. Esto permite que un
  // respaldo antiguo que conserve psr_client_products pero no tenga todavía
  // el catálogo nuevo pueda reconstruir productos/presentaciones, y evita
  // duplicados lógicos por nombre o referencias antiguas.
  try {
    const { normalizeMarketCatalog } = await import("../../pages/mercado/mercado-store.js");
    normalizeMarketCatalog();
  } catch (error) {
    console.warn("No fue posible reconciliar el catálogo de Mercado después de importar:", error);
  }

  if (payload.data.comprasSettings && typeof payload.data.comprasSettings === "object") {
    const settings = read("psr_settings") || {};
    const incoming = payload.data.comprasSettings;
    const pairs = [["comprasCarritosV1","comprasCarritos"],["comprasListaV1","comprasLista"],["comprasHistorialEventosV1","comprasHistorialEventos"]];
    for (const [oldKey,newKey] of pairs) {
      const value = incoming[newKey] !== undefined ? incoming[newKey] : incoming[oldKey];
      if (value === undefined) continue;
      if (newKey === "comprasCarritos") {
        settings[newKey] = {...(settings[newKey] || {}), ...(value || {})};
      } else {
        const current = Array.isArray(settings[newKey]) ? settings[newKey] : [];
        const rows = Array.isArray(value) ? value : [];
        const map = new Map(current.map(x => [String(x?.id), x]));
        rows.forEach(x => { if (x && x.id) map.set(String(x.id), {...(map.get(String(x.id)) || {}), ...x}); });
        settings[newKey] = [...map.values()];
      }
    }
    delete settings.comprasCarritosV1;
    delete settings.comprasListaV1;
    delete settings.comprasHistorialEventosV1;
    localStorage.setItem("psr_settings", JSON.stringify(settings));
  }
}

export async function importPhotoBackup(file) {
  const payload = JSON.parse(await file.text());
  await importPhotos(payload);
  if(Array.isArray(payload.legacyMarketPhotos)) await writeLegacyPhotos(payload.legacyMarketPhotos);
}

export function bindBackupUI() {
  const dataExport = document.getElementById("backupDataExport");
  const dataImport = document.getElementById("backupDataImport");
  const dataFile = document.getElementById("backupDataFile");
  const photoExport = document.getElementById("backupPhotoExport");
  const photoImport = document.getElementById("backupPhotoImport");
  const photoFile = document.getElementById("backupPhotoFile");

  dataExport?.addEventListener("click", exportDataBackup);
  dataImport?.addEventListener("click", () => dataFile?.click());
  dataFile?.addEventListener("change", async e => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    try { await importDataBackup(file); alert("Datos importados. Recarga Productos Santa Rosa para verlos."); }
    catch (error) { alert(error.message || "No se pudo importar el respaldo de datos."); }
  });
  photoExport?.addEventListener("click", async () => {
    try { await exportPhotoBackup(); } catch (error) { alert(error.message || "No se pudo exportar el respaldo de fotografías."); }
  });
  photoImport?.addEventListener("click", () => photoFile?.click());
  photoFile?.addEventListener("change", async e => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    try { await importPhotoBackup(file); alert("Fotografías importadas correctamente."); }
    catch (error) { alert(error.message || "No se pudo importar el respaldo de fotografías."); }
  });
}
