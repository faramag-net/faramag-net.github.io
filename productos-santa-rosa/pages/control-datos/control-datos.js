import { crearNavbar } from "../../components/navbar.js";
import { getAllPhotos, deletePhoto } from "../../core/media/fotos.js";

document.getElementById("navbar").innerHTML = crearNavbar();

const searchInput = document.getElementById("searchAll");
const results = document.getElementById("results");
const summary = document.getElementById("summary");
const dialog = document.getElementById("deleteDialog");
const confirmWord = document.getElementById("confirmWord");
const confirmDelete = document.getElementById("confirmDelete");
const deleteDescription = document.getElementById("deleteDescription");
let activeFilter = "all";
let rows = [];
let pendingDelete = null;
let objectUrls = [];

const esc = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
const printable = value => {
  try { return typeof value === "string" ? value : JSON.stringify(value); }
  catch { return String(value); }
};
const normalized = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

function readLocalStorageRows(){
  const output = [];
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(!key || !key.startsWith("psr_") || key === "psr_media_v1") continue;
    const raw = localStorage.getItem(key);
    let value;
    try { value = JSON.parse(raw); } catch { value = raw; }
    if(Array.isArray(value)){
      value.forEach((record,index)=>output.push({kind:"data",key,record,index,label:record?.nombre || record?.name || record?.producto || record?.id || `Registro ${index+1}`,id:record?.id ?? null,search:normalized(`${key} ${printable(record)}`),protected:key === "psr_device_id"}));
    } else if(value && typeof value === "object"){
      Object.entries(value).forEach(([property,record])=>output.push({kind:"data",key,record,property,label:record?.nombre || record?.name || property,id:record?.id ?? property,search:normalized(`${key} ${property} ${printable(record)}`),protected:key === "psr_device_id"}));
      if(!Object.keys(value).length) output.push({kind:"data",key,record:value,label:"Objeto vacío",id:null,search:normalized(`${key} objeto vacío`),emptyObject:true,protected:key === "psr_device_id"});
    } else {
      output.push({kind:"data",key,record:value,label:key,id:null,search:normalized(`${key} ${printable(value)}`),primitive:true,protected:key === "psr_device_id"});
    }
  }
  return output;
}

function allPossibleRecords(){
  const candidates = [];
  const keys = ["psr_route_clients","psr_market_clients","psr_map_clients","psr_clients","psr_products","psr_mercado_products","psr_mercado_presentations"];
  for(const key of keys){
    try{
      const value=JSON.parse(localStorage.getItem(key)||"null");
      const list=Array.isArray(value)?value:(value&&typeof value==="object"?Object.values(value):[]);
      for(const item of list){if(item&&typeof item==="object") candidates.push({key,item});}
    }catch{}
  }
  return candidates;
}

function photoOwner(photo){
  const id=String(photo.entityId ?? "");
  const type=String(photo.entityType ?? "");
  const matches=allPossibleRecords().filter(({key,item})=>String(item.id ?? "")===id || String(item.routeClientId ?? "")===id || String(item.marketPlaceId ?? "")===id);
  const priority = type==="cliente" ? ["psr_route_clients","psr_clients","psr_map_clients"] : type==="empresa" ? ["psr_market_clients","psr_map_clients"] : type==="mapa" ? ["psr_map_clients","psr_route_clients","psr_market_clients"] : ["psr_mercado_presentations","psr_mercado_products","psr_products","psr_route_clients","psr_market_clients","psr_map_clients"];
  matches.sort((a,b)=>priority.indexOf(a.key) - priority.indexOf(b.key));
  const found=matches[0];
  if(found) return {label:found.item.nombre || found.item.name || found.item.producto || found.item.marca || "Registro localizado",key:found.key,exists:true};
  if(["mapa-pendiente","mapa-borrador"].includes(type)) return {label:"Fotografía temporal / pendiente de asignación",key:"",exists:false};
  return {label:"Registro no localizado",key:"",exists:false};
}

async function loadRows(){
  rows = readLocalStorageRows();
  try{
    const photos=await getAllPhotos();
    photos.forEach(photo=>{
      const owner=photoOwner(photo);
      rows.push({kind:"photo",photo,owner,label:photo.name || "Fotografía",id:photo.id,search:normalized(`${photo.name} ${photo.entityType} ${photo.entityId} ${photo.createdAt} ${owner.label} ${owner.key} ${photo.size}`)});
    });
  }catch(error){
    console.error("No fue posible leer las fotografías:",error);
    summary.textContent="No se pudieron leer las fotografías. Los datos del navegador siguen disponibles.";
  }
  render();
}

function formatDate(value){
  if(!value) return "Fecha no disponible";
  const date=new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("es-MX",{dateStyle:"medium",timeStyle:"short"}).format(date);
}
function bytes(value){return `${(Number(value||0)/1024).toFixed(1)} KB`;}

function render(){
  objectUrls.forEach(url=>URL.revokeObjectURL(url)); objectUrls=[];
  const query=normalized(searchInput.value.trim());
  const visible=rows.filter(row=>(activeFilter==="all" || (activeFilter==="photos" ? row.kind==="photo" : row.kind==="data")) && (!query || row.search.includes(query)));
  summary.textContent=`${visible.length} elemento(s) · ${rows.filter(r=>r.kind==="data").length} registros/valores · ${rows.filter(r=>r.kind==="photo").length} fotografías`;
  if(!visible.length){results.innerHTML='<div class="empty">No se encontraron elementos con esa búsqueda.</div>';return;}
  const groups=new Map();
  visible.forEach(row=>{const group=row.kind==="photo"?"📸 Fotos y archivos":row.key; if(!groups.has(group))groups.set(group,[]);groups.get(group).push(row);});
  results.innerHTML=[...groups.entries()].map(([group,items])=>`<section><h2 class="group-title">${esc(group)} <span class="summary">(${items.length})</span></h2>${items.map((row)=>{
    if(row.kind==="photo"){
      const url=URL.createObjectURL(row.photo.blob);objectUrls.push(url);
      const status=row.owner.exists?`Asociada a: ${row.owner.label} · ${row.owner.key}`:row.owner.label;
      return `<article class="photo-row"><img class="photo-thumb" src="${url}" alt="Vista previa de ${esc(row.label)}" data-preview="${esc(row.id)}"><div class="row-content"><div class="row-title">${esc(row.label)}</div><div class="row-meta">Fecha: ${esc(formatDate(row.photo.createdAt))}<br>Tipo: ${esc(row.photo.entityType)} · ID asociado: ${esc(row.photo.entityId)}<br>${esc(status)}<br>Tamaño: ${esc(bytes(row.photo.size))}</div></div><div class="row-actions"><button type="button" data-preview="${esc(row.id)}">Ver foto</button><button type="button" class="danger" data-delete-photo="${esc(row.photo.id)}">Eliminar</button></div></article>`;
    }
    const details=printable(row.record);
    const short=details.length>260?`${details.slice(0,260)}…`:details;
    return `<article class="data-row"><div class="row-content"><div class="row-title">${esc(row.label)}</div><div class="row-meta">Clave: ${esc(row.key)}${row.id!==null?`<br>ID/propiedad: ${esc(row.id)}`:""}<br>${esc(short)}</div></div><div class="row-actions"><button type="button" data-view-content="1" data-key="${esc(row.key)}" data-index="${row.index ?? ""}" data-property="${esc(row.property ?? "")}" data-id="${esc(row.id ?? "")}">Ver contenido</button>${row.protected?'<button type="button" disabled title="Clave protegida">Protegido</button>':`<button type="button" class="danger" data-delete-data="${esc(row.key)}" data-index="${row.index ?? ""}" data-id="${esc(row.id ?? "")}" data-property="${esc(row.property ?? "")}" data-record="${esc(JSON.stringify(row.record))}" data-primitive="${row.primitive?"1":"0"}" data-empty="${row.emptyObject?"1":"0"}">Eliminar</button>`}</div></article>`;
  }).join("")}</section>`).join("");
}

function requestDelete(target,description){pendingDelete=target;deleteDescription.textContent=description;confirmWord.value="";confirmDelete.disabled=true;dialog.showModal();confirmWord.focus();}
confirmWord.addEventListener("input",()=>{confirmDelete.disabled=confirmWord.value.trim()!=="CONFIRMAR";});
document.getElementById("cancelDelete").addEventListener("click",()=>{pendingDelete=null;dialog.close();});
document.getElementById("deleteForm").addEventListener("submit",async event=>{
  event.preventDefault(); if(!pendingDelete || confirmWord.value.trim()!=="CONFIRMAR") return;
  const target=pendingDelete; confirmDelete.disabled=true;
  try{
    if(target.kind==="photo"){
      await deletePhoto(target.id);
    }else{
      const raw=localStorage.getItem(target.key);
      if(raw===null) throw new Error("La clave ya no existe. Se actualizará la vista.");
      let value;try{value=JSON.parse(raw);}catch{value=raw;}
      if(target.primitive){
        if(target.key==="psr_device_id") throw new Error("Esta clave está protegida.");
        localStorage.removeItem(target.key);
      }else if(Array.isArray(value)){
        let index=-1;
        if(target.id!="") index=value.findIndex(item=>String(item?.id ?? "")===String(target.id));
        if(index<0){const snapshot=JSON.stringify(target.record);index=value.findIndex(item=>JSON.stringify(item)===snapshot);}
        if(index<0) throw new Error("El registro cambió o ya no existe. No se eliminó nada.");
        value.splice(index,1);localStorage.setItem(target.key,JSON.stringify(value));
      }else if(value&&typeof value==="object"){
        if(target.emptyObject){localStorage.setItem(target.key,"{}");}
        else if(Object.prototype.hasOwnProperty.call(value,target.property)){
          if(JSON.stringify(value[target.property])!==JSON.stringify(target.record)) throw new Error("El dato cambió desde que se mostró. No se eliminó nada.");
          delete value[target.property];localStorage.setItem(target.key,JSON.stringify(value));
        }else throw new Error("La propiedad ya no existe. No se eliminó nada.");
      }else throw new Error("No se pudo identificar el elemento con seguridad.");
    }
    dialog.close();pendingDelete=null;await loadRows();
  }catch(error){alert(`No se pudo completar la eliminación.\n\n${error.message || error}`);}
  finally{confirmDelete.disabled=false;}
});

results.addEventListener("click",event=>{
  const viewButton=event.target.closest("[data-view-content]");
  if(viewButton){
    const row=rows.find(r=>r.kind==="data" && r.key===viewButton.dataset.key && String(r.index??"")===viewButton.dataset.index && String(r.property??"")===viewButton.dataset.property);
    if(!row)return;
    const layer=document.createElement("div");
    layer.className="content-preview";
    layer.setAttribute("role","dialog");
    layer.setAttribute("aria-modal","true");
    layer.setAttribute("aria-label",`Contenido completo de ${row.key}`);
    const content=typeof row.record === "string" ? row.record : JSON.stringify(row.record,null,2);
    layer.innerHTML=`<section class="content-preview-card"><button type="button" class="content-preview-close">Cerrar ✕</button><h2>Contenido completo</h2><p class="content-preview-meta">Clave: <strong>${esc(row.key)}</strong>${row.id!==null?` · ID/propiedad: <strong>${esc(row.id)}</strong>`:""}</p><pre class="content-preview-json"></pre><div class="content-preview-actions"><button type="button" class="content-copy">Copiar contenido</button><button type="button" class="content-preview-close secondary">Cerrar</button></div></section>`;
    layer.querySelector(".content-preview-json").textContent=content ?? "null";
    const close=()=>layer.remove();
    layer.querySelectorAll(".content-preview-close").forEach(button=>button.addEventListener("click",close));
    layer.querySelector(".content-copy").addEventListener("click",async()=>{
      try{await navigator.clipboard.writeText(content ?? "null");layer.querySelector(".content-copy").textContent="Copiado ✓";}
      catch{const area=document.createElement("textarea");area.value=content ?? "null";area.setAttribute("readonly","");layer.querySelector(".content-preview-card").append(area);area.select();try{document.execCommand("copy");layer.querySelector(".content-copy").textContent="Copiado ✓";}catch{alert("No fue posible copiar automáticamente. Puedes seleccionar el contenido y copiarlo manualmente.");}area.remove();}
    });
    layer.addEventListener("click",e=>{if(e.target===layer)close();});
    const onKey=e=>{if(e.key==="Escape"&&document.body.contains(layer)){close();document.removeEventListener("keydown",onKey);}};
    document.addEventListener("keydown",onKey);
    document.body.append(layer);
    layer.querySelector(".content-preview-close").focus();
    return;
  }
  const photoButton=event.target.closest("[data-delete-photo]");
  if(photoButton){const row=rows.find(r=>r.kind==="photo"&&String(r.photo.id)===photoButton.dataset.deletePhoto);if(row)requestDelete({kind:"photo",id:row.photo.id},`Archivo: ${row.photo.name || "Fotografía"}. Fecha: ${formatDate(row.photo.createdAt)}. Registro asociado: ${row.owner.label}. Se eliminará solo esta fotografía.`);return;}
  const dataButton=event.target.closest("[data-delete-data]");
  if(dataButton){const row=rows.find(r=>r.kind==="data"&&r.key===dataButton.dataset.deleteData&&String(r.index??"")===dataButton.dataset.index&&String(r.property??"")===dataButton.dataset.property);if(!row)return;requestDelete({kind:"data",key:row.key,index:row.index,id:row.id,property:row.property,record:row.record,primitive:row.primitive,emptyObject:row.emptyObject},`Clave: ${row.key}. Elemento: ${row.label}. Se eliminará únicamente este elemento; no se ejecutará una eliminación en cascada.`);return;}
  const preview=event.target.closest("[data-preview]");
  if(preview){
    const row=rows.find(r=>r.kind==="photo"&&String(r.photo.id)===preview.dataset.preview);
    if(!row)return;
    const url=URL.createObjectURL(row.photo.blob);
    const ownerStatus=row.owner.exists?`Asociada a: ${row.owner.label} · ${row.owner.key}`:row.owner.label;
    const layer=document.createElement("div");
    layer.className="photo-preview";
    layer.setAttribute("role","dialog");
    layer.setAttribute("aria-modal","true");
    layer.setAttribute("aria-label",`Detalles de ${row.photo.name || "fotografía"}`);
    layer.innerHTML=`<section class="photo-preview-card"><button type="button" class="photo-preview-close">Cerrar ✕</button><h2>${esc(row.photo.name || "Fotografía")}</h2><img alt="${esc(row.label)}"><div class="photo-preview-details"><div><strong>Fecha de subida</strong><span>${esc(formatDate(row.photo.createdAt))}</span></div><div><strong>Tipo de archivo</strong><span>${esc(row.photo.mimeType || row.photo.blob?.type || "No disponible")}</span></div><div><strong>Tamaño</strong><span>${esc(bytes(row.photo.size ?? row.photo.blob?.size))}</span></div><div><strong>Tipo de registro</strong><span>${esc(row.photo.entityType || "No disponible")}</span></div><div><strong>ID asociado</strong><span class="breakable">${esc(row.photo.entityId || "Sin ID")}</span></div><div><strong>Registro relacionado</strong><span>${esc(ownerStatus)}</span></div></div></section>`;
    layer.querySelector("img").src=url;
    const close=()=>{URL.revokeObjectURL(url);layer.remove();};
    layer.querySelector(".photo-preview-close").onclick=close;
    layer.onclick=e=>{if(e.target===layer)close();};
    const onKey=e=>{if(e.key==="Escape"&&document.body.contains(layer)){close();document.removeEventListener("keydown",onKey);}};
    document.addEventListener("keydown",onKey);
    document.body.append(layer);
    layer.querySelector(".photo-preview-close").focus();
  }
});
searchInput.addEventListener("input",render);
document.getElementById("filters").addEventListener("click",event=>{const button=event.target.closest("button[data-filter]");if(!button)return;activeFilter=button.dataset.filter;document.querySelectorAll("#filters button").forEach(b=>b.classList.toggle("active",b===button));render();});
window.addEventListener("beforeunload",()=>objectUrls.forEach(url=>URL.revokeObjectURL(url)));
loadRows();
