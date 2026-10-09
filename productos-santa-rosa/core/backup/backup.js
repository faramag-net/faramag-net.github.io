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

  const marketSyncExport = document.getElementById("marketSyncExport");
  const marketSyncImport = document.getElementById("marketSyncImport");
  const marketSyncFile = document.getElementById("marketSyncFile");
  marketSyncExport?.addEventListener("click", exportMarketSync);
  marketSyncImport?.addEventListener("click", () => marketSyncFile?.click());
  marketSyncFile?.addEventListener("change", async e => {
    const file=e.target.files?.[0]; e.target.value=""; if(!file)return;
    try { await importMarketSync(file); }
    catch(error){
      document.getElementById("marketSyncModal")?.remove();
      alert(error.message||"No se pudo preparar la sincronización de Mercado.");
    }
  });
}

// --- Sincronización explícita de Mercado ---
const MARKET_SYNC_KEYS = [
  "psr_mercado_categories", "psr_mercado_products", "psr_mercado_presentations",
  "psr_market_clients", "psr_client_products", "psr_insumos"
];
const MARKET_SYNC_SETTINGS = ["comprasCarritosV1","comprasListaV1","comprasHistorialEventosV1"];
const MARKET_SYNC_META = "psr_mercado_sync_meta";
const MARKET_SYNC_FORMAT = "productos-santa-rosa-mercado-sync";
const MARKET_SYNC_VERSION = 1;

function esc(value){
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}
function syncRead(key, fallback){
  try { const v=JSON.parse(localStorage.getItem(key)||"null"); return v ?? fallback; } catch { return fallback; }
}
function syncDeviceId(){
  let id=localStorage.getItem("psr_device_id");
  if(!id){ id=(crypto.randomUUID?crypto.randomUUID():`device-${Date.now()}-${Math.random().toString(36).slice(2)}`); localStorage.setItem("psr_device_id",id); }
  return id;
}
function syncMeta(){
  const m=syncRead(MARKET_SYNC_META,{deviceId:syncDeviceId(),tombstones:[]});
  m.deviceId=m.deviceId||syncDeviceId(); m.tombstones=Array.isArray(m.tombstones)?m.tombstones:[]; return m;
}
function syncStamp(){return new Date().toISOString();}
function syncClone(v){return JSON.parse(JSON.stringify(v));}
function syncStable(v){
  if(v===undefined)return "__undefined__";
  if(v===null||typeof v!=="object")return JSON.stringify(v);
  if(Array.isArray(v))return `[${v.map(syncStable).sort().join(",")}]`;
  return `{${Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+syncStable(v[k])).join(",")}}`;
}
function marketSyncPayload(){
  const data={};
  [...MARKET_SYNC_KEYS].forEach(k=>{const v=syncRead(k,null);if(v!==null)data[k]=v;});
  const settings=syncRead("psr_settings",{});
  const comprasSettings={};
  MARKET_SYNC_SETTINGS.forEach(k=>{if(settings?.[k]!==undefined)comprasSettings[k]=settings[k];});
  if(Object.keys(comprasSettings).length)data.comprasSettings=comprasSettings;
  return {format:MARKET_SYNC_FORMAT,version:MARKET_SYNC_VERSION,exportedAt:syncStamp(),deviceId:syncDeviceId(),data,tombstones:syncClone(syncMeta().tombstones)};
}
function downloadJson(payload,name){download(new Blob([JSON.stringify(payload)],{type:"application/json"}),name);}
export function exportMarketSync(){downloadJson(marketSyncPayload(),`productos-santa-rosa-mercado-sync-${new Date().toISOString().slice(0,10)}.psr.json`);}

function markMarketDeletion(entityType,id){
  const m=syncMeta();
  const key=`${entityType}:${id}`;
  m.tombstones=m.tombstones.filter(x=>`${x.entityType}:${x.id}`!==key);
  m.tombstones.push({entityType,id:String(id),deletedAt:syncStamp(),deviceId:m.deviceId});
  localStorage.setItem(MARKET_SYNC_META,JSON.stringify(m));
}
export function recordMarketDeletion(entityType,id){markMarketDeletion(entityType,id);}

function syncEntityLabel(type,row){
  if(type==="category")return `📂 ${row?.nombre||row?.id||"Categoría"}`;
  if(type==="product")return `📦 ${row?.nombre||row?.id||"Producto"}`;
  if(type==="presentation")return `📊 ${row?.nombre||row?.id||"Presentación"}`;
  if(type==="place")return `🏪 ${row?.nombre||row?.id||"Empresa"}`;
  if(type==="price")return `💰 ${row?.producto||row?.presentacion||row?.id||"Precio"}`;
  if(type==="purchase")return `🛒 ${row?.producto||row?.presentacion||row?.id||"Compra"}`;
  return `${type}: ${row?.id||"registro"}`;
}
function syncArrayKeyInfo(key){
  const map={
    psr_mercado_categories:"category", psr_mercado_products:"product", psr_mercado_presentations:"presentation",
    psr_market_clients:"place", psr_client_products:"price", psr_insumos:"purchase"
  }; return map[key]||key;
}
function buildMarketSyncDiff(payload){
  const diffs=[];
  for(const key of MARKET_SYNC_KEYS){
    const local=syncRead(key,[]); const incoming=Array.isArray(payload.data?.[key])?payload.data[key]:[];
    const lm=new Map(local.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const im=new Map(incoming.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    for(const [id,row] of im){
      if(!lm.has(id)) diffs.push({kind:"new",key,type:syncArrayKeyInfo(key),id,row,incoming:row,local:null});
      else if(syncStable(lm.get(id))!==syncStable(row)) diffs.push({kind:"conflict",key,type:syncArrayKeyInfo(key),id,row:lm.get(id),incoming:row,local:lm.get(id)});
    }
    for(const [id,row] of lm){if(!im.has(id))diffs.push({kind:"localOnly",key,type:syncArrayKeyInfo(key),id,row,local:row,incoming:null});}
  }
  const localT=syncMeta().tombstones||[], incomingT=Array.isArray(payload.tombstones)?payload.tombstones:[];
  const allT=new Map(); [...localT,...incomingT].forEach(t=>{if(t?.entityType&&t?.id){const k=`${t.entityType}:${t.id}`;const prev=allT.get(k);if(!prev||String(t.deletedAt||"")>String(prev.deletedAt||""))allT.set(k,t);}});
  for(const t of allT.values()){
    const keyMap={category:"psr_mercado_categories",product:"psr_mercado_products",presentation:"psr_mercado_presentations",place:"psr_market_clients",price:"psr_client_products",purchase:"psr_insumos"};
    const key=keyMap[t.entityType]; if(!key)continue;
    const local=syncRead(key,[]).find(x=>String(x?.id)===String(t.id));
    const incoming=Array.isArray(payload.data?.[key])?payload.data[key].find(x=>String(x?.id)===String(t.id)):null;
    if(local || incoming) diffs.push({kind:"deletedConflict",key,type:t.entityType,id:String(t.id),row:local||incoming,local,incoming,tombstone:t});
  }
  return diffs;
}

function renderMarketSyncReview(payload,diffs){
  let modal=document.getElementById("marketSyncModal");
  if(!modal){modal=document.createElement("div");modal.id="marketSyncModal";modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px;font-family:inherit;";document.body.appendChild(modal);}
  const conflicts=diffs.filter(d=>d.kind==="conflict"||d.kind==="deletedConflict");
  const counts={new:diffs.filter(d=>d.kind==="new").length,localOnly:diffs.filter(d=>d.kind==="localOnly").length,conflict:conflicts.length};
  const rows=conflicts.map((d,i)=>`<div style="border:1px solid #ddd;border-radius:10px;padding:10px;margin:8px 0;background:#fff"><strong>${esc(syncEntityLabel(d.type,d.row))}</strong><div style="font-size:12px;color:#666;margin:4px 0">${d.kind==="deletedConflict"?"🗑️ Eliminación detectada":"⚠️ Cambios diferentes"}</div><label style="display:block;margin:5px 0"><input type="radio" name="ms-${i}" value="local" checked> Conservar este dispositivo</label><label style="display:block;margin:5px 0"><input type="radio" name="ms-${i}" value="incoming"> Usar dispositivo importado</label>${d.kind==="conflict"?'<label style="display:block;margin:5px 0"><input type="radio" name="ms-'+i+'" value="newer"> Usar el más reciente</label>':''}</div>`).join("");
  modal.innerHTML=`<div style="background:#f8fafc;border-radius:14px;max-width:720px;width:100%;max-height:92vh;overflow:auto;padding:16px;color:#111"><h2 style="margin:0 0 6px">🔄 Sincronizar Mercado</h2><p style="margin:4px 0 12px">No se ha modificado ningún dato todavía.</p><div style="display:flex;gap:8px;flex-wrap:wrap;font-size:13px"><span>➕ ${counts.new} nuevos</span><span>📍 ${counts.localOnly} solo aquí</span><span>⚠️ ${counts.conflict} conflictos</span></div>${rows||'<p style="padding:10px 0">No hay conflictos que resolver.</p>'}<div style="display:flex;gap:8px;justify-content:flex-end;position:sticky;bottom:0;background:#f8fafc;padding-top:10px"><button id="msCancel">Cancelar</button><button id="msApply">✅ Aplicar sincronización</button></div></div>`;
  modal.querySelector("#msCancel").onclick=()=>modal.remove();
  modal.querySelector("#msApply").onclick=()=>{const choices=conflicts.map((d,i)=>({d,choice:modal.querySelector(`input[name="ms-${i}"]:checked`)?.value||"local"}));applyMarketSync(payload,diffs,choices);modal.remove();alert("Sincronización de Mercado aplicada. Exporta este dispositivo y aplica el archivo en el otro para dejar ambos con el mismo estado.");};
}
function applyMarketSync(payload,diffs,choices){
  const choiceById=new Map(choices.map(x=>[`${x.d.key}:${x.d.id}:${x.d.kind}`,x.choice]));
  for(const key of MARKET_SYNC_KEYS){
    const local=syncRead(key,[]);const incoming=Array.isArray(payload.data?.[key])?payload.data[key]:[];const map=new Map(local.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    incoming.filter(x=>x&&x.id).forEach(row=>{const id=String(row.id);if(!map.has(id))map.set(id,row);else if(syncStable(map.get(id))!==syncStable(row)){const d=diffs.find(x=>x.key===key&&x.id===id&&x.kind==="conflict");const ch=d?choiceById.get(`${key}:${id}:conflict`):null;if(ch==="incoming" || (ch==="newer"&&String(row.updatedAt||"")>String(map.get(id).updatedAt||"")))map.set(id,row);}});
    const deleted=diffs.filter(d=>d.key===key&&d.kind==="deletedConflict");for(const d of deleted){const ch=choiceById.get(`${key}:${d.id}:deletedConflict`);if(ch==="incoming"){map.delete(String(d.id));} }
    localStorage.setItem(key,JSON.stringify([...map.values()]));
  }
  const settings=syncRead("psr_settings",{});const inc=payload.data?.comprasSettings||{};for(const k of MARKET_SYNC_SETTINGS){if(inc[k]===undefined)continue;if(k==="comprasCarritosV1")settings[k]={...(settings[k]||{}),...(inc[k]||{})};else{const a=Array.isArray(settings[k])?settings[k]:[],b=Array.isArray(inc[k])?inc[k]:[],m=new Map(a.map(x=>[String(x?.id),x]));b.forEach(x=>{if(x?.id)m.set(String(x.id),x);});settings[k]=[...m.values()];}}localStorage.setItem("psr_settings",JSON.stringify(settings));
  const meta=syncMeta();const incomingT=Array.isArray(payload.tombstones)?payload.tombstones:[];const tm=new Map();[...meta.tombstones,...incomingT].forEach(t=>{if(t?.entityType&&t?.id){const k=`${t.entityType}:${t.id}`,p=tm.get(k);if(!p||String(t.deletedAt||"")>String(p.deletedAt||""))tm.set(k,t);}});localStorage.setItem(MARKET_SYNC_META,JSON.stringify({...meta,tombstones:[...tm.values()]}));
}

export async function importMarketSync(file){
  const payload=JSON.parse(await file.text());
  if(payload?.format!==MARKET_SYNC_FORMAT||!payload?.data)throw new Error("Archivo de sincronización de Mercado no válido.");
  const diffs=buildMarketSyncDiff(payload);renderMarketSyncReview(payload,diffs);
}
