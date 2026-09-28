/**
 * Productos Santa Rosa
 * Módulo: 🛒 Compras (remodelación de Insumos)
 * Versión: 1.2.0
 * Build: 20260928.1129
 * Objetivo: Primera versión funcional del flujo Empresas → Productos → Presentaciones → Carritos.
 *
 * Regla V1:
 * - Empresas reutilizan psr_market_clients, que es la fuente que Mapa sincroniza como 🏪 Tienda.
 * - Productos y presentaciones son globales, nunca pertenecen a una empresa.
 * - El precio es un dato asociado a una presentación + empresa.
 * - No existe check-in ni checkout.
 * - Cada empresa puede tener un carrito abierto independiente.
 * - Los carritos se guardan dentro de psr_settings para no crear una nueva base psr_compras_*.
 */

import {
  getProducts,
  getPresentations,
  productById,
  presentationsForProduct,
  getPlaces,
  placeById,
  upsertPlace,
  addObservation,
  latestPriceForPresentationPlace,
  createProduct,
  createPresentation,
  normalize,
  uid
} from "../mercado/mercado-store.js";

const root = document.getElementById("app");
const SETTINGS_KEY = "psr_settings";
const CARTS_SETTING = "comprasCarritosV1";

let state = {
  screen: "home",
  companyId: null,
  productId: null,
  listOpen: false,
  search: "",
  companySearch: "",
  productSearch: "",
  cartSearch: ""
};

const esc = value => String(value ?? "")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#039;");

function readSettings(){
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

function writeSettings(settings){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getCarts(){
  const settings = readSettings();
  const carts = settings[CARTS_SETTING];
  return carts && typeof carts === "object" && !Array.isArray(carts) ? carts : {};
}

function saveCarts(carts){
  const settings = readSettings();
  settings[CARTS_SETTING] = carts;
  writeSettings(settings);
}

function cartFor(companyId){
  const carts = getCarts();
  return Array.isArray(carts[companyId]) ? carts[companyId] : [];
}

function setCart(companyId, items){
  const carts = getCarts();
  if(items.length) carts[companyId] = items;
  else delete carts[companyId];
  saveCarts(carts);
}

function openCartCount(){ return Object.keys(getCarts()).length; }

function openCartEntries(){
  const carts = getCarts();
  return Object.entries(carts)
    .map(([companyId,items]) => ({companyId,items,company:placeById(companyId)}))
    .filter(x => x.company && x.items?.length);
}

function cartTotal(items){ return items.reduce((sum,item)=>sum + Number(item.precio||0) * Number(item.cantidad||1),0); }

function latestPrice(presentationId, companyId){
  return latestPriceForPresentationPlace(presentationId, companyId);
}

function activeStores(){
  return getPlaces().filter(p => p.estatus !== "inactivo" && (p.tipo || "").toLowerCase() !== "cliente" && (p.tipo || "").toLowerCase() !== "prospecto");
}

function storeTypeLabel(tipo){
  const map = {
    "Tienda":"🏪 Tienda",
    "Supermercado":"🛒 Supermercado",
    "Mayorista":"📦 Mayorista",
    "Mercado":"🥬 Mercado",
    "Distribuidor":"🚚 Distribuidor",
    "Otro":"🏢 Otro"
  };
  return map[tipo] || `🏪 ${tipo || "Tienda"}`;
}

function header(title, back){
  return `<header class="compras-header">
    ${back ? `<button class="icon-btn" id="backBtn" aria-label="Regresar">←</button>` : ""}
    <div class="header-title"><h1>${title}</h1></div>
    <button class="cart-indicator ${openCartCount() ? "has-carts" : ""}" id="openCartsTop" title="Carritos abiertos">🛒${openCartCount() ? `<b>${openCartCount()}</b>` : ""}</button>
  </header>`;
}

function homeView(){
  const stores = activeStores().filter(p => !state.companySearch || normalize(p.nombre).includes(normalize(state.companySearch)) || normalize(p.direccion).includes(normalize(state.companySearch)));
  const carts = openCartEntries();
  return `${header("🛒 Compras", false)}
    ${carts.length ? `<button class="open-carts-banner" id="openCartsBanner"><span>🛒</span><span><strong>${carts.length} carrito${carts.length===1?'':'s'} abierto${carts.length===1?'':'s'}</strong><small>${carts.map(c=>esc(c.company.nombre)).join(" · ")}</small></span><span>→</span></button>` : ""}
    <section class="home-tools">
      <div class="search-wrap"><span>🔎</span><input id="companySearch" value="${esc(state.companySearch)}" placeholder="Buscar empresa..."></div>
      <div class="tool-row"><button class="action-btn" id="listBtn">📝 Lista</button><button class="action-btn primary" id="newCompanyBtn">＋ Empresa</button></div>
    </section>
    <section class="section-head"><h2>🏪 Empresas</h2><span>${stores.length}</span></section>
    <section class="company-grid">
      ${stores.map(storeCard).join("") || `<div class="empty-card">${state.companySearch ? "No se encontraron empresas." : "No hay tiendas registradas todavía."}<br><button class="text-btn" id="newCompanyEmpty">＋ Crear empresa</button></div>`}
    </section>`;
}

function storeCard(p){
  const cart = cartFor(p.id);
  return `<button class="company-card" data-company="${esc(p.id)}">
    <span class="company-icon">🏪</span>
    <strong>${esc(p.nombre)}</strong>
    <small>${esc(storeTypeLabel(p.tipo))}</small>
    ${cart.length ? `<em>🛒 ${cart.length} ${cart.length===1?'producto':'productos'}</em>` : ""}
  </button>`;
}

function listView(){
  const products = getProducts().filter(p => !state.productSearch || normalize(p.nombre).includes(normalize(state.productSearch)));
  const carts = openCartEntries();
  const cartProductIds = new Set(carts.flatMap(c => c.items.map(i => i.productId)));
  return `${header("📝 Lista", true)}
    <section class="list-screen">
      <p class="muted">Necesidades generales. Marca lo que quieres buscar o comprar.</p>
      <div class="search-wrap"><span>🔎</span><input id="listSearch" value="${esc(state.productSearch)}" placeholder="Buscar producto..."></div>
      <div class="need-list">
        ${products.map(p => `<label class="need-row"><span class="need-check ${cartProductIds.has(p.id)?'checked':''}">${cartProductIds.has(p.id)?'✓':''}</span><span>${esc(p.nombre)}</span></label>`).join("") || `<div class="empty-card">No hay productos en la lista.</div>`}
      </div>
      <button class="wide-action" id="addProductBtn">＋ Agregar producto</button>
    </section>`;
}

function companyView(){
  const company = placeById(state.companyId);
  if(!company) { state.screen="home"; return homeView(); }
  const products = getProducts().filter(p => !state.productSearch || normalize(p.nombre).includes(normalize(state.productSearch)));
  const cart = cartFor(company.id);
  return `${header(`🏪 ${esc(company.nombre)}`, true)}
    <div class="context-line">${esc(storeTypeLabel(company.tipo))}${company.direccion ? ` · ${esc(company.direccion)}` : ""}</div>
    <section class="company-tools">
      <div class="search-wrap"><span>🔎</span><input id="productSearch" value="${esc(state.productSearch)}" placeholder="Buscar producto..."></div>
      <div class="tool-grid">
        <button class="action-btn" id="addProductBtn">＋ Producto</button>
        <button class="action-btn" id="companyListBtn">📝 Lista</button>
        <button class="action-btn" id="calculatorBtn">🧮 Calculadora</button>
        <button class="action-btn primary" id="cartBtn">🛒 Carrito${cart.length ? ` (${cart.length})` : ""}</button>
      </div>
    </section>
    <section class="section-head"><h2>📦 Productos</h2><span>${products.length}</span></section>
    <section class="product-grid">
      ${products.map(p => `<button class="product-card" data-product="${esc(p.id)}"><span>📦</span><strong>${esc(p.nombre)}</strong><small>${presentationsForProduct(p.id).length} ${presentationsForProduct(p.id).length===1?'presentación':'presentaciones'}</small></button>`).join("") || `<div class="empty-card">No hay productos que coincidan.</div>`}
    </section>`;
}

function productModal(productId){
  const product = productById(productId);
  if(!product) return;
  const company = placeById(state.companyId);
  const presentations = presentationsForProduct(productId);
  const modal = document.createElement("div");
  modal.className = "modal visible";
  modal.innerHTML = `<div class="modal-box presentation-modal">
    <div class="modal-head"><div><h2>📦 ${esc(product.nombre)}</h2><small>${esc(company?.nombre || "")}</small></div><button class="close-btn" data-close>×</button></div>
    <div class="presentation-list">
      ${presentations.map(p => presentationRow(p, company)).join("") || `<div class="empty-card">Este producto todavía no tiene presentaciones.</div>`}
    </div>
    <div class="modal-actions split"><button class="btn secondary" data-new-presentation>＋ Nueva presentación</button><button class="btn secondary" data-close>Cerrar</button></div>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("[data-new-presentation]").onclick=()=>{ modal.remove(); newPresentationModal(productId); };
  modal.querySelectorAll("[data-presentation]").forEach(b=>b.onclick=()=>presentationDetail(productId,b.dataset.presentation));
}

function presentationRow(p, company){
  const price = company ? latestPrice(p.id, company.id) : null;
  const cart = company ? cartFor(company.id).find(i => String(i.presentationId)===String(p.id)) : null;
  return `<button class="presentation-row" data-presentation="${esc(p.id)}">
    <span class="pres-main"><strong>${esc(p.nombre)}</strong>${p.unidad ? `<small>${esc(p.unidad)}</small>` : ""}</span>
    <span class="pres-price">${price ? `$${Number(price.precio||0).toFixed(2)}` : "—"}</span>
    <span>${cart ? "🛒" : "＋"}</span>
  </button>`;
}

function presentationDetail(productId,presentationId){
  const product=productById(productId), presentation=getPresentations().find(p=>String(p.id)===String(presentationId)), company=placeById(state.companyId);
  if(!product||!presentation||!company) return;
  const current=latestPrice(presentation.id,company.id);
  const cart=cartFor(company.id);
  const existing=cart.find(i=>String(i.presentationId)===String(presentation.id));
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box small-modal">
    <div class="modal-head"><div><h2>${esc(presentation.nombre)}</h2><small>${esc(product.nombre)} · ${esc(company.nombre)}</small></div><button class="close-btn" data-close>×</button></div>
    <div class="price-box"><label>Precio en ${esc(company.nombre)}</label><div class="inline-price"><span>$</span><input id="storePrice" type="number" min="0" step="0.01" value="${current ? Number(current.precio).toFixed(2) : ""}" placeholder="0.00"></div><button class="text-btn" id="savePrice">💾 Guardar precio</button></div>
    <div class="cart-add-box"><label>Cantidad</label><input id="cartQty" type="number" min="0.01" step="0.01" value="${existing?.cantidad || 1}"><button class="btn primary-full" id="addToCart">${existing ? "🛒 Actualizar carrito" : "🛒 Agregar al carrito"}</button></div>
    <div class="modal-actions"><button class="btn secondary" data-close>Cerrar</button></div>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector("#savePrice").onclick=()=>{
    const price=Number(modal.querySelector("#storePrice").value);
    if(!(price>=0)) return alert("Escribe un precio válido.");
    addObservation({producto:product.nombre,presentacion:presentation.nombre,presentationId:presentation.id,precio:price,clienteId:company.id});
    alert("Precio guardado para esta tienda. No es una compra.");
    modal.remove(); productModal(productId);
  };
  modal.querySelector("#addToCart").onclick=()=>{
    const qty=Number(modal.querySelector("#cartQty").value); const price=Number(modal.querySelector("#storePrice").value);
    if(!(qty>0)) return alert("La cantidad debe ser mayor que 0.");
    if(!(price>=0)) return alert("Indica el precio de esta presentación en la tienda.");
    const items=cartFor(company.id); const idx=items.findIndex(i=>String(i.presentationId)===String(presentation.id));
    const item={id:idx>=0?items[idx].id:uid(),productId:product.id,presentationId:presentation.id,producto:product.nombre,presentacion:presentation.nombre,precio:price,cantidad:qty,addedAt:idx>=0?items[idx].addedAt:new Date().toISOString()};
    if(idx>=0) items[idx]=item; else items.push(item);
    setCart(company.id,items); modal.remove(); productModal(productId);
    render();
  };
}

function newProductModal(){
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>＋ Nuevo producto</h2><button class="close-btn" data-close>×</button></div><p class="muted">Solo necesitamos el nombre. Marca y presentación se registran después.</p><label>Nombre *</label><input id="newProductName" class="modal-input" placeholder="Ej. Nutella"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveProduct">Guardar</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove()); modal.querySelector("#newProductName").focus();
  modal.querySelector("#saveProduct").onclick=()=>{try{const name=modal.querySelector("#newProductName").value.trim();if(!name)return alert("Escribe el nombre del producto.");const p=createProduct({nombre:name});modal.remove();state.productSearch="";render();if(state.screen==="company")productModal(p.id);}catch(e){alert(e.message||"No se pudo crear el producto.");}};
}

function newPresentationModal(productId){
  const product=productById(productId); const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>＋ Nueva presentación</h2><button class="close-btn" data-close>×</button></div><p class="muted">Producto: <strong>${esc(product?.nombre||"")}</strong></p><label>Presentación *</label><input id="presName" class="modal-input" placeholder="Ej. Nutella 1 kg"><label>Unidad / referencia (opcional)</label><input id="presUnit" class="modal-input" placeholder="Ej. 1 kg"><div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="savePres">Guardar</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove()); modal.querySelector("#presName").focus();
  modal.querySelector("#savePres").onclick=()=>{try{const nombre=modal.querySelector("#presName").value.trim();if(!nombre)return alert("Escribe la presentación.");createPresentation({productId,nombre,unidad:modal.querySelector("#presUnit").value.trim()});modal.remove();productModal(productId);}catch(e){alert(e.message||"No se pudo crear la presentación.");}};
}

function newCompanyModal(){
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>🏪 Nueva empresa</h2><small>Se registrará como 🏪 Tienda y podrá aparecer en Mapa.</small></div><button class="close-btn" data-close>×</button></div>
    <label>Nombre *</label><input id="companyName" class="modal-input" placeholder="Ej. Walmart">
    <label>Contacto</label><input id="companyContact" class="modal-input" placeholder="Teléfono o encargado">
    <label>Tipo *</label><select id="companyType" class="modal-input"><option>Tienda</option><option>Supermercado</option><option>Mayorista</option><option>Mercado</option><option>Distribuidor</option><option>Otro</option></select>
    <label>Dirección</label><textarea id="companyAddress" class="modal-input" rows="2"></textarea>
    <label>Tienda virtual</label><input id="companyWeb" class="modal-input" type="url" placeholder="https://...">
    <div class="location-box"><div><strong>📍 Ubicación</strong><small id="locationText">Sin ubicación</small></div><button class="btn secondary" id="useLocation">Usar ubicación actual</button></div>
    <input type="hidden" id="companyLat"><input type="hidden" id="companyLon">
    <div class="modal-actions"><button class="btn secondary" data-close>Cancelar</button><button class="btn" id="saveCompany">Guardar</button></div>
  </div>`;
  document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove()); modal.querySelector("#companyName").focus();
  modal.querySelector("#useLocation").onclick=()=>{if(!navigator.geolocation)return alert("Este dispositivo no permite obtener ubicación.");modal.querySelector("#locationText").textContent="Obteniendo ubicación…";navigator.geolocation.getCurrentPosition(pos=>{const lat=pos.coords.latitude,lon=pos.coords.longitude;modal.querySelector("#companyLat").value=lat;modal.querySelector("#companyLon").value=lon;modal.querySelector("#locationText").textContent=`${lat.toFixed(6)}, ${lon.toFixed(6)}`;},()=>{modal.querySelector("#locationText").textContent="No fue posible obtenerla";alert("No se pudo obtener la ubicación.");},{enableHighAccuracy:true,timeout:10000});};
  modal.querySelector("#saveCompany").onclick=()=>{const nombre=modal.querySelector("#companyName").value.trim();if(!nombre)return alert("Escribe el nombre de la empresa.");const p=upsertPlace({nombre,contacto:modal.querySelector("#companyContact").value.trim(),encargado:modal.querySelector("#companyContact").value.trim(),tipo:modal.querySelector("#companyType").value,direccion:modal.querySelector("#companyAddress").value.trim(),tiendaVirtual:modal.querySelector("#companyWeb").value.trim(),latitud:modal.querySelector("#companyLat").value?Number(modal.querySelector("#companyLat").value):null,longitud:modal.querySelector("#companyLon").value?Number(modal.querySelector("#companyLon").value):null});modal.remove();state.companyId=p.id;state.screen="company";state.productSearch="";render();};
}

function calculatorModal(){
  const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box calculator"><div class="modal-head"><h2>🧮 Calculadora</h2><button class="close-btn" data-close>×</button></div><div class="calc-grid"><div><h3>Producto 1</h3><label>Precio</label><input id="c1p" type="number" min="0" step="0.01" placeholder="100"><label>Número</label><input id="c1n" type="number" min="0.0001" step="0.01" placeholder="1000"><strong>Por unidad <span id="c1u">—</span></strong></div><div><h3>Producto 2</h3><label>Precio</label><input id="c2p" type="number" min="0" step="0.01" placeholder="56"><label>Número</label><input id="c2n" type="number" min="0.0001" step="0.01" placeholder="500"><strong>Por unidad <span id="c2u">—</span></strong></div></div><div class="conversion"><h3>CONVERSIÓN</h3><div id="conv1">Producto 1 —</div><div id="conv2">Producto 2 —</div></div><div class="modal-actions"><button class="btn secondary" data-close>Cerrar</button></div></div>`;
  document.body.appendChild(modal); modal.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>modal.remove());
  const calc=()=>{const p1=Number(modal.querySelector("#c1p").value),n1=Number(modal.querySelector("#c1n").value),p2=Number(modal.querySelector("#c2p").value),n2=Number(modal.querySelector("#c2n").value);const u1=p1>0&&n1>0?p1/n1:null,u2=p2>0&&n2>0?p2/n2:null;modal.querySelector("#c1u").textContent=u1==null?"—":`$${u1.toFixed(4)}`;modal.querySelector("#c2u").textContent=u2==null?"—":`$${u2.toFixed(4)}`;modal.querySelector("#conv1").textContent=u2!=null&&n1>0?`Producto 1: ${n1} × $${u2.toFixed(4)} = $${(n1*u2).toFixed(2)} · Diferencia: ${((n1*u2)-p1>=0?'+':'')+((n1*u2)-p1).toFixed(2)}`:"Producto 1 —";modal.querySelector("#conv2").textContent=u1!=null&&n2>0?`Producto 2: ${n2} × $${u1.toFixed(4)} = $${(n2*u1).toFixed(2)} · Diferencia: ${((n2*u1)-p2>=0?'+':'')+((n2*u1)-p2).toFixed(2)}`:"Producto 2 —";};
  modal.querySelectorAll("input").forEach(i=>i.oninput=calc); calc();
}

function cartView(){
  const company=placeById(state.companyId),items=cartFor(state.companyId);
  if(!company){state.screen="home";return homeView();}
  return `${header(`🛒 Carrito · ${esc(company.nombre)}`, true)}
    <div class="context-line">Este carrito queda abierto hasta que lo cierres.</div>
    <section class="cart-list">${items.map(item=>`<div class="cart-row"><div><strong>${esc(item.presentacion)}</strong><small>${esc(item.producto)}</small></div><div class="cart-qty"><input type="number" min="0.01" step="0.01" value="${item.cantidad}" data-qty="${esc(item.id)}"><strong>$${(Number(item.precio)*Number(item.cantidad)).toFixed(2)}</strong></div><button class="icon-danger" data-remove-cart="${esc(item.id)}">×</button></div>`).join("") || `<div class="empty-card">Este carrito está vacío.</div>`}</section>
    <div class="cart-total"><span>Total estimado</span><strong>$${cartTotal(items).toFixed(2)}</strong></div>
    <button class="wide-action danger-outline" id="closeCartBtn" ${items.length?'':'disabled'}>🔒 Cerrar carrito</button>`;
}

function bind(){
  document.getElementById("companySearch")?.addEventListener("input",e=>{state.companySearch=e.target.value;render();focusInput("companySearch");});
  document.getElementById("listSearch")?.addEventListener("input",e=>{state.productSearch=e.target.value;render();focusInput("listSearch");});
  document.getElementById("productSearch")?.addEventListener("input",e=>{state.productSearch=e.target.value;render();focusInput("productSearch");});
  document.getElementById("newCompanyBtn")?.addEventListener("click",newCompanyModal);
  document.getElementById("newCompanyEmpty")?.addEventListener("click",newCompanyModal);
  document.getElementById("listBtn")?.addEventListener("click",()=>{state.screen="list";state.productSearch="";render();});
  document.getElementById("companyListBtn")?.addEventListener("click",()=>{state.screen="list";state.productSearch="";render();});
  document.getElementById("addProductBtn")?.addEventListener("click",newProductModal);
  document.getElementById("calculatorBtn")?.addEventListener("click",calculatorModal);
  document.getElementById("cartBtn")?.addEventListener("click",()=>{state.screen="cart";render();});
  document.getElementById("openCartsTop")?.addEventListener("click",openCartsModal);
  document.getElementById("openCartsBanner")?.addEventListener("click",openCartsModal);
  document.getElementById("backBtn")?.addEventListener("click",()=>{if(state.screen==="cart"){state.screen="company";}else if(state.screen==="company" || state.screen==="list"){state.screen="home";state.companyId=null;}render();});
  document.querySelectorAll("[data-company]").forEach(b=>b.onclick=()=>{state.companyId=b.dataset.company;state.screen="company";state.productSearch="";render();});
  document.querySelectorAll("[data-product]").forEach(b=>b.onclick=()=>productModal(b.dataset.product));
  document.querySelectorAll("[data-remove-cart]").forEach(b=>b.onclick=()=>{const items=cartFor(state.companyId).filter(i=>String(i.id)!==String(b.dataset.removeCart));setCart(state.companyId,items);render();});
  document.querySelectorAll("[data-qty]").forEach(i=>i.onchange=()=>{const items=cartFor(state.companyId);const item=items.find(x=>String(x.id)===String(i.dataset.qty));const qty=Number(i.value);if(!item)return;if(qty>0){item.cantidad=qty;setCart(state.companyId,items);}else{setCart(state.companyId,items.filter(x=>x.id!==item.id));}render();});
  document.getElementById("closeCartBtn")?.addEventListener("click",()=>{if(!confirm(`¿Cerrar el carrito de ${placeById(state.companyId)?.nombre || "esta tienda"}?\n\nCerrar el carrito no registra una compra.`))return;setCart(state.companyId,[]);state.screen="company";render();});
}

function focusInput(id){setTimeout(()=>{const el=document.getElementById(id);if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}},0);}

function openCartsModal(){
  const entries=openCartEntries(); const modal=document.createElement("div"); modal.className="modal visible";
  modal.innerHTML=`<div class="modal-box small-modal"><div class="modal-head"><h2>🛒 Carritos abiertos</h2><button class="close-btn" data-close>×</button></div><div class="open-cart-list">${entries.map(c=>`<button class="open-cart-row" data-open-cart="${esc(c.companyId)}"><span>🏪</span><span><strong>${esc(c.company.nombre)}</strong><small>${c.items.length} productos · $${cartTotal(c.items).toFixed(2)}</small></span><span>→</span></button>`).join("") || `<div class="empty-card">No hay carritos abiertos.</div>`}</div></div>`;
  document.body.appendChild(modal); modal.querySelector("[data-close]").onclick=()=>modal.remove(); modal.querySelectorAll("[data-open-cart]").forEach(b=>b.onclick=()=>{state.companyId=b.dataset.openCart;state.screen="cart";modal.remove();render();});
}

function render(){
  let html="";
  if(state.screen==="home") html=homeView();
  if(state.screen==="list") html=listView();
  if(state.screen==="company") html=companyView();
  if(state.screen==="cart") html=cartView();
  root.innerHTML=html; bind();
}

render();
