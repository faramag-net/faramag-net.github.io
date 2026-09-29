/**
 * Productos Santa Rosa
 * Módulo: 🛒 Compras (remodelación de Insumos)
 * Versión: 1.4.0
 * Build: 20260928.0830
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

import {
  getProducts,
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
  addPurchase,
  getPurchases,
  deletePurchase,
  normalize,
  uid
} from "../mercado/mercado-store.js";

const root = document.getElementById("app");
const SETTINGS_KEY = "psr_settings";
const CARTS_SETTING = "comprasCarritosV1";
const NEEDS_SETTING = "comprasListaV1";
const EVENTS_SETTING = "comprasHistorialEventosV1";
const BUYERS = ["Ambos", "Martha", "Fara", "Otro"];

let state = {
  screen: "home",
  companyId: null,
  productId: null,
  presentationId: null,
  companySearch: "",
  productSearch: "",
  listSearch: "",
  purchasesPage: 1,
  eventsPage: 1,
  priceHistoryPage: 1
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

function events(){ return setting(EVENTS_SETTING,[]); }
function logEvent(tipo,detalle){
  const rows=events(); rows.unshift({id:uid(),fecha:new Date().toISOString(),tipo,detalle}); saveSetting(EVENTS_SETTING,rows.slice(0,1000));
}
function formatDate(value){ try{return new Date(value).toLocaleString("es-MX",{dateStyle:"short",timeStyle:"short"});}catch{return value||"";} }
function money(v){return `$${Number(v||0).toFixed(2)}`;}

function header(title,back){
  return `<header class="compras-header">
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
  return `${header("🛒 Compras",false)}
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
  return `<div class="company-card-wrap"><button class="company-card" data-company="${esc(p.id)}"><span class="company-icon">🏪</span><strong>${esc(p.nombre)}</strong><small>${esc(storeTypeLabel(p.tipo))}</small>${cart.length?`<em>🛒 ${cart.length}</em>`:""}</button><div class="entity-actions"><button data-edit-company="${esc(p.id)}" title="Editar">✏️</button><button data-toggle-company="${esc(p.id)}" title="Desactivar">${p.estatus==='inactivo'?'🔄':'⏸️'}</button><button data-delete-company="${esc(p.id)}" title="Borrar">🗑️</button></div></div>`;
}

function listView(){
  const needs=setting(NEEDS_SETTING,[]);
  const filtered=needs.filter(n=>!state.listSearch||normalize(n.nombre).includes(normalize(state.listSearch)));
  const carts=openCartEntries();
  const cartProductIds=new Set(carts.flatMap(c=>c.items.map(i=>String(i.productId))));
  return `${header("📝 Lista",true)}<section class="list-screen"><p class="muted">Esta es tu lista personal de lo que necesitas. Aquí agregas manualmente lo que vas requiriendo.</p><div class="search-wrap"><span>🔎</span><input id="listSearch" value="${esc(state.listSearch)}" placeholder="Buscar en mi lista..."></div><div class="need-list">${filtered.map(n=>`<div class="need-row"><button class="need-check ${cartProductIds.has(String(n.productId))?'checked':''}" data-toggle-need="${esc(n.id)}">${cartProductIds.has(String(n.productId))?'✓':''}</button><span>${esc(n.nombre)}</span><button class="mini-danger" data-delete-need="${esc(n.id)}">×</button></div>`).join("")||`<div class="empty-card">Tu lista está vacía.</div>`}</div><button class="wide-action" id="addNeedBtn">＋ Agregar producto</button></section>`;
}

function companyView(){
  const company=placeById(state.companyId); if(!company){state.screen="home";return homeView();}
  const products=getProducts().filter(p=>!state.productSearch||normalize(p.nombre).includes(normalize(state.productSearch)));
  const cart=cartFor(company.id);
  const purchased=getPurchases().filter(p=>String(p.clienteId)===String(company.id)).reduce((s,p)=>s+Number(p.total||0),0);
  return `${header(`🏪 ${esc(company.nombre)}`,true)}<div class="context-line">${esc(storeTypeLabel(company.tipo))}${company.direccion?` · ${esc(company.direccion)}`:""}</div>
    <div class="company-kpi"><span>💰 Total comprado en esta empresa</span><strong>${money(purchased)}</strong></div>
    <section class="company-tools"><div class="search-wrap"><span>🔎</span><input id="productSearch" value="${esc(state.productSearch)}" placeholder="Buscar producto..."></div><div class="tool-grid"><button class="action-btn" id="addProductBtn">＋ Producto</button><button class="action-btn" id="companyListBtn">📝 Lista</button><button class="action-btn" id="calculatorBtn">🧮 Calculadora</button><button class="action-btn primary" id="cartBtn">🛒 Carrito${cart.length?` (${cart.length})`:""}</button></div></section>
    <section class="entity-toolbar"><button data-edit-company="${esc(company.id)}">✏️ Editar empresa</button><button data-toggle-company="${esc(company.id)}">${company.estatus==='inactivo'?'🔄 Activar':'⏸️ Desactivar'}</button><button data-delete-company="${esc(company.id)}">🗑️ Borrar</button></section>
    <section class="section-head"><h2>📦 Productos</h2><span>${products.length}</span></section><section class="product-grid">${products.map(productCard).join("")||`<div class="empty-card">No hay productos que coincidan.</div>`}</section>`;
}
function productCard(p){
  return `<div class="product-card-wrap"><button class="product-card" data-product="${esc(p.id)}"><span>📦</span><strong>${esc(p.nombre)}</strong><small>${presentationsForProduct(p.id).length} ${presentationsForProduct(p.id).length===1?'presentación':'presentaciones'}</small></button><div class="entity-actions"><button data-edit-product="${esc(p.id)}">✏️</button><button data-toggle-product="${esc(p.id)}">⏸️</button><button data-delete-product="${esc(p.id)}">🗑️</button></div></div>`;
}

function productModal(productId){
  const product=productById(productId); if(!product)return;
  const company=placeById(state.companyId); const presentations=presentationsForProduct(productId);
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box presentation-modal"><div class="modal-head"><div><h2>📦 ${esc(product.nombre)}</h2><small>${esc(company?.nombre||"")}</small></div><button class="close-btn" data-close>×</button></div><div class="entity-toolbar"><button data-edit-product="${esc(product.id)}">✏️ Editar</button><button data-toggle-product="${esc(product.id)}">⏸️ Desactivar</button><button data-delete-product="${esc(product.id)}">🗑️ Borrar</button></div><div class="presentation-list">${presentations.map(p=>presentationRow(p,company)).join("")||`<div class="empty-card">Este producto todavía no tiene presentaciones.</div>`}</div><div class="modal-actions split"><button class="btn secondary" data-new-presentation>＋ Nueva presentación</button><button class="btn secondary" data-close>Cerrar</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("[data-new-presentation]").onclick=()=>{modal.remove();newPresentationModal(productId);};
  bindEntityActions(modal);
  modal.querySelectorAll("[data-presentation]").forEach(b=>b.onclick=()=>presentationDetail(productId,b.dataset.presentation));
  modal.querySelectorAll("[data-price-history]").forEach(b=>b.onclick=e=>{e.stopPropagation();state.priceHistoryPage=1;priceHistoryModal(b.dataset.priceHistory);});
}
function presentationRow(p,company){
  const price=company?latestPrice(p.id,company.id):null; const cart=company?cartFor(company.id).find(i=>String(i.presentationId)===String(p.id)):null;
  return `<div class="presentation-row-wrap"><button class="presentation-row" data-presentation="${esc(p.id)}"><span class="pres-main"><strong>${esc(p.nombre)}</strong>${p.unidad?`<small>${esc(p.unidad)}</small>`:""}</span><span class="pres-price">${price?money(price.precio):"—"}</span><span>${cart?"🛒":"＋"}</span></button><div class="entity-actions"><button data-price-history="${esc(p.id)}" title="Historial de precios">🧾</button><button data-edit-presentation="${esc(p.id)}">✏️</button><button data-toggle-presentation="${esc(p.id)}">⏸️</button><button data-delete-presentation="${esc(p.id)}">🗑️</button></div></div>`;
}

function presentationDetail(productId,presentationId){
  const product=productById(productId), presentation=presentationById(presentationId), company=placeById(state.companyId); if(!product||!presentation||!company)return;
  const price=latestPrice(presentation.id,company.id), cart=cartFor(company.id), existing=cart.find(i=>String(i.presentationId)===String(presentation.id));
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>📦 ${esc(presentation.nombre)}</h2><small>${esc(product.nombre)} · ${esc(company.nombre)}</small></div><button class="close-btn" data-close>×</button></div><div class="entity-toolbar"><button data-price-history="${esc(presentation.id)}">🧾 Historial de precios</button><button data-edit-presentation="${esc(presentation.id)}">✏️ Editar</button><button data-toggle-presentation="${esc(presentation.id)}">⏸️ Desactivar</button><button data-delete-presentation="${esc(presentation.id)}">🗑️ Borrar</button></div><div class="price-box"><strong>💰 Precio en ${esc(company.nombre)}</strong>${price?`<div class="current-price">${money(price.precio)} <small>${formatDate(price.priceDate||price.createdAt)}</small></div><div class="entity-actions price-actions"><button data-delete-price="${esc(price.id)}">🗑️ Borrar precio</button></div>`:`<p class="muted">Sin precio registrado en esta tienda.</p>`}<label>Registrar/actualizar precio</label><div class="inline-price"><span>$</span><input id="storePrice" type="number" min="0" step="0.01" value="${price?Number(price.precio):""}"></div><button class="btn primary-full" id="savePrice">💰 Guardar precio</button></div><div class="cart-add-box"><label>Quién compra</label><select id="buyerSelect">${BUYERS.map(b=>`<option>${b}</option>`).join("")}</select><input id="buyerOther" class="modal-input" placeholder="Nombre de quien compra" style="display:none"><label>Cantidad</label><input id="cartQty" type="number" min="0.01" step="0.01" value="${existing?.cantidad||1}"><button class="btn primary-full" id="addToCart">${existing?"🛒 Actualizar carrito":"🛒 Agregar al carrito"}</button></div><div class="modal-actions"><button class="btn secondary" data-close>Cerrar</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  const sel=modal.querySelector("#buyerSelect"), other=modal.querySelector("#buyerOther"); if(existing){sel.value=existing.comprador||"Fara";if(sel.value==="Otro"){other.style.display="block";other.value=existing.compradorNombre||"";}}
  sel.onchange=()=>{other.style.display=sel.value==="Otro"?"block":"none";};
  modal.querySelector("#savePrice").onclick=()=>{const value=Number(modal.querySelector("#storePrice").value);if(!(value>=0))return alert("Escribe un precio válido.");addObservation({producto:product.nombre,presentacion:presentation.nombre,presentationId:presentation.id,precio:value,clienteId:company.id});logEvent("Precio",`${esc(company.nombre)} · ${esc(presentation.nombre)} → ${money(value)}`);modal.remove();productModal(productId);};
  modal.querySelector("#addToCart").onclick=()=>{const qty=Number(modal.querySelector("#cartQty").value);if(!(qty>0))return alert("La cantidad debe ser mayor que 0.");const buyer=sel.value,buyerName=other.value.trim();if(buyer==="Otro"&&!buyerName)return alert("Escribe el nombre de quien compra.");const items=cartFor(company.id);const item={id:existing?.id||uid(),productId:product.id,presentationId:presentation.id,producto:product.nombre,presentacion:presentation.nombre,precio:price?Number(price.precio):Number(modal.querySelector("#storePrice").value||0),cantidad:qty,comprador:buyer,compradorNombre:buyerName};const idx=items.findIndex(i=>String(i.presentationId)===String(presentation.id));if(idx>=0)items[idx]=item;else items.push(item);setCart(company.id,items);modal.remove();render();};
  bindEntityActions(modal);
  modal.querySelector("[data-delete-price]")?.addEventListener("click",()=>{if(!price)return;if(price.source==='compra')return alert('Este precio proviene de una compra registrada. Para eliminarlo, elimina la compra desde el historial.');if(!confirm("¿Borrar este precio?"))return;deleteObservation(price.id);modal.remove();productModal(productId);logEvent("Precio borrado",`${company.nombre} · ${presentation.nombre}`);});
}

function newProductModal(){
  const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>＋ Nuevo producto</h2><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="newProductName" class="modal-input" placeholder="Ej. Nutella"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveProduct">Guardar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());modal.querySelector("#newProductName").focus();modal.querySelector("#saveProduct").onclick=()=>{const nombre=modal.querySelector("#newProductName").value.trim();if(!nombre)return alert("Escribe el nombre.");try{const p=createProduct({nombre});logEvent("Producto añadido",nombre);modal.remove();state.productSearch=nombre;render();}catch(e){alert(e.message);}};
}
function newNeedModal(){
  const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>📝 Agregar a mi lista</h2><button class="close-btn" data-close>×</button></div><label>Producto *</label><input id="needName" class="modal-input" list="catalogNeedList" placeholder="Escribe lo que necesitas"><datalist id="catalogNeedList">${getProducts().map(p=>`<option value="${esc(p.nombre)}">`).join("")}</datalist><p class="muted">Si ya existe en el catálogo, se relacionará con ese producto. Si no existe, puedes crearlo con el mismo nombre.</p><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveNeed">Agregar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());modal.querySelector("#needName").focus();modal.querySelector("#saveNeed").onclick=()=>{const nombre=modal.querySelector("#needName").value.trim();if(!nombre)return alert("Escribe el producto.");let p=getProducts().find(x=>normalize(x.nombre)===normalize(nombre));if(!p){try{p=createProduct({nombre});logEvent("Producto añadido",nombre);}catch(e){return alert(e.message);}}const needs=setting(NEEDS_SETTING,[]);if(needs.some(n=>normalize(n.nombre)===normalize(nombre)))return alert("Ese producto ya está en tu lista.");needs.push({id:uid(),productId:p.id,nombre:p.nombre,createdAt:new Date().toISOString()});saveSetting(NEEDS_SETTING,needs);logEvent("Necesidad añadida",p.nombre);modal.remove();render();};
}
function newPresentationModal(productId){
  const product=productById(productId);if(!product)return;const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>＋ Nueva presentación</h2><button class="close-btn" data-close>×</button></div><small>${esc(product.nombre)}</small><label>Presentación *</label><input id="presentationName" class="modal-input" placeholder="Ej. Nutella 1 kg"><label>Unidad / medida (opcional)</label><input id="presentationUnit" class="modal-input" placeholder="1 kg"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="savePresentation">Guardar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());modal.querySelector("#presentationName").focus();modal.querySelector("#savePresentation").onclick=()=>{const nombre=modal.querySelector("#presentationName").value.trim();if(!nombre)return alert("Escribe la presentación.");try{createPresentation({productId,nombre,unidad:modal.querySelector("#presentationUnit").value.trim()});logEvent("Presentación añadida",`${product.nombre} · ${nombre}`);modal.remove();productModal(productId);}catch(e){alert(e.message);}};
}

function newCompanyModal(companyId=null,onSaved=null){
  const existing=companyId?placeById(companyId):null;const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>${existing?"✏️ Editar empresa":"🏪 Nueva empresa"}</h2><small>Se guarda como 🏪 Tienda compartida con Mapa.</small></div><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="companyName" class="modal-input" value="${esc(existing?.nombre||"")}"><label>Contacto</label><input id="companyContact" class="modal-input" value="${esc(existing?.contacto||existing?.encargado||"")}"><label>Tipo *</label><select id="companyType" class="modal-input">${["Tienda","Supermercado","Mayorista","Mercado","Distribuidor","Otro"].map(t=>`<option ${existing?.tipo===t?'selected':''}>${t}</option>`).join("")}</select><label>Dirección</label><textarea id="companyAddress" class="modal-input" rows="2">${esc(existing?.direccion||"")}</textarea><label>Tienda virtual</label><input id="companyWeb" class="modal-input" type="url" value="${esc(existing?.tiendaVirtual||"")}" placeholder="https://..."><div class="location-box"><div><strong>📍 Ubicación</strong><small id="locationText">${existing?.latitud!=null&&existing?.longitud!=null?`${existing.latitud}, ${existing.longitud}`:"Sin ubicación"}</small></div><button class="btn secondary" id="useLocation">Usar ubicación actual</button></div><input type="hidden" id="companyLat" value="${existing?.latitud??""}"><input type="hidden" id="companyLon" value="${existing?.longitud??""}"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveCompany">Guardar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("#useLocation").onclick=()=>{if(!navigator.geolocation)return alert("Este dispositivo no permite obtener ubicación.");modal.querySelector("#locationText").textContent="Obteniendo ubicación…";navigator.geolocation.getCurrentPosition(pos=>{const lat=pos.coords.latitude,lon=pos.coords.longitude;modal.querySelector("#companyLat").value=lat;modal.querySelector("#companyLon").value=lon;modal.querySelector("#locationText").textContent=`${lat.toFixed(6)}, ${lon.toFixed(6)}`;},()=>alert("No se pudo obtener la ubicación."),{enableHighAccuracy:true,timeout:10000});};
  modal.querySelector("#saveCompany").onclick=()=>{const nombre=modal.querySelector("#companyName").value.trim();if(!nombre)return alert("Escribe el nombre.");const p=upsertPlace({id:existing?.id,nombre,contacto:modal.querySelector("#companyContact").value.trim(),encargado:modal.querySelector("#companyContact").value.trim(),tipo:modal.querySelector("#companyType").value,direccion:modal.querySelector("#companyAddress").value.trim(),tiendaVirtual:modal.querySelector("#companyWeb").value.trim(),latitud:modal.querySelector("#companyLat").value?Number(modal.querySelector("#companyLat").value):null,longitud:modal.querySelector("#companyLon").value?Number(modal.querySelector("#companyLon").value):null});logEvent(existing?"Empresa editada":"Empresa añadida",p.nombre);modal.remove();if(onSaved){onSaved(p);return;}if(existing){render();}else{state.companyId=p.id;state.screen="company";state.productSearch="";render();}};
}

function calculatorModal(){
  const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box calculator"><div class="modal-head"><h2>🧮 Calculadora</h2><button class="close-btn" data-close>×</button></div><div class="calc-grid"><div><h3>Producto 1</h3><label>Precio</label><input id="c1p" type="number" min="0" step="0.01" placeholder="100"><label>Número</label><input id="c1n" type="number" min="0.0001" step="0.01" placeholder="1000"><strong>Por unidad <span id="c1u">—</span></strong></div><div><h3>Producto 2</h3><label>Precio</label><input id="c2p" type="number" min="0" step="0.01" placeholder="56"><label>Número</label><input id="c2n" type="number" min="0.0001" step="0.01" placeholder="500"><strong>Por unidad <span id="c2u">—</span></strong></div></div><div class="conversion"><h3>CONVERSIÓN</h3><div id="conv1">Producto 1 —</div><div id="conv2">Producto 2 —</div></div><div class="modal-actions"><button class="btn secondary" data-close>Cerrar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());const calc=()=>{const p1=Number(modal.querySelector("#c1p").value),n1=Number(modal.querySelector("#c1n").value),p2=Number(modal.querySelector("#c2p").value),n2=Number(modal.querySelector("#c2n").value),u1=p1>0&&n1>0?p1/n1:null,u2=p2>0&&n2>0?p2/n2:null;modal.querySelector("#c1u").textContent=u1==null?"—":money(u1).replace("$","$");modal.querySelector("#c2u").textContent=u2==null?"—":money(u2);modal.querySelector("#conv1").textContent=u2!=null?`Producto 1: ${n1} × ${money(u2)} = ${money(n1*u2)} · Diferencia: ${money(n1*u2-p1)}`:"Producto 1 —";modal.querySelector("#conv2").textContent=u1!=null?`Producto 2: ${n2} × ${money(u1)} = ${money(n2*u1)} · Diferencia: ${money(n2*u1-p2)}`:"Producto 2 —";};modal.querySelectorAll("input").forEach(i=>i.oninput=calc);calc();
}

function cartView(){
  const company=placeById(state.companyId),items=cartFor(state.companyId);if(!company){state.screen="home";return homeView();}
  return `${header(`🛒 Carrito · ${esc(company.nombre)}`,true)}<div class="context-line">Este carrito queda abierto hasta que lo cierres o registres la compra.</div><section class="cart-list">${items.map(item=>`<div class="cart-row"><div><strong>${esc(item.presentacion)}</strong><small>${esc(item.producto)} · ${esc(item.comprador||"Fara")}${item.comprador==="Otro"&&item.compradorNombre?` (${esc(item.compradorNombre)})`:""}</small></div><div class="cart-qty"><input type="number" min="0.01" step="0.01" value="${item.cantidad}" data-qty="${esc(item.id)}"><strong>${money(Number(item.precio)*Number(item.cantidad))}</strong></div><button class="icon-danger" data-remove-cart="${esc(item.id)}">×</button></div>`).join("")||`<div class="empty-card">Este carrito está vacío.</div>`}</section><div class="cart-total"><span>Total estimado</span><strong>${money(cartTotal(items))}</strong></div><div class="cart-actions"><button class="action-btn primary" id="registerPurchaseBtn" ${items.length?'':'disabled'}>🧾 Registrar compra</button><button class="action-btn danger-outline" id="closeCartBtn" ${items.length?'':'disabled'}>🔒 Cerrar carrito</button></div>`;
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

function eventsHistoryModal(){
  const rows=events().slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const pg=pageSlice(rows,state.eventsPage); state.eventsPage=pg.page;
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box history-modal"><div class="modal-head"><h2>🕘 Historial de eventos</h2><button class="close-btn" data-close>×</button></div><div class="history-list">${pg.rows.map(e=>`<div class="history-row"><div><strong>${esc(e.tipo)}</strong><small>${formatDate(e.fecha)}</small></div><span>${esc(e.detalle)}</span></div>`).join("")||`<div class="empty-card">No hay eventos registrados.</div>`}</div>${paginationHtml(pg.page,pg.totalPages,'events')}</div>`;
  document.body.appendChild(modal); modal.querySelector("[data-close]").onclick=()=>modal.remove();
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
  items.forEach(item=>addPurchase({producto:item.producto,presentacion:item.presentacion,presentationId:item.presentationId,tienda:company.nombre,clienteId:company.id,comprador:item.comprador,compradorNombre:item.compradorNombre,cantidad:item.cantidad,precio:item.precio,total:Number(item.precio||0)*Number(item.cantidad||0),direccion:company.direccion,latitud:company.latitud,longitud:company.longitud}));
  logEvent("Compra registrada",`${company.nombre} · ${items.length} productos · ${money(cartTotal(items))}`);setCart(company.id,[]);alert("Compra registrada correctamente.");state.screen="company";render();
}

function bindEntityActions(scope=document){
  scope.querySelectorAll("[data-edit-company]").forEach(b=>b.onclick=e=>{e.stopPropagation();newCompanyModal(b.dataset.editCompany);});
  scope.querySelectorAll("[data-toggle-company]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=placeById(b.dataset.toggleCompany);if(!p)return;if(p.estatus==='inactivo'){upsertPlace({id:p.id,estatus:'activo'});logEvent("Empresa activada",p.nombre);}else{if(!confirm(`¿Desactivar ${p.nombre}?`))return;upsertPlace({id:p.id,estatus:'inactivo'});logEvent("Empresa desactivada",p.nombre);}render();});
  scope.querySelectorAll("[data-delete-company]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=placeById(b.dataset.deleteCompany);if(!p)return;if(!confirm(`¿Borrar ${p.nombre}? Esta acción elimina la empresa del catálogo de Compras/Mapa.`))return;const carts=getCarts();delete carts[p.id];saveCarts(carts);deletePlace(p.id);logEvent("Empresa borrada",p.nombre);if(state.companyId===p.id){state.companyId=null;state.screen="home";}render();});
  scope.querySelectorAll("[data-edit-product]").forEach(b=>b.onclick=e=>{e.stopPropagation();editProductModal(b.dataset.editProduct);});
  scope.querySelectorAll("[data-toggle-product]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=productById(b.dataset.toggleProduct);if(!p)return;if(p.active===false){updateProduct(p.id,{active:true});logEvent("Producto activado",p.nombre);}else{if(!confirm(`¿Desactivar ${p.nombre}?`))return;deactivateProduct(p.id);logEvent("Producto desactivado",p.nombre);}render();});
  scope.querySelectorAll("[data-delete-product]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=productById(b.dataset.deleteProduct);if(!p)return;if(!confirm(`¿Borrar ${p.nombre} y sus presentaciones?`))return;deleteProduct(p.id);logEvent("Producto borrado",p.nombre);if(scope.classList?.contains("modal"))scope.remove();render();});
  scope.querySelectorAll("[data-edit-presentation]").forEach(b=>b.onclick=e=>{e.stopPropagation();editPresentationModal(b.dataset.editPresentation);});
  scope.querySelectorAll("[data-toggle-presentation]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=presentationById(b.dataset.togglePresentation);if(!p)return;if(p.active===false){updatePresentation(p.id,{active:true});logEvent("Presentación activada",p.nombre);}else{if(!confirm(`¿Desactivar ${p.nombre}?`))return;deactivatePresentation(p.id);logEvent("Presentación desactivada",p.nombre);}render();});
  scope.querySelectorAll("[data-price-history]").forEach(b=>b.onclick=e=>{e.stopPropagation();state.priceHistoryPage=1;priceHistoryModal(b.dataset.priceHistory);});
  scope.querySelectorAll("[data-delete-presentation]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=presentationById(b.dataset.deletePresentation);if(!p)return;if(!confirm(`¿Borrar la presentación ${p.nombre}?`))return;deletePresentation(p.id);logEvent("Presentación borrada",p.nombre);if(scope.classList?.contains("modal"))scope.remove();render();});
}
function editProductModal(id){const p=productById(id);if(!p)return;const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>✏️ Editar producto</h2><button class="close-btn" data-close>×</button></div><label>Nombre *</label><input id="editProductName" class="modal-input" value="${esc(p.nombre)}"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveEditProduct">Guardar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());modal.querySelector("#saveEditProduct").onclick=()=>{const nombre=modal.querySelector("#editProductName").value.trim();if(!nombre)return alert("Escribe el nombre.");try{updateProduct(id,{nombre});logEvent("Producto editado",`${p.nombre} → ${nombre}`);modal.remove();render();}catch(e){alert(e.message);}};}
function editPresentationModal(id){const p=presentationById(id);if(!p)return;const modal=document.createElement("div");modal.className="modal visible";modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>✏️ Editar presentación</h2><button class="close-btn" data-close>×</button></div><label>Presentación *</label><input id="editPresName" class="modal-input" value="${esc(p.nombre)}"><label>Unidad / medida</label><input id="editPresUnit" class="modal-input" value="${esc(p.unidad||"")}"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveEditPres">Guardar</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());modal.querySelector("#saveEditPres").onclick=()=>{const nombre=modal.querySelector("#editPresName").value.trim();if(!nombre)return alert("Escribe la presentación.");try{updatePresentation(id,{nombre,unidad:modal.querySelector("#editPresUnit").value.trim()});logEvent("Presentación editada",`${p.nombre} → ${nombre}`);modal.remove();render();}catch(e){alert(e.message);}};}

function bind(){
  document.getElementById("companySearch")?.addEventListener("input",e=>{state.companySearch=e.target.value;render();focusInput("companySearch");});
  document.getElementById("listSearch")?.addEventListener("input",e=>{state.listSearch=e.target.value;render();focusInput("listSearch");});
  document.getElementById("productSearch")?.addEventListener("input",e=>{state.productSearch=e.target.value;render();focusInput("productSearch");});
  document.getElementById("newCompanyBtn")?.addEventListener("click",()=>newCompanyModal());document.getElementById("newCompanyEmpty")?.addEventListener("click",()=>newCompanyModal());
  document.getElementById("listBtn")?.addEventListener("click",()=>{state.screen="list";state.listSearch="";render();});document.getElementById("companyListBtn")?.addEventListener("click",()=>{state.screen="list";state.listSearch="";render();});
  document.getElementById("addProductBtn")?.addEventListener("click",newProductModal);document.getElementById("addNeedBtn")?.addEventListener("click",newNeedModal);document.getElementById("calculatorBtn")?.addEventListener("click",calculatorModal);document.getElementById("cartBtn")?.addEventListener("click",()=>{state.screen="cart";render();});
  document.getElementById("openCartsTop")?.addEventListener("click",openCartsModal);document.getElementById("openCartsBanner")?.addEventListener("click",openCartsModal);document.getElementById("purchasesHistoryBtn")?.addEventListener("click",()=>{state.purchasesPage=1;purchasesHistoryModal();});document.getElementById("eventsHistoryBtn")?.addEventListener("click",()=>{state.eventsPage=1;eventsHistoryModal();});
  document.getElementById("backBtn")?.addEventListener("click",()=>{if(state.screen==="cart"){state.screen="company";}else if(state.screen==="company"||state.screen==="list"){state.screen="home";state.companyId=null;}render();});
  document.querySelectorAll("[data-company]").forEach(b=>b.onclick=()=>{state.companyId=b.dataset.company;state.screen="company";state.productSearch="";render();});document.querySelectorAll("[data-product]").forEach(b=>b.onclick=()=>productModal(b.dataset.product));
  document.querySelectorAll("[data-remove-cart]").forEach(b=>b.onclick=()=>{setCart(state.companyId,cartFor(state.companyId).filter(i=>String(i.id)!==String(b.dataset.removeCart)));render();});
  document.querySelectorAll("[data-qty]").forEach(i=>i.onchange=()=>{const items=cartFor(state.companyId),item=items.find(x=>String(x.id)===String(i.dataset.qty)),qty=Number(i.value);if(!item)return;if(qty>0){item.cantidad=qty;setCart(state.companyId,items);}else setCart(state.companyId,items.filter(x=>x.id!==item.id));render();});
  document.querySelectorAll("[data-toggle-need]").forEach(b=>b.onclick=()=>{const needs=setting(NEEDS_SETTING,[]),n=needs.find(x=>String(x.id)===String(b.dataset.toggleNeed));if(!n)return;alert("La lista se marca automáticamente cuando una presentación de esta necesidad entra en un carrito.");});
  document.querySelectorAll("[data-delete-need]").forEach(b=>b.onclick=()=>{const needs=setting(NEEDS_SETTING,[]),n=needs.find(x=>String(x.id)===String(b.dataset.deleteNeed));if(!n)return;if(confirm(`¿Quitar ${n.nombre} de tu lista?`)){saveSetting(NEEDS_SETTING,needs.filter(x=>x.id!==n.id));logEvent("Necesidad eliminada",n.nombre);render();}});
  document.getElementById("registerPurchaseBtn")?.addEventListener("click",registerPurchase);document.getElementById("closeCartBtn")?.addEventListener("click",()=>{if(!confirm(`¿Cerrar el carrito de ${placeById(state.companyId)?.nombre||"esta tienda"}?\n\nCerrar el carrito no registra una compra.`))return;setCart(state.companyId,[]);state.screen="company";render();});
  bindEntityActions(document);
}
function focusInput(id){setTimeout(()=>{const el=document.getElementById(id);if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}},0);}
function render(){let html="";if(state.screen==="home")html=homeView();if(state.screen==="list")html=listView();if(state.screen==="company")html=companyView();if(state.screen==="cart")html=cartView();root.innerHTML=html;bind();}
render();
