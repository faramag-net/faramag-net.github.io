/**
 * Productos Santa Rosa
 * Módulo: Mercado · almacenamiento
 * Versión: 1.0.0
 * Build: 20260925.2225
 * Objetivo: Persistencia de lugares, observaciones, compras y fotografías.
 */

import LocalDB from '../../core/storage/local-db.js';

const PHOTO_DB = 'psr_market_photos_v1';
const PHOTO_STORE = 'photos';

export function uid(){ return crypto.randomUUID(); }

export function normalize(value=''){
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

export function getPlaces(){
    return LocalDB.getMarketClients().map(p => ({
        ...p,
        tipo: p.tipo || 'Sin tipo'
    }));
}

export function savePlaces(data){ LocalDB.saveMarketClients(data); }

export function getObservations(){ return LocalDB.getClientProducts(); }
export function saveObservations(data){ LocalDB.saveClientProducts(data); }
export function getPurchases(){ return LocalDB.getInsumos(); }
export function savePurchases(data){ LocalDB.saveInsumos(data); }

export function productNames(){
    const names = new Map();
    getObservations().forEach(o => {
        const name = String(o.producto || '').trim();
        if(name) names.set(normalize(name), name);
    });
    getPurchases().forEach(o => {
        const name = String(o.producto || '').trim();
        if(name) names.set(normalize(name), name);
    });
    return [...names.values()].sort((a,b)=>a.localeCompare(b,'es'));
}

export function observationsForProduct(name){
    const n = normalize(name);
    return getObservations().filter(o => normalize(o.producto) === n);
}

export function purchasesForProduct(name){
    const n = normalize(name);
    return getPurchases().filter(o => normalize(o.producto) === n);
}

export function placeById(id){ return getPlaces().find(p=>p.id===id); }

export function upsertPlace(data){
    const places = getPlaces();
    const now = new Date().toISOString();
    if(data.id){
        const i = places.findIndex(p=>p.id===data.id);
        if(i >= 0){ places[i] = {...places[i], ...data, updatedAt:now}; savePlaces(places); return places[i]; }
    }
    const place = {
        id: uid(),
        nombre: String(data.nombre || '').trim(),
        encargado: String(data.encargado || '').trim(),
        telefono: String(data.telefono || '').trim(),
        contacto: String(data.contacto || data.telefono || data.encargado || '').trim(),
        tipo: String(data.tipo || 'Otro').trim(),
        direccion: String(data.direccion || '').trim(),
        latitud: data.latitud ?? null,
        longitud: data.longitud ?? null,
        comentarios: String(data.comentarios || '').trim(),
        estatus: 'activo',
        createdAt: now,
        updatedAt: now
    };
    places.push(place);
    savePlaces(places);
    return place;
}

export function addObservation({producto, presentacion='', precio=0, clienteId='', photoIds=[], comentarios=''}){
    const rows = getObservations();
    const now = new Date().toISOString();
    const row = {
        id: uid(), clienteId, producto: String(producto).trim(),
        presentacion: String(presentacion || '').trim(),
        precio: Number(precio) || 0,
        comentarios: String(comentarios || '').trim(),
        photoIds: [...photoIds], createdAt: now, updatedAt: now
    };
    rows.push(row); saveObservations(rows); return row;
}

export function addPurchase({producto, presentacion='', tienda='', clienteId='', comprador='Fara', compradorNombre='', contacto='', cantidad=1, precio=0, total, diferencia=0, comentarios='', direccion='', latitud=null, longitud=null, photoIds=[]}){
    const rows = getPurchases();
    const now = new Date().toISOString();
    const row = {
        id: uid(), fecha: now, producto: String(producto).trim(),
        presentacion: String(presentacion || '').trim(), tienda: String(tienda || '').trim(),
        clienteId: clienteId || '', comprador: comprador || 'Fara', compradorNombre: compradorNombre || '',
        contacto: contacto || '', cantidad: Number(cantidad)||0, precio: Number(precio)||0,
        total: Number(total ?? ((Number(cantidad)||0)*(Number(precio)||0))), diferencia: Number(diferencia)||0,
        comentarios: comentarios || '', direccion: direccion || '', latitud, longitud,
        photoIds: [...photoIds]
    };
    rows.push(row); savePurchases(rows); return row;
}

export function photoFileName(placeName, date = new Date()){
    const clean = normalize(placeName || 'lugar').replace(/[^a-z0-9]+/g,'');
    const d = date.toISOString().slice(0,10).replaceAll('-','');
    return `${clean || 'lugar'}-${d}-${Date.now().toString().slice(-4)}.jpg`;
}

function openPhotoDB(){
    return new Promise((resolve,reject)=>{
        const req = indexedDB.open(PHOTO_DB,1);
        req.onupgradeneeded = () => req.result.createObjectStore(PHOTO_STORE,{keyPath:'id'});
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function savePhoto(file, placeName){
    const image = await compressImage(file, 1280, 0.72);
    const id = uid();
    const db = await openPhotoDB();
    await new Promise((resolve,reject)=>{
        const tx = db.transaction(PHOTO_STORE,'readwrite');
        tx.objectStore(PHOTO_STORE).put({id, name:photoFileName(placeName), placeName:placeName || 'Lugar', createdAt:new Date().toISOString(), blob:image});
        tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
    return id;
}

export async function getPhoto(id){
    if(!id) return null;
    try{
        const db = await openPhotoDB();
        return await new Promise((resolve,reject)=>{
            const req = db.transaction(PHOTO_STORE,'readonly').objectStore(PHOTO_STORE).get(id);
            req.onsuccess=()=>resolve(req.result || null); req.onerror=()=>reject(req.error);
        });
    }catch{return null;}
}

export async function deletePhoto(id){
    if(!id) return;
    const db=await openPhotoDB();
    await new Promise((resolve,reject)=>{ const tx=db.transaction(PHOTO_STORE,'readwrite'); tx.objectStore(PHOTO_STORE).delete(id); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); });
}

function compressImage(file,maxSide,quality){
    return new Promise((resolve,reject)=>{
        const url=URL.createObjectURL(file); const img=new Image();
        img.onload=()=>{
            URL.revokeObjectURL(url);
            const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
            const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale));
            const ctx=canvas.getContext('2d',{alpha:false}); ctx.drawImage(img,0,0,canvas.width,canvas.height);
            canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo comprimir la foto')),'image/jpeg',quality);
        };
        img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la foto'));}; img.src=url;
    });
}
