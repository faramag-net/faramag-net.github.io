/**
 * Productos Santa Rosa
 * Módulo: Mercado · almacenamiento
 * Versión: 1.1.0
 * Build: 20260926.1030
 * Objetivo: Catálogo de productos/presentaciones, empresas, precios, fotos y compras.
 */
import LocalDB from '../../core/storage/local-db.js';

const PRODUCT_KEY='psr_mercado_products';
const PRESENTATION_KEY='psr_mercado_presentations';
const PHOTO_DB='psr_market_photos_v1';
const PHOTO_STORE='photos';

export const uid=()=>crypto.randomUUID();
export const normalize=(value='')=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const now=()=>new Date().toISOString();
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key))||[];}catch{return[];}};
const write=(key,data)=>localStorage.setItem(key,JSON.stringify(data));

export function getPlaces(){return LocalDB.getMarketClients().map(p=>({...p,tipo:p.tipo||'Sin tipo',estatus:p.estatus||'activo'}));}
export function savePlaces(data){LocalDB.saveMarketClients(data);}
export function placeById(id){return getPlaces().find(p=>String(p.id)===String(id));}
export function getObservations(){return LocalDB.getClientProducts();}
export function saveObservations(data){LocalDB.saveClientProducts(data);}
export function getPurchases(){return LocalDB.getInsumos();}
export function savePurchases(data){LocalDB.saveInsumos(data);}

export function getProducts(){return read(PRODUCT_KEY).filter(p=>p.active!==false);}
export function getAllProducts(){return read(PRODUCT_KEY);}
export function getPresentations(){return read(PRESENTATION_KEY).filter(p=>p.active!==false);}
export function getAllPresentations(){return read(PRESENTATION_KEY);}
export function productById(id){return read(PRODUCT_KEY).find(p=>String(p.id)===String(id));}
export function presentationById(id){return read(PRESENTATION_KEY).find(p=>String(p.id)===String(id));}
export function presentationsForProduct(productId){return getPresentations().filter(p=>String(p.productId)===String(productId));}

function ensureCatalog(){
  const products=read(PRODUCT_KEY); const presentations=read(PRESENTATION_KEY); let changed=false;
  const pmap=new Map(products.map(p=>[normalize(p.nombre),p]));
  const presmap=new Map(presentations.map(p=>[`${p.productId}|${normalize(p.nombre)}`,p]));
  const ensureProduct=(name)=>{
    const clean=String(name||'').trim(); if(!clean)return null;
    let p=pmap.get(normalize(clean));
    if(!p){p={id:uid(),nombre:clean,active:true,createdAt:now(),updatedAt:now()};products.push(p);pmap.set(normalize(clean),p);changed=true;}
    return p;
  };
  const ensurePres=(product,name)=>{
    const clean=String(name||'').trim()||'Sin presentación'; const key=`${product.id}|${normalize(clean)}`;
    let p=presmap.get(key);
    if(!p){p={id:uid(),productId:product.id,nombre:clean,active:true,createdAt:now(),updatedAt:now()};presentations.push(p);presmap.set(key,p);changed=true;}
    return p;
  };
  [...getObservations(),...getPurchases()].forEach(r=>{const p=ensureProduct(r.producto);if(p)ensurePres(p,r.presentacion);});
  // Vincula registros históricos con la presentación recién normalizada.
  const obs=getObservations(); let obsChanged=false;
  obs.forEach(r=>{ if(!r.presentationId){ const p=pmap.get(normalize(r.producto)); const pr=p?presmap.get(`${p.id}|${normalize(String(r.presentacion||"Sin presentación"))}`):null; if(pr){r.presentationId=pr.id;obsChanged=true;} } });
  const purchases=getPurchases(); let purChanged=false;
  purchases.forEach(r=>{ if(!r.presentationId){ const p=pmap.get(normalize(r.producto)); const pr=p?presmap.get(`${p.id}|${normalize(String(r.presentacion||"Sin presentación"))}`):null; if(pr){r.presentationId=pr.id;purChanged=true;} } });
  if(changed){write(PRODUCT_KEY,products);write(PRESENTATION_KEY,presentations);}
  if(obsChanged)saveObservations(obs);
  if(purChanged)savePurchases(purchases);
}
ensureCatalog();

export function productNames(){return getProducts().map(p=>p.nombre).sort((a,b)=>a.localeCompare(b,'es'));}
export function observationsForProduct(name){return getObservations().filter(o=>normalize(o.producto)===normalize(name));}
export function purchasesForProduct(name){return getPurchases().filter(o=>normalize(o.producto)===normalize(name));}

export function createProduct(data){const all=read(PRODUCT_KEY);if(all.some(p=>normalize(p.nombre)===normalize(data.nombre)))throw new Error('Ya existe ese producto.');const p={id:uid(),nombre:String(data.nombre).trim(),categoria:String(data.categoria||'').trim(),active:true,createdAt:now(),updatedAt:now()};all.push(p);write(PRODUCT_KEY,all);return p;}
export function updateProduct(id,data){const all=read(PRODUCT_KEY);const i=all.findIndex(p=>p.id===id);if(i<0)throw new Error('Producto no encontrado.');all[i]={...all[i],...data,nombre:String(data.nombre??all[i].nombre).trim(),updatedAt:now()};write(PRODUCT_KEY,all);return all[i];}
export function deactivateProduct(id){const all=read(PRODUCT_KEY);const p=all.find(x=>x.id===id);if(!p)throw new Error('Producto no encontrado.');p.active=false;p.updatedAt=now();write(PRODUCT_KEY,all);return p;}
export function deleteProduct(id){write(PRODUCT_KEY,read(PRODUCT_KEY).filter(p=>p.id!==id));write(PRESENTATION_KEY,read(PRESENTATION_KEY).filter(p=>p.productId!==id));}

export function createPresentation(data){const all=read(PRESENTATION_KEY);if(all.some(p=>p.active!==false&&p.productId===data.productId&&normalize(p.nombre)===normalize(data.nombre)))throw new Error('Ya existe esa presentación para el producto.');const p={id:uid(),productId:data.productId,nombre:String(data.nombre).trim(),unidad:String(data.unidad||'').trim(),active:true,createdAt:now(),updatedAt:now()};all.push(p);write(PRESENTATION_KEY,all);return p;}
export function updatePresentation(id,data){const all=read(PRESENTATION_KEY);const i=all.findIndex(p=>p.id===id);if(i<0)throw new Error('Presentación no encontrada.');all[i]={...all[i],...data,nombre:String(data.nombre??all[i].nombre).trim(),updatedAt:now()};write(PRESENTATION_KEY,all);return all[i];}
export function deactivatePresentation(id){const all=read(PRESENTATION_KEY);const p=all.find(x=>x.id===id);if(!p)throw new Error('Presentación no encontrada.');p.active=false;p.updatedAt=now();write(PRESENTATION_KEY,all);return p;}
export function deletePresentation(id){write(PRESENTATION_KEY,read(PRESENTATION_KEY).filter(p=>p.id!==id));}

export function upsertPlace(data){const places=getPlaces();const stamp=now();if(data.id){const i=places.findIndex(p=>p.id===data.id);if(i>=0){places[i]={...places[i],...data,updatedAt:stamp};savePlaces(places);return places[i];}}const p={id:uid(),nombre:String(data.nombre||'').trim(),encargado:String(data.encargado||'').trim(),telefono:String(data.telefono||'').trim(),contacto:String(data.contacto||data.telefono||data.encargado||'').trim(),tipo:String(data.tipo||'Tienda').trim(),direccion:String(data.direccion||'').trim(),latitud:data.latitud??null,longitud:data.longitud??null,comentarios:String(data.comentarios||'').trim(),estatus:'activo',createdAt:stamp,updatedAt:stamp};places.push(p);savePlaces(places);return p;}
export function deactivatePlace(id){const places=getPlaces();const p=places.find(x=>x.id===id);if(!p)throw new Error('Empresa no encontrada.');p.estatus='inactivo';p.updatedAt=now();savePlaces(places);return p;}
export function deletePlace(id){savePlaces(getPlaces().filter(p=>p.id!==id));}

export function addObservation({producto,presentacion='',presentationId='',precio=0,clienteId='',photoIds=[],comentarios=''}){const rows=getObservations();const stamp=now();const row={id:uid(),clienteId,producto:String(producto).trim(),presentacion:String(presentacion||'').trim(),presentationId,precio:Number(precio)||0,comentarios:String(comentarios||'').trim(),photoIds:[...photoIds],createdAt:stamp,updatedAt:stamp};rows.push(row);saveObservations(rows);return row;}
export function deleteObservation(id){saveObservations(getObservations().filter(o=>o.id!==id));}
export function addPurchase(data){const rows=getPurchases();const stamp=now();const row={id:uid(),fecha:stamp,producto:String(data.producto).trim(),presentacion:String(data.presentacion||'').trim(),presentationId:data.presentationId||'',tienda:String(data.tienda||'').trim(),clienteId:data.clienteId||'',comprador:data.comprador||'Fara',compradorNombre:data.compradorNombre||'',contacto:data.contacto||'',cantidad:Number(data.cantidad)||0,precio:Number(data.precio)||0,total:Number(data.total??((Number(data.cantidad)||0)*(Number(data.precio)||0))),diferencia:Number(data.diferencia)||0,comentarios:data.comentarios||'',direccion:data.direccion||'',latitud:data.latitud??null,longitud:data.longitud??null,photoIds:[...(data.photoIds||[])]};rows.push(row);savePurchases(rows);return row;}
export function deletePurchase(id){savePurchases(getPurchases().filter(p=>p.id!==id));}

export function latestPriceForPresentationPlace(presentationId,placeId){return getObservations().filter(o=>String(o.presentationId)===String(presentationId)&&String(o.clienteId)===String(placeId)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0]||null;}
export function pricesForPresentation(presentationId){return getObservations().filter(o=>String(o.presentationId)===String(presentationId)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));}
export function ensurePresentation(productId,name){const found=presentationsForProduct(productId).find(p=>normalize(p.nombre)===normalize(name||'Sin presentación'));return found||createPresentation({productId,nombre:name||'Sin presentación'});}

export function photoFileName(placeName,date=new Date()){const clean=normalize(placeName||'lugar').replace(/[^a-z0-9]+/g,'');const d=date.toISOString().slice(0,10).replaceAll('-','');return `${clean||'lugar'}-${d}-${Date.now().toString().slice(-4)}.jpg`;}
function openPhotoDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(PHOTO_DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(PHOTO_STORE,{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function savePhoto(file,placeName){const image=await compressImage(file,1280,0.72);const id=uid();const db=await openPhotoDB();await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put({id,name:photoFileName(placeName),placeName:placeName||'Lugar',createdAt:now(),blob:image});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});return id;}
export async function getPhoto(id){if(!id)return null;try{const db=await openPhotoDB();return await new Promise((resolve,reject)=>{const req=db.transaction(PHOTO_STORE,'readonly').objectStore(PHOTO_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}catch{return null;}}
export async function deletePhoto(id){if(!id)return;const db=await openPhotoDB();await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function compressImage(file,maxSide,quality){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(url);const scale=Math.min(1,maxSide/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d',{alpha:false});ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo comprimir la foto')),'image/jpeg',quality);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la foto'));};img.src=url;});}
