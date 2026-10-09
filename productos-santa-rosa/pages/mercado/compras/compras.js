/**
 * Productos Santa Rosa
 * Módulo: 🛒 Compras (remodelación de Insumos)
 * Versión: 1.1.0.7
 * Build: 20261008.190500
 * Objetivo: Empresas, productos, presentaciones, lista manual, carritos, compras e historiales.
 *
 * Regla V1:
 * - Empresas reutilizan psr_market_clients / Mapa como fuente de 🏪 Tienda.
 * - Productos y presentaciones son globales; no pertenecen a una empresa.
 * - El precio pertenece al vínculo presentación + empresa.
 * - No existe check-in ni checkout.
 * - Cada empresa tiene su propio carrito; pueden existir varios carritos abiertos.
 * - No se crea psr_compras_*: carritos, eventos y lista viven en psr_settings.
 */

import { renderPhotoPicker, movePhotos, getPhotos, deletePhotosForEntity } from "../../../core/media/fotos.js";

import {
  getProducts,
  getCategories,
  categoryById,
  createCategory,
  updateCategory,
  deactivateCategory,
  deleteCategory,
  productsForCategory,
  getPresentations,
  getAllPresentations,
  productById,
  presentationById,
  presentationsForProduct,
  getPlaces,
  placeById,
  upsertPlace,
  deletePlace,
  addObservation,
  getObservations,
  deleteObservation,
  latestPriceForPresentationPlace,
  pricesForPresentation,
  createProduct,
  updateProduct,
  deactivateProduct,
  deleteProduct,
  createPresentation,
  updatePresentation,
  deactivatePresentation,
  deletePresentation,
  calculateComparable,
  pricesForProduct,
  pricesForCategory,
  pricesForPlace,
  addPurchase,
  getPurchases,
  deletePurchase,
  normalize,
  uid
} from "../mercado-store.js";

const root = document.getElementById("app");
const SETTINGS_KEY = "psr_settings";
const CARTS_SETTING = "comprasCarritos";
const NEEDS_SETTING = "comprasLista";
const EVENTS_SETTING = "comprasHistorialEventos";
const BUYERS = ["Ambos", "Martha", "Fara", "Otro"];

let state = {
  screen: "home",
  companyId: null,
  productId: null,
  categoryId: null,
  presentationId: null,
  companySearch: "",
  productSearch: "",
  listSearch: "",
  purchasesPage: 1,
  eventsPage: 1,
  priceHistoryPage: 1,
  listReturnScreen: "home",
  topPeriod: "all"
};

const esc = value => String(value ?? "")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#039;");

function readSettings(){
  try { const value=JSON.parse(localStorage.getItem(SETTINGS_KEY)); return value&&typeof value==="object"&&!Array.isArray(value)?value:{}; }
  catch { return {}; }
}
function writeSettings(settings){ localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings)); }
function setting(key,fallback){ const s=readSettings(); return s[key]??fallback; }
function saveSetting(key,value){ const s=readSettings(); s[key]=value; writeSettings(s); }

function getCarts(){ const carts=setting(CARTS_SETTING,{}); return carts&&typeof carts==="object"&&!Array.isArray(carts)?carts:{}; }
function saveCarts(carts){ saveSetting(CARTS_SETTING,carts); }
function cartFor(companyId){ const c=getCarts(); return Array.isArray(c[companyId])?c[companyId]:[]; }
function setCart(companyId,items){ const c=getCarts(); if(items.length)c[companyId]=items; else delete c[companyId]; saveCarts(c); }
function openCartEntries(){ return Object.entries(getCarts()).map(([companyId,items])=>({companyId,items,company:placeById(companyId)})).filter(x=>x.company&&x.items?.length); }
function openCartCount(){ return openCartEntries().length; }
function cartTotal(items){ return items.reduce((s,i)=>s+Number(i.precio||0)*Number(i.cantidad||1),0); }
function latestPrice(presentationId,companyId){ return latestPriceForPresentationPlace(presentationId,companyId); }

function activeStores(){
  return getPlaces().filter(p=>p.estatus!=="inactivo" && !["cliente","prospecto"].includes(normalize(p.tipo)));
}
function storeTypeLabel(tipo){
  const map={Tienda:"🏪 Tienda",Supermercado:"🛒 Supermercado",Mayorista:"📦 Mayorista",Mercado:"🥬 Mercado",Distribuidor:"🚚 Distribuidor",Otro:"🏢 Otro"};
  return map[tipo]||`🏪 ${tipo||"Tienda"}`;
}

function migrateCompraSettings(){
  const settings=readSettings();
  let changed=false;
  const migrations=[
    ["comprasCarritosV1",CARTS_SETTING,{}],
    ["comprasListaV1",NEEDS_SETTING,[]],
    ["comprasHistorialEventosV1",EVENTS_SETTING,[]]
  ];
  for(const [oldKey,newKey,empty] of migrations){
    if(settings[oldKey]===undefined) continue;
    const oldValue=settings[oldKey];
    const current=settings[newKey];
    if(newKey===CARTS_SETTING){
      settings[newKey]={...(oldValue&&typeof oldValue==='object'?oldValue:{}),...(current&&typeof current==='object'?current:{})};
    }else{
      const currentRows=Array.isArray(current)?current:[];
      const oldRows=Array.isArray(oldValue)?oldValue:[];
      const map=new Map(currentRows.map(x=>[String(x?.id),x]));
      oldRows.forEach(x=>{if(x&&x.id&&!map.has(String(x.id)))map.set(String(x.id),x);});
      settings[newKey]=[...map.values()];
    }
    delete settings[oldKey];
    changed=true;
  }
  if(changed) writeSettings(settings);
}

migrateCompraSettings();
function events(){ return setting(EVENTS_SETTING,[]); }
function logEvent(tipo,detalle){
  const rows=events(); rows.unshift({id:uid(),fecha:new Date().toISOString(),tipo,detalle}); saveSetting(EVENTS_SETTING,rows.slice(0,1000));
}
function formatDate(value){ try{return new Date(value).toLocaleString("es-MX",{dateStyle:"short",timeStyle:"short"});}catch{return value||"";} }
function money(v){return `$${Number(v||0).toFixed(2)}`;}

function header(title,back){
  return `<header class="compras-header ${back?"has-back":"no-back"}">
    ${back?`<button class="icon-btn" id="backBtn" aria-label="Regresar">←</button>`:""}
    <div class="header-title"><h1>${title}</h1></div>
    <button class="cart-indicator ${openCartCount()?"has-carts":""}" id="openCartsTop" title="Carritos abiertos">🛒${openCartCount()?`<b>${openCartCount()}</b>`:""}</button>
  </header>`;
}

function homeView(){
  const stores=activeStores().filter(p=>!state.companySearch||normalize(p.nombre).includes(normalize(state.companySearch))||normalize(p.direccion).includes(normalize(state.companySearch)));
  const carts=openCartEntries();
  const purchases=getPurchases();
  const totals=BUYERS.map(b=>({buyer:b,total:purchases.filter(p=>(p.comprador||"Fara")===b).reduce((s,p)=>s+Number(p.total||0),0)}));
  return `${header("Compras",false)}
    ${carts.length?`<button class="open-carts-banner" id="openCartsBanner"><span>🛒</span><span><strong>${carts.length} carrito${carts.length===1?'':'s'} abierto${carts.length===1?'':'s'}</strong><small>${carts.map(c=>esc(c.company.nombre)).join(" · ")}</small></span><span>→</span></button>`:""}
    <section class="home-tools">
      <div class="search-wrap"><span>🔎</span><input id="companySearch" value="${esc(state.companySearch)}" placeholder="Buscar empresa..."></div>
      <div class="tool-row"><button class="action-btn" id="listBtn">📝 Lista</button><button class="action-btn primary" id="newCompanyBtn">＋ Empresa</button></div>
    </section>
    <section class="summary-grid">
      <button class="summary-card" id="purchasesHistoryBtn"><strong>🧾</strong><span>Historial de compras</span><small>${purchases.length} registros</small></button>
      <button class="summary-card" id="eventsHistoryBtn"><strong>🕘</strong><span>Historial de eventos</span><small>${events().length} eventos</small></button>
    </section>
    <section class="buyer-total-grid">
      ${totals.map(x=>`<div class="buyer-card"><span>${esc(x.buyer)}</span><strong>${money(x.total)}</strong><small>Total comprado</small></div>`).join("")}
    </section>
    <section class="section-head"><h2>🏪 Empresas</h2><span>${stores.length}</span></section>
    <section class="company-grid">${stores.map(storeCard).join("")||`<div class="empty-card">${state.companySearch?"No se encontraron empresas.":"No hay tiendas registradas todavía."}<br><button class="text-btn" id="newCompanyEmpty">＋ Crear empresa</button></div>`}</section>`;
}
function storeCard(p){
  const cart=cartFor(p.id);
  return `<div class="company-card-wrap" data-company-card-name="${esc(p.nombre)}"><button class="company-card" data-company="${esc(p.id)}"><span class="company-icon">🏪</span><strong>${esc(p.nombre)}</strong><small>${esc(storeTypeLabel(p.tipo))}</small><span class="photo-indicator" data-photo-indicator="empresa:${esc(p.id)}" aria-hidden="true"></span>${cart.length?`<em>🛒 ${cart.length}</em>`:""}</button><div class="entity-actions"><button data-edit-company="${esc(p.id)}" title="Editar">✏️</button><button data-toggle-company="${esc(p.id)}" title="Desactivar">${p.estatus==='inactivo'?'🔄':'⏸️'}</button><button data-delete-company="${esc(p.id)}" title="Borrar">🗑️</button></div></div>`;
}

function listView(){
  const needs=setting(NEEDS_SETTING,[]);
  const filtered=needs.filter(n=>!state.listSearch||normalize(n.nombre).includes(normalize(state.listSearch)));
  const carts=openCartEntries();
  const cartProductIds=new Set(carts.flatMap(c=>c.items.map(i=>String(i.productId))));
  return `${header("📝 Lista",true)}<section class="list-screen"><p class="muted">Esta es tu lista personal de lo que necesitas. Aquí agregas manualmente lo que vas requiriendo.</p><div class="search-wrap"><span>🔎</span><input id="listSearch" value="${esc(state.listSearch)}" placeholder="Buscar en mi lista..."></div><div class="need-list">${filtered.map(n=>`<div class="need-row" data-need-name="${esc(n.nombre)}"><button class="need-check ${cartProductIds.has(String(n.productId))?'checked':''}" data-toggle-need="${esc(n.id)}">${cartProductIds.has(String(n.productId))?'✓':''}</button><span>${esc(n.nombre)}</span><button class="mini-danger" data-delete-need="${esc(n.id)}">×</button></div>`).join("")||`<div class="empty-card">Tu lista está vacía.</div>`}</div><button class="wide-action" id="addNeedBtn">＋ Agregar producto</button></section>`;
}

function categoryView(){
  const company=placeById(state.companyId); if(!company){state.screen="home";return homeView();}
  const category=categoryById(state.categoryId); if(!category){state.screen="company";return companyView();}
  const products=productsForCategory(category.id).filter(p=>!state.productSearch||normalize(p.nombre).includes(normalize(state.productSearch)));
  return `${header(`📂 ${esc(category.nombre)}`,true)}<div class="context-line">🏪 ${esc(company.nombre)}</div>
    <section class="company-tools"><div class="search-wrap"><span>🔎</span><input id="productSearch" value="${esc(state.productSearch)}" placeholder="Buscar producto..."></div></section>
    <section class="entity-toolbar"><button data-category-history="${esc(category.id)}">📜 Historial categoría</button><button data-edit-category="${esc(category.id)}">✏️ Editar categoría</button><button data-toggle-category="${esc(category.id)}">⏸️ Desactivar</button><button data-delete-category="${esc(category.id)}">🗑️ Eliminar todo</button></section>
    <section class="section-head"><h2>🥛 Productos</h2><span>${products.length}</span></section><div class="category-add-product"><button class="action-btn primary" id="addProductBtn">＋ Producto</button></div><section class="product-grid">${products.map(productCard).join("")||`<div class="empty-card">No hay productos en esta categoría.</div>`}</section>`;
}
function companyView(){
  const company=placeById(state.companyId); if(!company){state.screen="home";return homeView();}
  const q=normalize(state.productSearch); const categories=getCategories().filter(c=>!q||normalize(c.nombre).includes(q)||productsForCategory(c.id).some(p=>normalize(p.nombre).includes(q)));
  const cart=cartFor(company.id);
  const purchased=getPurchases().filter(p=>String(p.clienteId)===String(company.id)).reduce((s,p)=>s+Number(p.total||0),0);
  return `${header(`🏪 ${esc(company.nombre)}`,true)}<div class="context-line">${esc(storeTypeLabel(company.tipo))}${company.direccion?` · ${esc(company.direccion)}`:""}</div>
    <div class="company-kpi"><span>💰 Total comprado en esta empresa</span><strong>${money(purchased)}</strong></div><div id="companyPhotos"></div>
    <section class="company-tools"><div class="search-wrap"><span>🔎</span><input id="productSearch" value="${esc(state.productSearch)}" placeholder="Buscar producto o categoría..."></div><div class="tool-grid"><button class="action-btn" id="addCategoryBtn">＋ Categoría</button><button class="action-btn" id="addProductBtn">＋ Producto</button><button class="action-btn" id="companyListBtn">📝 Lista</button><button class="action-btn" id="calculatorBtn">🧮 Calculadora</button><button class="action-btn primary" id="cartBtn">🛒 Carrito${cart.length?` (${cart.length})`:""}</button></div></section>
    <section class="entity-toolbar"><button data-store-history="${esc(company.id)}">📜 Historial tienda</button><button data-edit-company="${esc(company.id)}">✏️ Editar empresa</button><button data-toggle-company="${esc(company.id)}">${company.estatus==='inactivo'?'🔄 Activar':'⏸️ Desactivar'}</button><button data-delete-company="${esc(company.id)}">🗑️ Borrar</button></section>
    <section class="section-head"><h2>📂 Categorías</h2><span>${categories.length}</span></section><section class="category-grid">${categories.map(c=>categoryCard(c)).join("")||`<div class="empty-card">No hay categorías registradas.</div>`}</section>`;
}
function categoryCard(c){
  const count=productsForCategory(c.id).length;
  return `<div class="category-card-wrap" data-category-card-name="${esc(c.nombre)}"><button class="category-card" data-category="${esc(c.id)}"><span>📂</span><strong>${esc(c.nombre)}</strong><small>${count} ${count===1?'producto':'productos'}</small><span class="photo-indicator" data-photo-indicator="categoria:${esc(c.id)}" aria-hidden="true"></span></button><div class="entity-actions"><button data-edit-category="${esc(c.id)}">✏️</button><button data-toggle-category="${esc(c.id)}">⏸️</button><button data-delete-category="${esc(c.id)}">🗑️</button></div></div>`;
}

function productCard(p){
  const count=presentationsForProduct(p.id).length;
  return `<div class="product-card-wrap" data-product-card-name="${esc(p.nombre)}"><button class="product-card" data-product="${esc(p.id)}"><span>📦</span><strong>${esc(p.nombre)}</strong><small>${count} ${count===1?'presentación':'presentaciones'}</small><span class="photo-indicator" data-photo-indicator="producto:${esc(p.id)}" aria-hidden="true"></span></button><div class="entity-actions"><button data-edit-product="${esc(p.id)}">✏️</button><button data-toggle-product="${esc(p.id)}">⏸️</button><button data-delete-product="${esc(p.id)}">🗑️</button></div></div>`;
}
function periodStart(key){
  if(key==='all')return null;
  const d=new Date();
  const days={year:365,month6:180,month3:90,month1:30,days15:15,days7:7}[key]||0;
  d.setDate(d.getDate()-days);return d;
}
function topFiveForProduct(productId){
  const start=periodStart(state.topPeriod);const productPrices=pricesForProduct(productId);const best=[];const seen=new Set();
  for(const r of productPrices){const dt=new Date(r.priceDate||r.createdAt);if(start&&dt<start)continue;const pres=presentationById(r.presentationId);const place=placeById(r.clienteId);if(!pres||!place)continue;const cmp=calculateComparable(r.precio,r.contenidoTotal??pres.contenidoTotal,r.unidad??pres.unidad);if(!cmp)continue;const key=`${r.presentationId}|${r.clienteId}`;if(seen.has(key))continue;seen.add(key);best.push({r,pres,place,cmp});}
  return best.sort((a,b)=>a.cmp.valor-b.cmp.valor).slice(0,5);
}
function productTopFiveHtml(productId){
  const rows=topFiveForProduct(productId);return `<section class="top5-box"><div class="top5-head"><div><strong>🏆 Top 5 mejores precios</strong><small>Comparación por ${esc((presentationById(rows[0]?.r.presentationId)?.unidad||'unidad').toUpperCase())}</small></div><select id="topPeriod"><option value="all" ${state.topPeriod==='all'?'selected':''}>Histórico</option><option value="year" ${state.topPeriod==='year'?'selected':''}>1 año</option><option value="month6" ${state.topPeriod==='month6'?'selected':''}>6 meses</option><option value="month3" ${state.topPeriod==='month3'?'selected':''}>3 meses</option><option value="month1" ${state.topPeriod==='month1'?'selected':''}>1 mes</option><option value="days15" ${state.topPeriod==='days15'?'selected':''}>15 días</option><option value="days7" ${state.topPeriod==='days7'?'selected':''}>7 días</option></select></div><div class="top5-list">${rows.map((x,i)=>`<div class="top5-row"><span class="top5-rank">${['🥇','🥈','🥉','4','5'][i]}</span><div><strong>${esc(x.pres.nombre)}</strong><small>${esc(x.place.nombre)} · ${formatDate(x.r.priceDate||x.r.createdAt).split(',')[0]}</small></div><div class="top5-values"><b>${money(x.r.precio)}</b><small>${money(x.cmp.valor)} ${esc(x.cmp.label.replace('$/','/'))}</small></div></div>`).join('')||`<div class="muted">No hay precios comparables en este periodo.</div>`}</div></section>`;
}
function productModal(productId){
  state.productId=productId;
  const product=productById(productId); if(!product)return;
  const company=placeById(state.companyId);
  const rows=pricesForProduct(productId).map(r=>{const pres=presentationById(r.presentationId),place=placeById(r.clienteId),cmp=calculateComparable(r.precio,r.contenidoTotal??pres?.contenidoTotal,r.unidad??pres?.unidad);return {r,pres,place,cmp};}).filter(x=>x.pres&&x.place);
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box presentation-modal"><div class="modal-head"><div><h2>📦 ${esc(product.nombre)}</h2><small>${esc(categoryById(product.categoryId)?.nombre||'Sin categoría')} · todas las tiendas</small></div><button class="close-btn" data-close>×</button></div><div class="product-mode-bar"><button class="action-btn" id="toggleProductEditMode">✏️ Editar / borrar</button></div>${productTopFiveHtml(productId)}<h3 class="subsection-title">📊 Presentaciones y precios</h3><div class="comparison-list">${rows.map(x=>`<div class="comparison-row" data-presentation-row="${esc(x.pres.id)}"><div><strong>${esc(x.pres.nombre)}</strong><small>${esc(x.place.nombre)} · ${formatDate(x.r.priceDate||x.r.createdAt).split(',')[0]}${x.r.oferta?` · 🏷️ ${esc(x.r.oferta)}`:''}</small></div><div><b>${money(x.r.precio)}</b><small>${x.cmp?`${money(x.cmp.valor)} ${esc(x.cmp.label.replace('$/','/'))}`:'Sin comparación'}</small></div><div class="comparison-actions"><button class="photo-action" data-photo-presentation="${esc(x.pres.id)}" title="Ver fotografías" aria-label="Ver fotografías">📷</button><button data-presentation="${esc(x.pres.id)}" title="Abrir presentación">→</button><button class="edit-row-action" data-edit-presentation="${esc(x.pres.id)}" title="Editar presentación" aria-label="Editar presentación">✏️</button><button class="delete-row-action" data-delete-price="${esc(x.r.id)}" data-price-source="${esc(x.r.source||'mercado')}" title="Eliminar este registro de precio" aria-label="Eliminar este registro de precio">×</button></div></div>`).join('')||`<div class="empty-card">Este producto todavía no tiene precios registrados.</div>`}</div><div class="modal-actions split"><button class="btn secondary" data-new-presentation>＋ Nueva presentación</button><button class="btn secondary" data-close>Cerrar</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("[data-new-presentation]").onclick=()=>{modal.remove();newPresentationModal(productId);};
  modal.querySelectorAll('[data-presentation]').forEach(b=>b.onclick=()=>{modal.remove();presentationDetail(productId,b.dataset.presentation);});
  modal.querySelectorAll('[data-photo-presentation]').forEach(b=>b.onclick=()=>{modal.remove();presentationDetail(productId,b.dataset.photoPresentation);});
  modal.querySelectorAll('[data-photo-presentation]').forEach(async b=>{try{const photos=await getPhotos('presentacion',b.dataset.photoPresentation);if(document.body.contains(b)){b.dataset.hasPhoto=photos.length?'1':'0';b.style.visibility=photos.length?'visible':'hidden';}}catch{}});
  modal.querySelector('#toggleProductEditMode').onclick=()=>{
    const editing=modal.classList.toggle('edit-mode');
    modal.querySelector('#toggleProductEditMode').textContent=editing?'✓ Terminar edición':'✏️ Editar / borrar';
    modal.querySelectorAll('.comparison-actions').forEach(box=>{
      const photo=box.querySelector('.photo-action'), arrow=box.querySelector('[data-presentation]'), edit=box.querySelector('.edit-row-action'), del=box.querySelector('.delete-row-action');
      if(editing){if(photo)photo.style.visibility='hidden';if(arrow)arrow.style.visibility='hidden';if(edit)edit.style.visibility='visible';if(del)del.style.visibility='visible';}
      else{if(photo)photo.style.visibility=photo.dataset.hasPhoto==='1'?'visible':'hidden';if(arrow)arrow.style.visibility='visible';if(edit)edit.style.visibility='hidden';if(del)del.style.visibility='hidden';}
    });
  };
  modal.querySelector('#topPeriod')?.addEventListener('change',e=>{state.topPeriod=e.target.value;modal.remove();productModal(productId);});
  bindEntityActions(modal);
}
function formatContent(value,unit){const u=normalize(unit);if(u==='g')return `${(value/1000).toFixed(2)} kg`;if(u==='ml')return `${(value/1000).toFixed(2)} L`;return `${Number(value).toFixed(2)} ${unit}`;}

function newCategoryModal(){
  const photoDraftId=uid();
  const modal=document.createElement('div');modal.className='modal visible';
  modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>＋ Nueva categoría</h2><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="categoryName" class="modal-input" placeholder="Ej. Abarrotes"><div id="categoryFormPhotos"></div><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveCategory">Guardar</button></div></div>`;
  document.body.appendChild(modal);
  renderPhotoPicker({container:modal.querySelector('#categoryFormPhotos'),entityType:'categoria',entityId:photoDraftId,label:'Fotografías'});
  modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector('#categoryName').focus();
  modal.querySelector('#saveCategory').onclick=async()=>{const nombre=modal.querySelector('#categoryName').value.trim();if(!nombre)return alert('Escribe el nombre.');try{const c=createCategory({nombre});await movePhotos('categoria',photoDraftId,c.id);logEvent('Categoría añadida',nombre);modal.remove();render();}catch(e){alert(e.message);}};
}
function editCategoryModal(id){
  const c=categoryById(id);if(!c)return;
  const modal=document.createElement('div');modal.className='modal visible';
  modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>✏️ Editar categoría</h2><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="editCategoryName" class="modal-input" value="${esc(c.nombre)}"><div id="categoryFormPhotos"></div><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveEditCategory">Guardar</button></div></div>`;
  document.body.appendChild(modal);
  renderPhotoPicker({container:modal.querySelector('#categoryFormPhotos'),entityType:'categoria',entityId:c.id,label:'Fotografías'});
  modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector('#saveEditCategory').onclick=()=>{const nombre=modal.querySelector('#editCategoryName').value.trim();if(!nombre)return alert('Escribe el nombre.');try{updateCategory(id,{nombre});logEvent('Categoría editada',`${c.nombre} → ${nombre}`);modal.remove();render();}catch(e){alert(e.message);}};
}
function newProductModal(){
  const photoDraftId=uid();
  const modal=document.createElement("div");modal.className="modal visible";
  const currentCategoryId=state.categoryId||"";
  modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>＋ Nuevo producto</h2><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="newProductName" class="modal-input" placeholder="Ej. Leche"><label>Categoría *</label><select id="newProductCategory" class="modal-input">${getCategories().map(c=>`<option value="${esc(c.id)}" ${String(c.id)===String(currentCategoryId)?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select><div id="productFormPhotos"></div><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveProduct">Guardar</button></div></div>`;
  document.body.appendChild(modal);
  renderPhotoPicker({container:modal.querySelector('#productFormPhotos'),entityType:'producto',entityId:photoDraftId,label:'Fotografías'});
  modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("#newProductName").focus();
  modal.querySelector("#saveProduct").onclick=async()=>{const nombre=modal.querySelector("#newProductName").value.trim();const categoryId=modal.querySelector("#newProductCategory")?.value||state.categoryId||"";if(!nombre)return alert("Escribe el nombre.");if(!categoryId)return alert("Selecciona una categoría.");try{const p=createProduct({nombre,categoryId});await movePhotos('producto',photoDraftId,p.id);logEvent("Producto añadido",`${nombre} · ${categoryById(categoryId)?.nombre||"Sin categoría"}`);modal.remove();state.productSearch="";render();}catch(e){alert(e.message);}};
}
function newNeedModal(){
  const products=getProducts().filter(p=>p.active!==false);
  const modal=document.createElement("div");
  modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box small-modal">
    <div class="modal-head"><h2>📝 Agregar a mi lista</h2><button class="close-btn" data-close>×</button></div>
    <label>Buscar producto existente</label>
    <input id="needName" class="modal-input" autocomplete="off" placeholder="Ej. Nutella">
    <div id="needSuggestions" class="need-suggestions"></div>
    <div id="needCreateArea" class="need-create-area" style="display:none">
      <p class="muted">No encontré un producto con ese nombre.</p>
      <button class="btn secondary" id="createNeedProduct">＋ Crear producto nuevo</button>
    </div>
    <p class="muted">Selecciona un producto existente para evitar duplicados. Solo crea uno nuevo si realmente no existe.</p>
  </div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());

  const input=modal.querySelector("#needName");
  const suggestions=modal.querySelector("#needSuggestions");
  const createArea=modal.querySelector("#needCreateArea");
  const needs=setting(NEEDS_SETTING,[]);

  const addNeed=(product)=>{
    if(needs.some(n=>String(n.productId)===String(product.id))){
      return alert(`${product.nombre} ya está en tu lista.`);
    }
    const current=setting(NEEDS_SETTING,[]);
    current.push({id:uid(),productId:product.id,nombre:product.nombre,createdAt:new Date().toISOString()});
    saveSetting(NEEDS_SETTING,current);
    logEvent("Necesidad añadida",product.nombre);
    modal.remove();
    render();
  };

  const renderSuggestions=()=>{
    const q=normalize(input.value);
    const matches=products.filter(p=>!q||normalize(p.nombre).includes(q)).slice(0,12);
    suggestions.innerHTML=matches.map(p=>`<button type="button" class="need-suggestion" data-product-choice="${esc(p.id)}"><span>📦</span><strong>${esc(p.nombre)}</strong></button>`).join("");
    suggestions.querySelectorAll("[data-product-choice]").forEach(b=>b.onclick=()=>{
      const product=products.find(p=>String(p.id)===String(b.dataset.productChoice));
      if(product)addNeed(product);
    });
    const exact=products.find(p=>normalize(p.nombre)===q);
    createArea.style.display=q&&!exact?"block":"none";
  };

  input.addEventListener("input",renderSuggestions);
  modal.querySelector("#createNeedProduct").onclick=()=>{
    const nombre=input.value.trim();
    if(!nombre)return;
    const existing=getProducts().find(p=>normalize(p.nombre)===normalize(nombre));
    if(existing)return addNeed(existing);
    const currentNeeds=setting(NEEDS_SETTING,[]);
    if(currentNeeds.some(n=>normalize(n.nombre)===normalize(nombre)))return alert("Ese producto ya está en tu lista.");
    try{
      const categoryId=state.categoryId||getCategories()[0]?.id||"";const product=createProduct({nombre,categoryId});
      logEvent("Producto añadido",nombre);
      addNeed(product);
    }catch(e){alert(e.message);}
  };

  input.focus();
  renderSuggestions();
}
function newPresentationModal(productId){
  const product=productById(productId);if(!product)return;const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>＋ Nueva presentación</h2><button class="close-btn" data-close>×</button></div><small>${esc(product.nombre)}</small><label>Presentación *</label><input id="presentationName" class="modal-input" placeholder="Ej. Santa Clara 6 pack × 940 ml"><label>Precio inicial (opcional)</label><input id="presentationPrice" class="modal-input" type="number" min="0" step="0.01" placeholder="$168"><label>Contenido total</label><div class="form-two"><input id="presentationContent" class="modal-input" type="number" min="0" step="0.001" placeholder="5640"><select id="presentationUnit" class="modal-input"><option value="ml">ml</option><option value="L">L</option><option value="g">g</option><option value="kg">kg</option><option value="unidad">unidad</option><option value="UE">UE</option></select></div><label>Oferta (opcional)</label><input id="presentationOffer" class="modal-input" placeholder="Solo informativo"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="savePresentation">Guardar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());modal.querySelector("#presentationName").focus();modal.querySelector("#savePresentation").onclick=()=>{const nombre=modal.querySelector("#presentationName").value.trim();const content=Number(modal.querySelector("#presentationContent").value);if(!nombre)return alert("Escribe la presentación.");if(!(content>0))return alert("Escribe el contenido total.");try{const presentation=createPresentation({productId,nombre,unidad:modal.querySelector("#presentationUnit").value,contenidoTotal:content,oferta:modal.querySelector("#presentationOffer").value.trim()});const price=Number(modal.querySelector('#presentationPrice').value);if(price>=0&&modal.querySelector('#presentationPrice').value!==''){addObservation({producto:product.nombre,presentacion:nombre,presentationId:presentation.id,precio:price,clienteId:state.companyId,contenidoTotal:content,unidad:modal.querySelector('#presentationUnit').value,oferta:modal.querySelector('#presentationOffer').value.trim()});}logEvent("Presentación añadida",`${product.nombre} · ${nombre}`);modal.remove();productModal(productId);}catch(e){alert(e.message);}};
}

function newCompanyModal(companyId=null,onSaved=null){
  const existing=companyId?placeById(companyId):null;const photoDraftId=existing?.id||uid();const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>${existing?"✏️ Editar empresa":"🏪 Nueva empresa"}</h2><small>Se guarda como 🏪 Tienda compartida con Mapa.</small></div><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="companyName" class="modal-input" value="${esc(existing?.nombre||"")}"><label>Contacto</label><input id="companyContact" class="modal-input" value="${esc(existing?.contacto||existing?.encargado||"")}"><label>Tipo *</label><select id="companyType" class="modal-input">${["Tienda","Supermercado","Mayorista","Mercado","Distribuidor","Otro"].map(t=>`<option ${existing?.tipo===t?'selected':''}>${t}</option>`).join("")}</select><label>Dirección</label><textarea id="companyAddress" class="modal-input" rows="2">${esc(existing?.direccion||"")}</textarea><label>Tienda virtual</label><input id="companyWeb" class="modal-input" type="url" value="${esc(existing?.tiendaVirtual||"")}" placeholder="https://..."><div id="companyFormPhotos"></div><div class="location-box"><div><strong>📍 Ubicación</strong><small id="locationText">${existing?.latitud!=null&&existing?.longitud!=null?`${existing.latitud}, ${existing.longitud}`:"Sin ubicación"}</small></div><button class="btn secondary" id="useLocation">Usar ubicación actual</button></div><input type="hidden" id="companyLat" value="${existing?.latitud??""}"><input type="hidden" id="companyLon" value="${existing?.longitud??""}"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveCompany">Guardar</button></div></div>`;document.body.appendChild(modal);renderPhotoPicker({container:modal.querySelector('#companyFormPhotos'),entityType:'empresa',entityId:existing?.id||photoDraftId,label:'Fotografías'});modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("#useLocation").onclick=()=>{if(!navigator.geolocation)return alert("Este dispositivo no permite obtener ubicación.");const addressField=modal.querySelector("#companyAddress");modal.querySelector("#locationText").textContent="Obteniendo ubicación…";navigator.geolocation.getCurrentPosition(async pos=>{const lat=pos.coords.latitude,lon=pos.coords.longitude;modal.querySelector("#companyLat").value=lat;modal.querySelector("#companyLon").value=lon;modal.querySelector("#locationText").textContent=`${lat.toFixed(6)}, ${lon.toFixed(6)}`;addressField.value="Obteniendo dirección…";try{const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,{headers:{Accept:"application/json"}});if(!response.ok)throw new Error("Geocodificación falló");const data=await response.json();addressField.value=String(data.display_name||"").trim();if(!addressField.value)addressField.value="";}catch(error){console.warn("No fue posible obtener la dirección:",error);addressField.value="";}},()=>alert("No se pudo obtener la ubicación."),{enableHighAccuracy:true,timeout:10000,maximumAge:0});};
  modal.querySelector("#saveCompany").onclick=()=>{const nombre=modal.querySelector("#companyName").value.trim();if(!nombre)return alert("Escribe el nombre.");const p=upsertPlace({id:existing?.id,nombre,contacto:modal.querySelector("#companyContact").value.trim(),encargado:modal.querySelector("#companyContact").value.trim(),tipo:modal.querySelector("#companyType").value,direccion:modal.querySelector("#companyAddress").value.trim(),tiendaVirtual:modal.querySelector("#companyWeb").value.trim(),latitud:modal.querySelector("#companyLat").value?Number(modal.querySelector("#companyLat").value):null,longitud:modal.querySelector("#companyLon").value?Number(modal.querySelector("#companyLon").value):null});if(!existing)movePhotos("empresa",photoDraftId,p.id);logEvent(existing?"Empresa editada":"Empresa añadida",p.nombre);modal.remove();if(onSaved){onSaved(p);return;}if(existing){render();}else{state.companyId=p.id;state.screen="company";state.productSearch="";render();}};
}

function calculatorModal(){
  const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box calculator"><div class="modal-head"><h2>🧮 Calculadora</h2><button class="close-btn" data-close>×</button></div><div class="calc-grid"><div><h3>Producto 1</h3><label>Precio</label><input id="c1p" type="number" min="0" step="0.01" placeholder="100"><label>Número</label><input id="c1n" type="number" min="0.0001" step="0.01" placeholder="1000"><strong>Por unidad <span id="c1u">—</span></strong></div><div><h3>Producto 2</h3><label>Precio</label><input id="c2p" type="number" min="0" step="0.01" placeholder="56"><label>Número</label><input id="c2n" type="number" min="0.0001" step="0.01" placeholder="500"><strong>Por unidad <span id="c2u">—</span></strong></div></div><div class="conversion"><h3>CONVERSIÓN</h3><div id="conv1">Producto 1 —</div><div id="conv2">Producto 2 —</div></div><div class="modal-actions"><button class="btn secondary" data-close>Cerrar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());const calc=()=>{const p1=Number(modal.querySelector("#c1p").value),n1=Number(modal.querySelector("#c1n").value),p2=Number(modal.querySelector("#c2p").value),n2=Number(modal.querySelector("#c2n").value),u1=p1>0&&n1>0?p1/n1:null,u2=p2>0&&n2>0?p2/n2:null;modal.querySelector("#c1u").textContent=u1==null?"—":money(u1).replace("$","$");modal.querySelector("#c2u").textContent=u2==null?"—":money(u2);modal.querySelector("#conv1").textContent=u2!=null?`Producto 1: ${n1} × ${money(u2)} = ${money(n1*u2)} · Diferencia: ${money(n1*u2-p1)}`:"Producto 1 —";modal.querySelector("#conv2").textContent=u1!=null?`Producto 2: ${n2} × ${money(u1)} = ${money(n2*u1)} · Diferencia: ${money(n2*u1-p2)}`:"Producto 2 —";};modal.querySelectorAll("input").forEach(i=>i.oninput=calc);calc();
}

function cartView(){
  const company=placeById(state.companyId),items=cartFor(state.companyId);if(!company){state.screen="home";return homeView();}
  return `${header(`🛒 Carrito · ${esc(company.nombre)}`,true)}<div class="context-line">Este carrito queda abierto hasta que lo cierres o registres la compra.</div><section class="cart-list">${items.map(item=>{const cmp=calculateComparable(item.precio,item.contenidoTotal,item.unidad);const totalContent=Number(item.contenidoTotal||0)*Number(item.cantidad||0);return `<div class="cart-row"><div><strong>${esc(item.presentacion)}</strong><small>${esc(item.producto)} · ${esc(item.comprador||"Fara")}${item.comprador==="Otro"&&item.compradorNombre?` (${esc(item.compradorNombre)})`:""}${cmp&&totalContent?` · ${formatContent(totalContent,item.unidad)}`:""}${item.cantidadDeseada?` · pedido: ${esc(item.cantidadDeseada)} ${esc(item.unidadDeseada||'')}`:""}</small></div><div class="cart-qty"><input type="number" min="0.01" step="0.01" value="${item.cantidad}" data-qty="${esc(item.id)}"><strong>${money(Number(item.precio)*Number(item.cantidad))}</strong></div><button class="icon-danger" data-remove-cart="${esc(item.id)}">×</button></div>`}).join("")||`<div class="empty-card">Este carrito está vacío.</div>`}</section><div class="cart-total"><span>Total estimado</span><strong>${money(cartTotal(items))}</strong></div><div class="cart-actions"><button class="action-btn primary" id="registerPurchaseBtn" ${items.length?'':'disabled'}>🧾 Registrar compra</button><button class="action-btn danger-outline" id="closeCartBtn" ${items.length?'':'disabled'}>🔒 Cerrar carrito</button></div>`;
}

function openCartsModal(){
  const entries=openCartEntries(),modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>🛒 Carritos abiertos</h2><button class="close-btn" data-close>×</button></div><div class="open-cart-list">${entries.map(c=>`<button class="open-cart-row" data-open-cart="${esc(c.companyId)}"><span>🏪</span><span><strong>${esc(c.company.nombre)}</strong><small>${c.items.length} productos · ${money(cartTotal(c.items))}</small></span><span>→</span></button>`).join("")||`<div class="empty-card">No hay carritos abiertos.</div>`}</div></div>`;document.body.appendChild(modal);modal.querySelector("[data-close]").onclick=()=>modal.remove();modal.querySelectorAll("[data-open-cart]").forEach(b=>b.onclick=()=>{state.companyId=b.dataset.openCart;state.screen="cart";modal.remove();render();});
}

function pageSlice(rows,page){
  const totalPages=Math.max(1,Math.ceil(rows.length/10));
  const safe=Math.min(Math.max(1,page),totalPages);
  return {rows:rows.slice((safe-1)*10,safe*10),page:safe,totalPages};
}

function paginationHtml(page,totalPages,prefix){
  return `<div class="pagination"><button class="btn secondary" data-page-prev="${prefix}" ${page<=1?'disabled':''}><< Prev.</button><span>${page} / ${totalPages}</span><button class="btn secondary" data-page-next="${prefix}" ${page>=totalPages?'disabled':''}>Sig. >></button></div>`;
}

function purchaseCompanyLabel(p){
  return p.clienteId ? (placeById(p.clienteId)?.nombre || p.tienda || "Empresa no encontrada") : (p.tienda || "Sin empresa");
}

function scopeHistoryModal(type,id){
  let rows=[];let title='';
  if(type==='store'){rows=pricesForPlace(id);title=`🏪 Historial · ${placeById(id)?.nombre||'Tienda'}`;}
  if(type==='category'){rows=pricesForCategory(id);title=`📂 Historial · ${categoryById(id)?.nombre||'Categoría'}`;}
  rows=rows.slice().sort((a,b)=>new Date(b.priceDate||b.createdAt)-new Date(a.priceDate||a.createdAt));
  const modal=document.createElement('div');modal.className='modal visible';modal.innerHTML=`<div class="modal-box history-modal"><div class="modal-head"><h2>${title}</h2><button class="close-btn" data-close>×</button></div><div class="history-list">${rows.map(r=>{const pr=presentationById(r.presentationId),prod=pr?productById(pr.productId):null,cmp=calculateComparable(r.precio,r.contenidoTotal??pr?.contenidoTotal,r.unidad??pr?.unidad);return `<div class="history-row"><div><strong>${esc(prod?.nombre||r.producto)} · ${esc(pr?.nombre||r.presentacion||'Sin presentación')}</strong><small>${esc(r.tienda||placeById(r.clienteId)?.nombre||'')} · ${formatDate(r.priceDate||r.createdAt)}${r.oferta?` · 🏷️ ${esc(r.oferta)}`:''}</small></div><div class="history-value"><strong>${money(r.precio)}</strong><small>${cmp?`${money(cmp.valor)} ${esc(cmp.label.replace('$/','/'))}`:''}</small></div></div>`;}).join('')||'<div class="empty-card">No hay movimientos registrados.</div>'}</div></div>`;document.body.appendChild(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();
}

function purchasesHistoryModal(){
  const rows=getPurchases().slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const pg=pageSlice(rows,state.purchasesPage); state.purchasesPage=pg.page;
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box history-modal"><div class="modal-head"><h2>🧾 Historial de compras</h2><button class="close-btn" data-close>×</button></div><div class="history-toolbar"><button class="btn" id="newPurchaseFromHistory">＋ Registrar compra</button></div><div class="history-list">${pg.rows.map(p=>`<div class="history-row"><div><strong>${esc(p.producto)} · ${esc(p.presentacion||"Sin presentación")}</strong><small>${formatDate(p.fecha)} · ${esc(purchaseCompanyLabel(p))} · ${esc(p.comprador||"Fara")}${p.comprador==="Otro"&&p.compradorNombre?` (${esc(p.compradorNombre)})`:""} · ${esc(p.cantidad)} × ${money(p.precio)}</small></div><div class="history-value"><strong>${money(p.total)}</strong><span class="history-actions"><button class="mini-edit" data-edit-purchase="${esc(p.id)}">✏️</button><button class="mini-edit danger-mini" data-delete-purchase="${esc(p.id)}">🗑️</button></span></div></div>`).join("")||`<div class="empty-card">No hay compras registradas.</div>`}</div>${paginationHtml(pg.page,pg.totalPages,'purchases')}</div>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close]").onclick=()=>modal.remove();
  modal.querySelector("#newPurchaseFromHistory").onclick=()=>{modal.remove();newPurchaseModal();};
  modal.querySelectorAll("[data-edit-purchase]").forEach(b=>b.onclick=()=>{modal.remove();editPurchaseModal(b.dataset.editPurchase);});
  modal.querySelectorAll("[data-delete-purchase]").forEach(b=>b.onclick=()=>{const purchase=getPurchases().find(x=>String(x.id)===String(b.dataset.deletePurchase));if(!purchase)return;if(!confirm(`¿Borrar la compra de ${purchase.producto}?`))return;deletePurchase(purchase.id);logEvent("Compra borrada",`${purchase.producto} · ${purchase.tienda||"Sin empresa"}`);modal.remove();purchasesHistoryModal();});
  modal.querySelector("[data-page-prev]")?.addEventListener("click",()=>{state.purchasesPage--;modal.remove();purchasesHistoryModal();});
  modal.querySelector("[data-page-next]")?.addEventListener("click",()=>{state.purchasesPage++;modal.remove();purchasesHistoryModal();});
}

function editEventModal(id){
  const event=events().find(x=>String(x.id)===String(id)); if(!event)return;
  const localDate=new Date(event.fecha);
  const pad=n=>String(n).padStart(2,"0");
  const dateValue=Number.isNaN(localDate.getTime())?"":`${localDate.getFullYear()}-${pad(localDate.getMonth()+1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h2>✏️ Editar evento</h2><button class="close-btn" data-close>×</button></div><label>Evento *</label><input id="eventType" class="modal-input" value="${esc(event.tipo)}"><label>Detalle</label><textarea id="eventDetail" class="modal-input" rows="3">${esc(event.detalle||"")}</textarea><label>Fecha y hora</label><input id="eventDate" class="modal-input" type="datetime-local" value="${dateValue}"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveEvent">Guardar cambios</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("#saveEvent").onclick=()=>{
    const tipo=modal.querySelector("#eventType").value.trim();
    const detalle=modal.querySelector("#eventDetail").value.trim();
    const fechaInput=modal.querySelector("#eventDate").value;
    if(!tipo)return alert("Escribe el tipo de evento.");
    const fecha=fechaInput?new Date(fechaInput).toISOString():event.fecha;
    const rows=events().map(x=>String(x.id)===String(id)?{...x,tipo,detalle,fecha}:x);
    saveSetting(EVENTS_SETTING,rows);
    modal.remove(); eventsHistoryModal();
  };
}

function eventsHistoryModal(){
  const rows=events().slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const pg=pageSlice(rows,state.eventsPage); state.eventsPage=pg.page;
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box history-modal"><div class="modal-head"><h2>🕘 Historial de eventos</h2><button class="close-btn" data-close>×</button></div><div class="history-list">${pg.rows.map(e=>`<div class="history-row"><div><strong>${esc(e.tipo)}</strong><small>${formatDate(e.fecha)}</small></div><div class="history-value"><span>${esc(e.detalle)}</span><span class="history-actions"><button class="mini-edit" data-edit-event="${esc(e.id)}">✏️</button><button class="mini-edit danger-mini" data-delete-event="${esc(e.id)}">🗑️</button></span></div></div>`).join("")||`<div class="empty-card">No hay eventos registrados.</div>`}</div>${paginationHtml(pg.page,pg.totalPages,'events')}</div>`;
  document.body.appendChild(modal); modal.querySelector("[data-close]").onclick=()=>modal.remove();
  modal.querySelectorAll("[data-edit-event]").forEach(b=>b.onclick=()=>{modal.remove();editEventModal(b.dataset.editEvent);});
  modal.querySelectorAll("[data-delete-event]").forEach(b=>b.onclick=()=>{const event=events().find(x=>String(x.id)===String(b.dataset.deleteEvent));if(!event)return;if(!confirm(`¿Borrar el evento «${event.tipo}»?`))return;saveSetting(EVENTS_SETTING,events().filter(x=>String(x.id)!==String(event.id)));modal.remove();eventsHistoryModal();});
  modal.querySelector("[data-page-prev]")?.addEventListener("click",()=>{state.eventsPage--;modal.remove();eventsHistoryModal();});
  modal.querySelector("[data-page-next]")?.addEventListener("click",()=>{state.eventsPage++;modal.remove();eventsHistoryModal();});
}

function priceHistoryModal(presentationId){
  const presentation=presentationById(presentationId); if(!presentation)return;
  const rows=pricesForPresentation(presentationId).slice().sort((a,b)=>new Date(b.priceDate||b.createdAt)-new Date(a.priceDate||a.createdAt));
  const pg=pageSlice(rows,state.priceHistoryPage); state.priceHistoryPage=pg.page;
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box history-modal"><div class="modal-head"><div><h2>🧾 Historial de precios</h2><small>${esc(presentation.nombre)}</small></div><button class="close-btn" data-close>×</button></div><div class="history-list">${pg.rows.map(r=>`<div class="history-row"><div><strong>${formatDate(r.priceDate||r.createdAt).split(',')[0]} · ${esc(r.tienda||placeById(r.clienteId)?.nombre||"Sin empresa")}</strong><small>${r.source==='compra'?'Compra registrada':'Precio capturado'}</small></div><div class="history-value"><strong>${money(r.precio)}</strong>${r.source==='mercado'?`<button class="mini-edit danger-mini" data-delete-history-price="${esc(r.id)}">🗑️</button>`:''}</div></div>`).join("")||`<div class="empty-card">No hay precios registrados.</div>`}</div>${paginationHtml(pg.page,pg.totalPages,'prices')}</div>`;
  document.body.appendChild(modal); modal.querySelector("[data-close]").onclick=()=>modal.remove();
  modal.querySelectorAll("[data-delete-history-price]").forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar este registro de precio?'))return;deleteObservation(b.dataset.deleteHistoryPrice);logEvent('Precio borrado',presentation.nombre);modal.remove();priceHistoryModal(presentationId);});
  modal.querySelector("[data-page-prev]")?.addEventListener("click",()=>{state.priceHistoryPage--;modal.remove();priceHistoryModal(presentationId);});
  modal.querySelector("[data-page-next]")?.addEventListener("click",()=>{state.priceHistoryPage++;modal.remove();priceHistoryModal(presentationId);});
}

function purchaseCompanyOptions(selectedId){
  return `<option value="">Sin empresa</option>${activeStores().map(p=>`<option value="${esc(p.id)}" ${String(selectedId||'')===String(p.id)?'selected':''}>${esc(p.nombre)}</option>`).join("")}`;
}

function newPurchaseModal(){
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>🧾 Registrar compra</h2><small>La empresa es opcional. Puedes asociarla después.</small></div><button class="close-btn" data-close>×</button></div><label>Producto *</label><input id="purchaseProduct" class="modal-input" list="purchaseProducts" placeholder="Ej. Nutella"><datalist id="purchaseProducts">${getProducts().map(p=>`<option value="${esc(p.nombre)}">`).join("")}</datalist><label>Presentación</label><input id="purchasePresentation" class="modal-input" placeholder="Ej. 1 kg"><label>Empresa</label><select id="purchaseCompany" class="modal-input">${purchaseCompanyOptions('')}</select><button class="text-btn" id="createCompanyFromPurchase">＋ Crear empresa</button><div class="form-two"><div><label>Cantidad</label><input id="purchaseQty" class="modal-input" type="number" min="0.01" step="0.01" value="1"></div><div><label>Precio</label><input id="purchasePrice" class="modal-input" type="number" min="0" step="0.01"></div></div><label>Quién compró</label><select id="purchaseBuyer" class="modal-input">${BUYERS.map(b=>`<option>${b}</option>`).join("")}</select><input id="purchaseBuyerOther" class="modal-input" placeholder="Nombre" style="display:none"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="savePurchase">Guardar compra</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector('#purchaseBuyer').onchange=e=>modal.querySelector('#purchaseBuyerOther').style.display=e.target.value==='Otro'?'block':'none';
  modal.querySelector('#createCompanyFromPurchase').onclick=()=>{newCompanyModalForPurchase(modal);};
  modal.querySelector('#savePurchase').onclick=()=>savePurchaseForm(modal);
}

function newCompanyModalForPurchase(parentModal){
  newCompanyModal(null,company=>{parentModal.querySelector('#purchaseCompany').insertAdjacentHTML('beforeend',`<option value="${esc(company.id)}">${esc(company.nombre)}</option>`);parentModal.querySelector('#purchaseCompany').value=company.id;});
}

function savePurchaseForm(modal,id=null){
  const productName=modal.querySelector('#purchaseProduct').value.trim(); if(!productName)return alert('Escribe el producto.');
  let product=getProducts().find(p=>normalize(p.nombre)===normalize(productName));
  if(!product){try{product=createProduct({nombre:productName});logEvent('Producto añadido',productName);}catch(e){return alert(e.message);}}
  const presentationName=modal.querySelector('#purchasePresentation').value.trim()||'Sin presentación';
  let presentation=presentationsForProduct(product.id).find(p=>normalize(p.nombre)===normalize(presentationName));
  if(!presentation){try{presentation=createPresentation({productId:product.id,nombre:presentationName});logEvent('Presentación añadida',`${product.nombre} · ${presentationName}`);}catch(e){return alert(e.message);}}
  const qty=Number(modal.querySelector('#purchaseQty').value),price=Number(modal.querySelector('#purchasePrice').value); if(!(qty>0)||!(price>=0))return alert('Cantidad y precio deben ser válidos.');
  const buyer=modal.querySelector('#purchaseBuyer').value,buyerName=modal.querySelector('#purchaseBuyerOther').value.trim(); if(buyer==='Otro'&&!buyerName)return alert('Escribe el nombre de quien compra.');
  const companyId=modal.querySelector('#purchaseCompany').value; const company=companyId?placeById(companyId):null;
  const old=id?getPurchases().find(p=>String(p.id)===String(id)):null;
  const data={producto:product.nombre,presentacion:presentation.nombre,presentationId:presentation.id,tienda:company?.nombre||'',clienteId:company?.id||'',comprador:buyer,compradorNombre:buyerName,cantidad:qty,precio:price,total:qty*price,direccion:company?.direccion||'',latitud:company?.latitud??null,longitud:company?.longitud??null};
  if(id){deletePurchase(id);addPurchase({...data,id,fecha:old?.fecha});logEvent('Compra editada',`${product.nombre} · ${company?.nombre||'Sin empresa'}`);}else{addPurchase(data);logEvent('Compra registrada',`${product.nombre} · ${company?.nombre||'Sin empresa'} · ${money(qty*price)}`);}
  modal.remove(); state.purchasesPage=1; alert(id?'Compra actualizada.':'Compra registrada correctamente.');
}

function editPurchaseModal(id){
  const p=getPurchases().find(x=>String(x.id)===String(id)); if(!p)return;
  const modal=document.createElement('div'); modal.className='modal visible';
  modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h2>✏️ Editar compra</h2><button class="close-btn" data-close>×</button></div><label>Producto *</label><input id="purchaseProduct" class="modal-input" value="${esc(p.producto)}" list="purchaseProductsEdit"><datalist id="purchaseProductsEdit">${getProducts().map(x=>`<option value="${esc(x.nombre)}">`).join('')}</datalist><label>Presentación</label><input id="purchasePresentation" class="modal-input" value="${esc(p.presentacion||'')}"><label>Empresa</label><select id="purchaseCompany" class="modal-input">${purchaseCompanyOptions(p.clienteId)}</select><button class="text-btn" id="createCompanyFromPurchase">＋ Crear empresa</button><div class="form-two"><div><label>Cantidad</label><input id="purchaseQty" class="modal-input" type="number" min="0.01" step="0.01" value="${esc(p.cantidad)}"></div><div><label>Precio</label><input id="purchasePrice" class="modal-input" type="number" min="0" step="0.01" value="${esc(p.precio)}"></div></div><label>Quién compró</label><select id="purchaseBuyer" class="modal-input">${BUYERS.map(b=>`<option ${p.comprador===b?'selected':''}>${b}</option>`).join('')}</select><input id="purchaseBuyerOther" class="modal-input" placeholder="Nombre" value="${esc(p.compradorNombre||'')}" style="display:${p.comprador==='Otro'?'block':'none'}"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="savePurchase">Guardar cambios</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove()); modal.querySelector('#purchaseBuyer').onchange=e=>modal.querySelector('#purchaseBuyerOther').style.display=e.target.value==='Otro'?'block':'none'; modal.querySelector('#createCompanyFromPurchase').onclick=()=>newCompanyModalForPurchase(modal); modal.querySelector('#savePurchase').onclick=()=>savePurchaseForm(modal,id);
}

function registerPurchase(){
  const company=placeById(state.companyId),items=cartFor(state.companyId);if(!company||!items.length)return;
  if(!confirm(`¿Registrar como compra los ${items.length} productos del carrito de ${company.nombre}?`))return;
  items.forEach(item=>addPurchase({producto:item.producto,presentacion:item.presentacion,presentationId:item.presentationId,tienda:company.nombre,clienteId:company.id,comprador:item.comprador,compradorNombre:item.compradorNombre,cantidad:item.cantidad,precio:item.precio,total:Number(item.precio||0)*Number(item.cantidad||0),direccion:company.direccion,latitud:company.latitud,longitud:company.longitud,contenidoTotal:item.contenidoTotal,unidad:item.unidad,oferta:item.oferta||"",cantidadDeseada:item.cantidadDeseada||null,unidadDeseada:item.unidadDeseada||""}));
  logEvent("Compra registrada",`${company.nombre} · ${items.length} productos · ${money(cartTotal(items))}`);setCart(company.id,[]);alert("Compra registrada correctamente.");state.screen="company";render();
}

async function deleteCatalogPhotos(productIds=[],presentationIds=[]){
  let deleted=0;
  for(const id of productIds) deleted+=await deletePhotosForEntity("producto",id);
  for(const id of presentationIds) deleted+=await deletePhotosForEntity("presentacion",id);
  return deleted;
}
function removeCatalogReferences(productIds=[],presentationIds=[]){
  const pids=new Set(productIds.map(String)), presIds=new Set(presentationIds.map(String));
  const carts=getCarts();
  for(const [companyId,items] of Object.entries(carts)){
    const kept=(Array.isArray(items)?items:[]).filter(item=>!pids.has(String(item.productId||""))&&!presIds.has(String(item.presentationId||"")));
    if(kept.length)carts[companyId]=kept; else delete carts[companyId];
  }
  saveCarts(carts);
  const needs=setting(NEEDS_SETTING,[]).filter(n=>!pids.has(String(n.productId||"")));
  saveSetting(NEEDS_SETTING,needs);
}

function bindEntityActions(scope=document){
  scope.querySelectorAll("[data-store-history]").forEach(b=>b.onclick=e=>{e.stopPropagation();scopeHistoryModal("store",b.dataset.storeHistory);});
  scope.querySelectorAll("[data-category-history]").forEach(b=>b.onclick=e=>{e.stopPropagation();scopeHistoryModal("category",b.dataset.categoryHistory);});
  scope.querySelectorAll("[data-edit-category]").forEach(b=>b.onclick=e=>{e.stopPropagation();editCategoryModal(b.dataset.editCategory);});
  scope.querySelectorAll("[data-toggle-category]").forEach(b=>b.onclick=e=>{e.stopPropagation();const c=categoryById(b.dataset.toggleCategory);if(!c)return;if(!confirm(`¿Desactivar ${c.nombre}?

Sus productos, presentaciones, fotografías y precios se conservarán.`))return;deactivateCategory(c.id);logEvent("Categoría desactivada",c.nombre);render();});
  scope.querySelectorAll("[data-delete-category]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const c=categoryById(b.dataset.deleteCategory);if(!c)return;const products=productsForCategory(c.id);const productIds=products.map(p=>String(p.id));const presentationIds=products.flatMap(p=>presentationsForProduct(p.id).map(pr=>String(pr.id)));let photoCount=await getPhotos("categoria",c.id).then(rows=>rows.length).catch(()=>0);for(const id of productIds)photoCount+=await getPhotos("producto",id).then(rows=>rows.length).catch(()=>0);for(const id of presentationIds)photoCount+=await getPhotos("presentacion",id).then(rows=>rows.length).catch(()=>0);const msg=`⚠️ ELIMINAR CATEGORÍA COMPLETA

${c.nombre}

Se eliminarán definitivamente:
• ${products.length} producto${products.length===1?'':'s'}
• ${presentationIds.length} presentación${presentationIds.length===1?'':'es'}
• ${photoCount} fotografía${photoCount===1?'':'s'}
• precios, observaciones y compras relacionadas
• referencias en carritos y listas

Esta acción NO se puede deshacer.`;if(!confirm(msg))return;const result=deleteCategory(c.id);removeCatalogReferences(result?.productIds||productIds,result?.presentationIds||presentationIds);await deleteCatalogPhotos(result?.productIds||productIds,result?.presentationIds||presentationIds);await deletePhotosForEntity("categoria",c.id).catch(()=>{});logEvent("Categoría eliminada definitivamente",`${c.nombre} · ${products.length} productos · ${presentationIds.length} presentaciones`);if(state.categoryId===c.id){state.categoryId=null;state.screen="company";}render();});
  scope.querySelectorAll("[data-edit-company]").forEach(b=>b.onclick=e=>{e.stopPropagation();newCompanyModal(b.dataset.editCompany);});
  scope.querySelectorAll("[data-toggle-company]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=placeById(b.dataset.toggleCompany);if(!p)return;if(p.estatus==='inactivo'){upsertPlace({id:p.id,estatus:'activo'});logEvent("Empresa activada",p.nombre);}else{if(!confirm(`¿Desactivar ${p.nombre}?`))return;upsertPlace({id:p.id,estatus:'inactivo'});logEvent("Empresa desactivada",p.nombre);}render();});
  scope.querySelectorAll("[data-delete-company]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const p=placeById(b.dataset.deleteCompany);if(!p)return;if(!confirm(`¿Borrar ${p.nombre}?

La empresa se eliminará de Empresas/Mapa y su carrito abierto.

NO se eliminarán productos, categorías, presentaciones ni sus fotografías. Los registros históricos de precios/compras se conservarán.`))return;const carts=getCarts();delete carts[p.id];saveCarts(carts);await deletePhotosForEntity("empresa",p.id).catch(()=>{});deletePlace(p.id);logEvent("Empresa borrada",p.nombre);if(state.companyId===p.id){state.companyId=null;state.screen="home";}render();});
  scope.querySelectorAll("[data-edit-product]").forEach(b=>b.onclick=e=>{e.stopPropagation();editProductModal(b.dataset.editProduct);});
  scope.querySelectorAll("[data-toggle-product]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=productById(b.dataset.toggleProduct);if(!p)return;if(p.active===false){updateProduct(p.id,{active:true});logEvent("Producto activado",p.nombre);}else{if(!confirm(`¿Desactivar ${p.nombre}?`))return;deactivateProduct(p.id);logEvent("Producto desactivado",p.nombre);}render();});
  scope.querySelectorAll("[data-delete-product]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const p=productById(b.dataset.deleteProduct);if(!p)return;const pres=presentationsForProduct(p.id);const presIds=pres.map(x=>String(x.id));const photoCount=(await getPhotos("producto",p.id).then(r=>r.length).catch(()=>0))+ (await Promise.all(presIds.map(id=>getPhotos("presentacion",id).then(r=>r.length).catch(()=>0)))).reduce((a,n)=>a+n,0);if(!confirm(`⚠️ ELIMINAR PRODUCTO COMPLETAMENTE

${p.nombre}

Se eliminarán definitivamente:
• 1 producto
• ${pres.length} presentación${pres.length===1?'':'es'}
• ${photoCount} fotografía${photoCount===1?'':'s'}
• precios, observaciones y compras relacionadas
• referencias en carritos y listas

Esta acción NO se puede deshacer.`))return;const result=deleteProduct(p.id);removeCatalogReferences([p.id],result?.presentationIds||presIds);await deleteCatalogPhotos([p.id],result?.presentationIds||presIds);logEvent("Producto eliminado definitivamente",`${p.nombre} · ${pres.length} presentaciones`);if(scope.classList?.contains("modal"))scope.remove();render();});
  scope.querySelectorAll("[data-edit-presentation]").forEach(b=>b.onclick=e=>{e.stopPropagation();editPresentationModal(b.dataset.editPresentation);});
  scope.querySelectorAll("[data-toggle-presentation]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=presentationById(b.dataset.togglePresentation);if(!p)return;if(p.active===false){updatePresentation(p.id,{active:true});logEvent("Presentación activada",p.nombre);}else{if(!confirm(`¿Desactivar ${p.nombre}?`))return;deactivatePresentation(p.id);logEvent("Presentación desactivada",p.nombre);}render();});
  scope.querySelectorAll("[data-price-history]").forEach(b=>b.onclick=e=>{e.stopPropagation();state.priceHistoryPage=1;priceHistoryModal(b.dataset.priceHistory);});
  scope.querySelectorAll("[data-delete-price]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const source=b.dataset.priceSource||"mercado";const rawId=b.dataset.deletePrice;let record=null;if(source==="compra"){const purchaseId=rawId?.startsWith("purchase:")?rawId.slice(9):rawId;record=getPurchases().find(x=>String(x.id)===String(purchaseId));}else{record=getObservations().find(x=>String(x.id)===String(rawId));}if(!record)return;const presentation=record.presentationId?presentationById(record.presentationId):null;const company=record.clienteId?placeById(record.clienteId):null;const detail=`${presentation?.nombre||record.presentacion||"Sin presentación"} · ${company?.nombre||record.tienda||"Sin empresa"} · ${money(record.precio)}`;if(!confirm(`¿Eliminar únicamente este registro de precio?

${detail}

La presentación, sus fotografías y los demás precios NO se eliminarán.`))return;if(source==="compra"){const purchaseId=record.id;deletePurchase(purchaseId);}else{deleteObservation(record.id);}logEvent("Registro de precio eliminado",detail);if(scope.classList?.contains("modal")){scope.remove();if(state.productId){productModal(state.productId);}else{render();}}else{render();}});
  scope.querySelectorAll("[data-delete-presentation]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const p=presentationById(b.dataset.deletePresentation);if(!p)return;const photoCount=await getPhotos("presentacion",p.id).then(r=>r.length).catch(()=>0);if(!confirm(`⚠️ ELIMINAR PRESENTACIÓN COMPLETAMENTE

${p.nombre}

Se eliminarán definitivamente:
• 1 presentación
• ${photoCount} fotografía${photoCount===1?'':'s'}
• precios, observaciones y compras relacionadas
• referencias en carritos

Esta acción NO se puede deshacer.`))return;const result=deletePresentation(p.id);removeCatalogReferences([], [p.id]);await deleteCatalogPhotos([], [p.id]);logEvent("Presentación eliminada definitivamente",p.nombre);if(scope.classList?.contains("modal"))scope.remove();render();});
}
function editProductModal(id){
  const p=productById(id);if(!p)return;
  const modal=document.createElement("div");modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>✏️ Editar producto</h2><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="editProductName" class="modal-input" value="${esc(p.nombre)}"><label>Categoría *</label><select id="editProductCategory" class="modal-input">${getCategories().map(c=>`<option value="${esc(c.id)}" ${String(c.id)===String(p.categoryId)?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select><div id="productFormPhotos"></div><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveEditProduct">Guardar</button></div></div>`;
  document.body.appendChild(modal);
  renderPhotoPicker({container:modal.querySelector('#productFormPhotos'),entityType:'producto',entityId:p.id,label:'Fotografías'});
  modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("#saveEditProduct").onclick=()=>{const nombre=modal.querySelector("#editProductName").value.trim();if(!nombre)return alert("Escribe el nombre.");try{updateProduct(id,{nombre,categoryId:modal.querySelector("#editProductCategory")?.value||p.categoryId||""});logEvent("Producto editado",`${p.nombre} → ${nombre}`);modal.remove();render();}catch(e){alert(e.message);}};
}
function editPresentationModal(id){const p=presentationById(id);if(!p)return;const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>✏️ Editar presentación</h2><button class="close-btn" data-close>×</button></div><label>Presentación *</label><input id="editPresName" class="modal-input" value="${esc(p.nombre)}"><label>Contenido total</label><div class="form-two"><input id="editPresContent" class="modal-input" type="number" min="0" step="0.001" value="${p.contenidoTotal??''}"><select id="editPresUnit" class="modal-input"><option value="ml" ${p.unidad==='ml'?'selected':''}>ml</option><option value="L" ${p.unidad==='l'?'selected':''}>L</option><option value="g" ${p.unidad==='g'?'selected':''}>g</option><option value="kg" ${p.unidad==='kg'?'selected':''}>kg</option><option value="unidad" ${['unidad','unidades'].includes(p.unidad)?'selected':''}>unidad</option><option value="UE" ${p.unidad==='ue'?'selected':''}>UE</option></select></div><label>Oferta (opcional)</label><input id="editPresOffer" class="modal-input" value="${esc(p.oferta||'')}"><div id="presentationFormPhotos"></div><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveEditPres">Guardar</button></div></div>`;document.body.appendChild(modal);renderPhotoPicker({container:modal.querySelector('#presentationFormPhotos'),entityType:'presentacion',entityId:p.id,label:'Fotografías'});modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());modal.querySelector("#saveEditPres").onclick=()=>{const nombre=modal.querySelector("#editPresName").value.trim();const content=Number(modal.querySelector('#editPresContent').value);if(!nombre||!(content>0))return alert("Completa presentación y contenido.");try{updatePresentation(id,{nombre,contenidoTotal:content,unidad:modal.querySelector('#editPresUnit').value,oferta:modal.querySelector('#editPresOffer').value.trim()});logEvent("Presentación editada",`${p.nombre} → ${nombre}`);modal.remove();render();}catch(e){alert(e.message);}};}

function bind(){
  if(state.screen==='company'&&state.companyId){const c=document.getElementById('companyPhotos');if(c)renderPhotoPicker({container:c,entityType:'empresa',entityId:state.companyId,label:'Fotografías'});}
  document.getElementById("companySearch")?.addEventListener("input",e=>{
    state.companySearch=e.target.value;
    const q=normalize(state.companySearch);
    document.querySelectorAll("[data-company-card-name]").forEach(card=>{
      card.hidden=!!q&&!normalize(card.dataset.companyCardName).includes(q);
    });
  });
  document.getElementById("listSearch")?.addEventListener("input",e=>{
    state.listSearch=e.target.value;
    const q=normalize(state.listSearch);
    document.querySelectorAll("[data-need-name]").forEach(row=>{
      row.hidden=!!q&&!normalize(row.dataset.needName).includes(q);
    });
  });
  document.getElementById("productSearch")?.addEventListener("input",e=>{
    state.productSearch=e.target.value;
    const q=normalize(state.productSearch);
    if(state.screen==="company"){
      document.querySelectorAll("[data-category-card-name]").forEach(card=>{
        const name=normalize(card.dataset.categoryCardName);
        const categoryId=card.querySelector("[data-category]")?.dataset.category;
        const productMatch=categoryId&&productsForCategory(categoryId).some(p=>normalize(p.nombre).includes(q));
        card.hidden=!!q&&!name.includes(q)&&!productMatch;
      });
    }else{
      document.querySelectorAll("[data-product-card-name]").forEach(card=>{
        card.hidden=!!q&&!normalize(card.dataset.productCardName).includes(q);
      });
    }
  });
  document.getElementById("newCompanyBtn")?.addEventListener("click",()=>newCompanyModal());document.getElementById("newCompanyEmpty")?.addEventListener("click",()=>newCompanyModal());
  document.getElementById("listBtn")?.addEventListener("click",()=>{state.listReturnScreen="home";state.companyId=null;state.screen="list";state.listSearch="";render();});document.getElementById("companyListBtn")?.addEventListener("click",()=>{state.listReturnScreen="company";state.screen="list";state.listSearch="";render();});
  document.getElementById("addCategoryBtn")?.addEventListener("click",newCategoryModal);document.getElementById("addProductBtn")?.addEventListener("click",newProductModal);document.getElementById("addNeedBtn")?.addEventListener("click",newNeedModal);document.getElementById("calculatorBtn")?.addEventListener("click",calculatorModal);document.getElementById("cartBtn")?.addEventListener("click",()=>{state.screen="cart";render();});
  document.getElementById("openCartsTop")?.addEventListener("click",openCartsModal);document.getElementById("openCartsBanner")?.addEventListener("click",openCartsModal);document.getElementById("purchasesHistoryBtn")?.addEventListener("click",()=>{state.purchasesPage=1;purchasesHistoryModal();});document.getElementById("eventsHistoryBtn")?.addEventListener("click",()=>{state.eventsPage=1;eventsHistoryModal();});
  document.getElementById("backBtn")?.addEventListener("click",()=>{if(state.screen==="cart"){state.screen="company";}else if(state.screen==="list"){if(state.listReturnScreen==="company"&&state.companyId){state.screen="company";}else{state.screen="home";state.companyId=null;}}else if(state.screen==="category"){state.screen="company";state.categoryId=null;state.productSearch="";}else if(state.screen==="company"){state.screen="home";state.companyId=null;state.productSearch="";}render();});
  document.querySelectorAll("[data-company]").forEach(b=>b.onclick=()=>{state.companyId=b.dataset.company;state.screen="company";state.categoryId=null;state.productSearch="";render();});document.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>{state.categoryId=b.dataset.category;state.screen="category";state.productSearch="";render();});document.querySelectorAll("[data-product]").forEach(b=>b.onclick=()=>productModal(b.dataset.product));
  document.querySelectorAll("[data-remove-cart]").forEach(b=>b.onclick=()=>{setCart(state.companyId,cartFor(state.companyId).filter(i=>String(i.id)!==String(b.dataset.removeCart)));render();});
  document.querySelectorAll("[data-qty]").forEach(i=>i.onchange=()=>{const items=cartFor(state.companyId),item=items.find(x=>String(x.id)===String(i.dataset.qty)),qty=Number(i.value);if(!item)return;if(qty>0){item.cantidad=qty;setCart(state.companyId,items);}else setCart(state.companyId,items.filter(x=>x.id!==item.id));render();});
  document.querySelectorAll("[data-toggle-need]").forEach(b=>b.onclick=()=>{const needs=setting(NEEDS_SETTING,[]),n=needs.find(x=>String(x.id)===String(b.dataset.toggleNeed));if(!n)return;alert("La lista se marca automáticamente cuando una presentación de esta necesidad entra en un carrito.");});
  document.querySelectorAll("[data-delete-need]").forEach(b=>b.onclick=()=>{const needs=setting(NEEDS_SETTING,[]),n=needs.find(x=>String(x.id)===String(b.dataset.deleteNeed));if(!n)return;if(confirm(`¿Quitar ${n.nombre} de tu lista?`)){saveSetting(NEEDS_SETTING,needs.filter(x=>x.id!==n.id));logEvent("Necesidad eliminada",n.nombre);render();}});
  document.getElementById("registerPurchaseBtn")?.addEventListener("click",registerPurchase);document.getElementById("closeCartBtn")?.addEventListener("click",()=>{if(!confirm(`¿Cerrar el carrito de ${placeById(state.companyId)?.nombre||"esta tienda"}?\n\nCerrar el carrito no registra una compra.`))return;setCart(state.companyId,[]);state.screen="company";render();});
  bindEntityActions(document);
  bindPhotoIndicators(document);
}
async function bindPhotoIndicators(scope=document){
  // Regla estricta: 📷 SOLO representa fotografías guardadas directamente en ese elemento.
  // No se heredan fotografías de hijos ni de padres.
  const nodes=[...scope.querySelectorAll('[data-photo-indicator]')];
  await Promise.all(nodes.map(async node=>{
    const parts=String(node.dataset.photoIndicator||'').split(':');
    const entityType=parts.shift();
    const entityId=parts.join(':');
    if(!entityType||!entityId)return;
    try{
      const photos=await getPhotos(entityType,entityId);
      if(!document.contains(node))return;
      node.textContent=photos.length?'📷':'';
      node.style.display=photos.length?'inline-block':'none';
      node.dataset.hasPhoto=photos.length?'1':'0';
      node.setAttribute('aria-hidden',photos.length?'false':'true');
    }catch{
      if(document.contains(node)){node.textContent='';node.style.display='none';node.dataset.hasPhoto='0';node.setAttribute('aria-hidden','true');}
    }
  }));
}
function focusInput(id){setTimeout(()=>{const el=document.getElementById(id);if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}},0);}
function render(){let html="";if(state.screen==="home")html=homeView();if(state.screen==="list")html=listView();if(state.screen==="company")html=companyView();if(state.screen==="category")html=categoryView();if(state.screen==="cart")html=cartView();root.innerHTML=html;bind();}
render();
