/**
 * Productos Santa Rosa
 * Módulo: Mercado · almacenamiento
 * Versión: 1.1.0.1
 * Build: 20261008.135100
 * Objetivo: Catálogo de productos/presentaciones, empresas, precios, fotos y compras.
 */
import LocalDB from '../../core/storage/local-db.js';

const PRODUCT_KEY='psr_mercado_products';
const CATEGORY_KEY='psr_mercado_categories';
const PRESENTATION_KEY='psr_mercado_presentations';
const PHOTO_DB='psr_market_photos_v1';
const PHOTO_STORE='photos';

export const uid=()=>crypto.randomUUID();
export const normalize=(value='')=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const now=()=>new Date().toISOString();
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key))||[];}catch{return[];}};
const write=(key,data)=>localStorage.setItem(key,JSON.stringify(data));

function syncMapStoresToMarket(){
  const market=LocalDB.getMarketClients();
  let mapRows=[]; try { mapRows=JSON.parse(localStorage.getItem('psr_map_clients'))||[]; } catch { mapRows=[]; }
  if(!Array.isArray(mapRows)) mapRows=[];
  const mapStores=mapRows.filter(p=>p&&p.tipo==='tienda');
  let changedMarket=false, changedMap=false;
  const byId=new Map(market.map(p=>[String(p.id),p]));
  mapStores.forEach(m=>{
    const sharedId=String(m.marketPlaceId||m.id);
    let p=byId.get(sharedId) || market.find(x=>normalize(x.nombre)===normalize(m.nombre));
    if(!p){
      p={id:sharedId,nombre:m.nombre||'Tienda',encargado:m.encargado||'',telefono:m.telefono||'',contacto:m.contacto||m.telefono||'',tipo:'Tienda',direccion:m.direccion||'',tiendaVirtual:m.tiendaVirtual||'',latitud:m.latitud??null,longitud:m.longitud??null,comentarios:m.comentarios||'',estatus:m.estatus||'activo',createdAt:m.createdAt||now(),updatedAt:m.updatedAt||now()};
      market.push(p); byId.set(sharedId,p); changedMarket=true;
    }
    if(String(m.marketPlaceId||'')!==sharedId){ m.marketPlaceId=sharedId; changedMap=true; }
  });
  if(changedMarket) LocalDB.saveMarketClients(market);
  if(changedMap) localStorage.setItem('psr_map_clients',JSON.stringify(mapRows));
}

export function getPlaces(){syncMapStoresToMarket();return LocalDB.getMarketClients().map(p=>({...p,tipo:p.tipo||'Tienda',estatus:p.estatus||'activo'}));}
export function savePlaces(data){LocalDB.saveMarketClients(data);}
export function placeById(id){return getPlaces().find(p=>String(p.id)===String(id));}
export function getObservations(){return LocalDB.getClientProducts();}
export function saveObservations(data){LocalDB.saveClientProducts(data);}
export function getPurchases(){return LocalDB.getInsumos();}
export function savePurchases(data){LocalDB.saveInsumos(data);}

export function getCategories(){return read(CATEGORY_KEY).filter(c=>c.active!==false);}
export function getAllCategories(){return read(CATEGORY_KEY);}
export function categoryById(id){return read(CATEGORY_KEY).find(c=>String(c.id)===String(id));}
export function createCategory(data){const all=read(CATEGORY_KEY);const nombre=String(data.nombre||'').trim();if(!nombre)throw new Error('Escribe el nombre de la categoría.');if(all.some(c=>c.active!==false&&normalize(c.nombre)===normalize(nombre)))throw new Error('Ya existe esa categoría.');const c={id:uid(),nombre,active:true,createdAt:now(),updatedAt:now()};all.push(c);write(CATEGORY_KEY,all);return c;}
export function updateCategory(id,data){const all=read(CATEGORY_KEY);const i=all.findIndex(c=>String(c.id)===String(id));if(i<0)throw new Error('Categoría no encontrada.');const nombre=String(data.nombre??all[i].nombre).trim();if(all.some((c,j)=>j!==i&&c.active!==false&&normalize(c.nombre)===normalize(nombre)))throw new Error('Ya existe otra categoría con ese nombre.');all[i]={...all[i],...data,nombre,updatedAt:now()};write(CATEGORY_KEY,all);return all[i];}
export function deactivateCategory(id){const all=read(CATEGORY_KEY);const c=all.find(x=>String(x.id)===String(id));if(!c)throw new Error('Categoría no encontrada.');c.active=false;c.updatedAt=now();write(CATEGORY_KEY,all);return c;}

export function deleteCategory(id){
  const categories=read(CATEGORY_KEY);
  const category=categories.find(c=>String(c.id)===String(id));
  if(!category) return null;
  const products=read(PRODUCT_KEY);
  const productIds=new Set(products.filter(p=>String(p.categoryId)===String(id) || (!p.categoryId && normalize(p.categoria||"")===normalize(category.nombre))).map(p=>String(p.id)));
  const presentations=read(PRESENTATION_KEY);
  const presentationIds=new Set(presentations.filter(p=>productIds.has(String(p.productId))).map(p=>String(p.id)));
  const observations=getObservations().filter(r=>{
    const pid=String(r.presentationId||'');
    return !presentationIds.has(pid) && !productIds.has(String(r.productId||'')) && !(productIds.size && r.product && products.some(p=>productIds.has(String(p.id)) && normalize(p.nombre)===normalize(r.product)));
  });
  const purchases=getPurchases().filter(r=>!presentationIds.has(String(r.presentationId||'')) && !(productIds.size && r.product && products.some(p=>productIds.has(String(p.id)) && normalize(p.nombre)===normalize(r.product))));
  saveObservations(observations); savePurchases(purchases);
  write(PRESENTATION_KEY,presentations.filter(p=>!presentationIds.has(String(p.id))));
  write(PRODUCT_KEY,products.filter(p=>!productIds.has(String(p.id))));
  write(CATEGORY_KEY,categories.filter(c=>String(c.id)!==String(id)));
  return {category,productIds:[...productIds],presentationIds:[...presentationIds]};
}
export function categoriesForProducts(){return getCategories();}

export function getProducts(){return read(PRODUCT_KEY).filter(p=>p.active!==false);}
export function getAllProducts(){return read(PRODUCT_KEY);}
export function getPresentations(){return read(PRESENTATION_KEY).filter(p=>p.active!==false);}
export function getAllPresentations(){return read(PRESENTATION_KEY);}
export function productById(id){return read(PRODUCT_KEY).find(p=>String(p.id)===String(id));}
export function presentationById(id){return read(PRESENTATION_KEY).find(p=>String(p.id)===String(id));}
export function presentationsForProduct(productId){return getPresentations().filter(p=>String(p.productId)===String(productId));}
export function productsForCategory(categoryId){
  const category=categoryById(categoryId);
  if(!category)return [];
  const targetId=String(category.id);
  const targetName=normalize(category.nombre);
  return getProducts().filter(p=>String(p.categoryId||'')===targetId || (!p.categoryId && normalize(p.categoria||'')===targetName));
}

function ensureCatalog(){
  const products=read(PRODUCT_KEY); const categories=read(CATEGORY_KEY); const presentations=read(PRESENTATION_KEY);
  let changedProducts=false, changedCategories=false, changedPresentations=false;
  const cmap=new Map(categories.map(c=>[normalize(c.nombre),c]));
  const pmap=new Map(products.map(p=>[normalize(p.nombre),p]));
  const presmap=new Map(presentations.map(p=>[`${p.productId}|${normalize(p.nombre)}`,p]));
  let defaultCategory=cmap.get(normalize('Sin categoría'));
  const ensureCategory=(name)=>{
    const clean=String(name||'').trim()||'Sin categoría';
    let c=cmap.get(normalize(clean));
    if(!c){c={id:uid(),nombre:clean,active:true,createdAt:now(),updatedAt:now()};categories.push(c);cmap.set(normalize(clean),c);changedCategories=true;}
    return c;
  };
  const ensureProduct=(name,categoryName='')=>{
    const clean=String(name||'').trim(); if(!clean)return null;
    let p=pmap.get(normalize(clean));
    const cat=ensureCategory(categoryName||'Sin categoría');
    if(!p){p={id:uid(),nombre:clean,categoryId:cat.id,categoria:cat.nombre,active:true,createdAt:now(),updatedAt:now()};products.push(p);pmap.set(normalize(clean),p);changedProducts=true;}
    else if(!p.categoryId){p.categoryId=cat.id;p.categoria=cat.nombre;p.updatedAt=now();changedProducts=true;}
    return p;
  };
  const ensurePres=(product,name)=>{
    const clean=String(name||'').trim()||'Sin presentación'; const key=`${product.id}|${normalize(clean)}`;
    let pr=presmap.get(key);
    if(!pr){pr={id:uid(),productId:product.id,nombre:clean,unidad:'',contenidoTotal:null,oferta:'',active:true,createdAt:now(),updatedAt:now()};presentations.push(pr);presmap.set(key,pr);changedPresentations=true;}
    else if(pr.contenidoTotal===undefined){pr.contenidoTotal=null;pr.oferta='';changedPresentations=true;}
    return pr;
  };
  [...getObservations(),...getPurchases()].forEach(r=>{const p=ensureProduct(r.producto,r.categoria||'');if(p)ensurePres(p,r.presentacion);});
  // Legacy products that already had categoria become real categories.
  products.forEach(p=>{if(!p.categoryId){const cat=ensureCategory(p.categoria||'Sin categoría');p.categoryId=cat.id;p.categoria=cat.nombre;p.updatedAt=now();changedProducts=true;}});
  const obs=getObservations(); let obsChanged=false;
  obs.forEach(r=>{if(!r.presentationId){const p=pmap.get(normalize(r.producto));const pr=p?presmap.get(`${p.id}|${normalize(String(r.presentacion||'Sin presentación'))}`):null;if(pr){r.presentationId=pr.id;obsChanged=true;}}});
  const purchases=getPurchases(); let purChanged=false;
  purchases.forEach(r=>{if(!r.presentationId){const p=pmap.get(normalize(r.producto));const pr=p?presmap.get(`${p.id}|${normalize(String(r.presentacion||'Sin presentación'))}`):null;if(pr){r.presentationId=pr.id;purChanged=true;}}});
  if(changedCategories)write(CATEGORY_KEY,categories);if(changedProducts)write(PRODUCT_KEY,products);if(changedPresentations)write(PRESENTATION_KEY,presentations);if(obsChanged)saveObservations(obs);if(purChanged)savePurchases(purchases);
}
ensureCatalog();

// Reconciliación del catálogo de Mercado después de importaciones/restauraciones.
// Conserva un registro canónico por categoría, producto y presentación, y
// repara las referencias de observaciones/compras cuando hubo duplicados.
export function normalizeMarketCatalog(){
  ensureCatalog();
  let categories=read(CATEGORY_KEY), products=read(PRODUCT_KEY), presentations=read(PRESENTATION_KEY);
  const categoryMap=new Map(), categoryIdMap=new Map();
  for(const c of categories){
    const key=normalize(c.nombre);
    if(!key) continue;
    const canonical=categoryMap.get(key);
    if(!canonical){categoryMap.set(key,c);continue;}
    categoryIdMap.set(String(c.id),String(canonical.id));
  }
  categories=categories.filter(c=>!categoryIdMap.has(String(c.id)));
  for(const p of products){
    if(p.categoryId && categoryIdMap.has(String(p.categoryId))) p.categoryId=categoryIdMap.get(String(p.categoryId));
  }

  const productMap=new Map(), productIdMap=new Map();
  for(const p of products){
    const key=normalize(p.nombre);
    if(!key) continue;
    const canonical=productMap.get(key);
    if(!canonical){productMap.set(key,p);continue;}
    // Prefer the record that already has a valid category.
    const canonicalHasCat=!!canonical.categoryId;
    const currentHasCat=!!p.categoryId;
    if(!canonicalHasCat && currentHasCat){
      Object.assign(canonical,p);
      productIdMap.set(String(canonical.id),String(p.id));
      // The old canonical id is now replaced by p.id.
      productIdMap.set(String(canonical.id),String(p.id));
      productMap.set(key,p);
    }else{
      productIdMap.set(String(p.id),String(canonical.id));
    }
  }
  // Rebuild product map after possible canonical replacement.
  const canonicalProducts=[]; const seenProductIds=new Set();
  for(const p of products){
    const canonicalId=productIdMap.get(String(p.id))||String(p.id);
    if(seenProductIds.has(canonicalId)) continue;
    const canonical=products.find(x=>String(x.id)===canonicalId)||p;
    seenProductIds.add(canonicalId); canonicalProducts.push(canonical);
  }
  products=canonicalProducts;

  // Repoint and deduplicate presentations by canonical product + name.
  for(const pr of presentations){
    const mapped=productIdMap.get(String(pr.productId));
    if(mapped) pr.productId=mapped;
  }
  const presentationMap=new Map(), presentationIdMap=new Map(), canonicalPresentations=[];
  for(const pr of presentations){
    const key=`${String(pr.productId)}|${normalize(pr.nombre)}`;
    const canonical=presentationMap.get(key);
    if(!canonical){presentationMap.set(key,pr);canonicalPresentations.push(pr);continue;}
    // Keep the most complete presentation data.
    if((canonical.contenidoTotal==null||canonical.contenidoTotal==='') && pr.contenidoTotal!=null) canonical.contenidoTotal=pr.contenidoTotal;
    if(!canonical.unidad && pr.unidad) canonical.unidad=pr.unidad;
    if(!canonical.oferta && pr.oferta) canonical.oferta=pr.oferta;
    canonical.updatedAt=canonical.updatedAt||pr.updatedAt||now();
    presentationIdMap.set(String(pr.id),String(canonical.id));
  }
  presentations=canonicalPresentations;

  const rewriteRows=(rows)=>{
    let changed=false;
    const out=rows.map(r=>{
      const next={...r};
      const pm=productIdMap.get(String(next.productId));
      if(pm){next.productId=pm;changed=true;}
      const pr=presentationIdMap.get(String(next.presentationId));
      if(pr){next.presentationId=pr;changed=true;}
      return next;
    });
    return {out,changed};
  };
  const obs=getObservations(); const obsResult=rewriteRows(obs); if(obsResult.changed)saveObservations(obsResult.out);
  const purchases=getPurchases(); const purchaseResult=rewriteRows(purchases); if(purchaseResult.changed)savePurchases(purchaseResult.out);

  // Reconstruct the new catalog from legacy Mercado/Cliente products if an
  // older backup did not contain psr_mercado_products/presentations.
  if(!products.length){
    ensureCatalog();
    products=read(PRODUCT_KEY); presentations=read(PRESENTATION_KEY);
  }
  write(CATEGORY_KEY,categories); write(PRODUCT_KEY,products); write(PRESENTATION_KEY,presentations);
  return {categories:categories.length,products:products.length,presentations:presentations.length};
}

export function productNames(){return getProducts().map(p=>p.nombre).sort((a,b)=>a.localeCompare(b,'es'));}
export function observationsForProduct(name){return getObservations().filter(o=>normalize(o.producto)===normalize(name));}
export function purchasesForProduct(name){return getPurchases().filter(o=>normalize(o.producto)===normalize(name));}
export function createProduct(data){const all=read(PRODUCT_KEY);const nombre=String(data.nombre||'').trim();if(!nombre)throw new Error('Escribe el nombre del producto.');if(all.some(p=>p.active!==false&&normalize(p.nombre)===normalize(nombre)))throw new Error('Ya existe ese producto.');const categoryId=String(data.categoryId||'').trim();const cat=categoryId?categoryById(categoryId):null;const p={id:uid(),nombre,categoryId:cat?.id||'',categoria:cat?.nombre||String(data.categoria||'').trim(),unidadComparacion:data.unidadComparacion||'auto',active:true,createdAt:now(),updatedAt:now()};all.push(p);write(PRODUCT_KEY,all);return p;}
export function updateProduct(id,data){const all=read(PRODUCT_KEY);const i=all.findIndex(p=>String(p.id)===String(id));if(i<0)throw new Error('Producto no encontrado.');const nombre=String(data.nombre??all[i].nombre).trim();if(all.some((p,j)=>j!==i&&p.active!==false&&normalize(p.nombre)===normalize(nombre)))throw new Error('Ya existe otro producto con ese nombre.');const categoryId=data.categoryId!==undefined?String(data.categoryId||''):all[i].categoryId||'';const cat=categoryId?categoryById(categoryId):null;all[i]={...all[i],...data,nombre,categoryId,categoria:cat?.nombre??all[i].categoria??'',updatedAt:now()};write(PRODUCT_KEY,all);return all[i];}
export function deactivateProduct(id){const all=read(PRODUCT_KEY);const p=all.find(x=>String(x.id)===String(id));if(!p)throw new Error('Producto no encontrado.');p.active=false;p.updatedAt=now();write(PRODUCT_KEY,all);return p;}
export function deleteProduct(id){
  const products=read(PRODUCT_KEY);
  const product=products.find(p=>String(p.id)===String(id));
  if(!product)return null;
  const presentations=read(PRESENTATION_KEY);
  const presentationIds=new Set(presentations.filter(p=>String(p.productId)===String(id)).map(p=>String(p.id)));
  saveObservations(getObservations().filter(r=>!presentationIds.has(String(r.presentationId||'')) && !(normalize(r.product||r.producto)===normalize(product.nombre))));
  savePurchases(getPurchases().filter(r=>!presentationIds.has(String(r.presentationId||'')) && !(normalize(r.product||r.producto)===normalize(product.nombre))));
  write(PRESENTATION_KEY,presentations.filter(p=>!presentationIds.has(String(p.id))));
  write(PRODUCT_KEY,products.filter(p=>String(p.id)!==String(id)));
  return {product,presentationIds:[...presentationIds]};
}

export function createPresentation(data){const all=read(PRESENTATION_KEY);if(all.some(p=>p.active!==false&&String(p.productId)===String(data.productId)&&normalize(p.nombre)===normalize(data.nombre)))throw new Error('Ya existe esa presentación para el producto.');const contenido=data.contenidoTotal===''||data.contenidoTotal==null?null:Number(data.contenidoTotal);const p={id:uid(),productId:data.productId,nombre:String(data.nombre||'').trim(),unidad:String(data.unidad||'').trim().toLowerCase(),contenidoTotal:Number.isFinite(contenido)?contenido:null,oferta:String(data.oferta||'').trim(),active:true,createdAt:now(),updatedAt:now()};all.push(p);write(PRESENTATION_KEY,all);return p;}
export function updatePresentation(id,data){const all=read(PRESENTATION_KEY);const i=all.findIndex(p=>String(p.id)===String(id));if(i<0)throw new Error('Presentación no encontrada.');const nombre=String(data.nombre??all[i].nombre).trim();if(all.some((p,j)=>j!==i&&p.active!==false&&String(p.productId)===String(all[i].productId)&&normalize(p.nombre)===normalize(nombre)))throw new Error('Ya existe otra presentación con ese nombre para este producto.');const contenido=data.contenidoTotal===undefined?all[i].contenidoTotal:(data.contenidoTotal===''||data.contenidoTotal==null?null:Number(data.contenidoTotal));all[i]={...all[i],...data,nombre,unidad:String(data.unidad??all[i].unidad??'').trim().toLowerCase(),contenidoTotal:Number.isFinite(contenido)?contenido:null,oferta:String(data.oferta??all[i].oferta??'').trim(),updatedAt:now()};write(PRESENTATION_KEY,all);return all[i];}
export function deactivatePresentation(id){const all=read(PRESENTATION_KEY);const p=all.find(x=>String(x.id)===String(id));if(!p)throw new Error('Presentación no encontrada.');p.active=false;p.updatedAt=now();write(PRESENTATION_KEY,all);return p;}
export function deletePresentation(id){
  const all=read(PRESENTATION_KEY);
  const i=all.findIndex(p=>String(p.id)===String(id));
  if(i<0)return null;
  const presentation=all[i];
  const product=productById(presentation.productId);
  saveObservations(getObservations().filter(r=>String(r.presentationId||'')!==String(id) && !(product && normalize(r.product||r.producto)===normalize(product.nombre) && normalize(r.presentacion)===normalize(presentation.nombre))));
  savePurchases(getPurchases().filter(r=>String(r.presentationId||'')!==String(id) && !(product && normalize(r.product||r.producto)===normalize(product.nombre) && normalize(r.presentacion)===normalize(presentation.nombre))));
  all.splice(i,1);
  write(PRESENTATION_KEY,all);
  return presentation;
}

export function addObservation({producto,presentacion='',presentationId='',precio=0,clienteId='',photoIds=[],comentarios='',contenidoTotal=null,unidad='',oferta=''}){const rows=getObservations();const stamp=now();const row={id:uid(),clienteId,producto:String(producto).trim(),presentacion:String(presentacion||'').trim(),presentationId,precio:Number(precio)||0,contenidoTotal:contenidoTotal===''||contenidoTotal==null?null:Number(contenidoTotal),unidad:String(unidad||'').trim().toLowerCase(),oferta:String(oferta||'').trim(),comentarios:String(comentarios||'').trim(),photoIds:[...photoIds],createdAt:stamp,updatedAt:stamp};rows.push(row);saveObservations(rows);return row;}
export function updateObservation(id,data){const rows=getObservations();const i=rows.findIndex(o=>String(o.id)===String(id));if(i<0)throw new Error('Registro de precio no encontrado.');rows[i]={...rows[i],...data,updatedAt:now()};saveObservations(rows);return rows[i];}
export function deleteObservation(id){saveObservations(getObservations().filter(o=>o.id!==id));}
export function addPurchase(data){const rows=getPurchases();const stamp=now();const row={id:data.id||uid(),fecha:data.fecha||stamp,producto:String(data.producto).trim(),presentacion:String(data.presentacion||'').trim(),presentationId:data.presentationId||'',tienda:String(data.tienda||'').trim(),clienteId:data.clienteId||'',comprador:data.comprador||'Fara',compradorNombre:data.compradorNombre||'',contacto:data.contacto||'',cantidad:Number(data.cantidad)||0,precio:Number(data.precio)||0,total:Number(data.total??((Number(data.cantidad)||0)*(Number(data.precio)||0))),diferencia:Number(data.diferencia)||0,contenidoTotal:data.contenidoTotal===''||data.contenidoTotal==null?null:Number(data.contenidoTotal),unidad:String(data.unidad||'').trim().toLowerCase(),oferta:String(data.oferta||'').trim(),cantidadDeseada:data.cantidadDeseada??null,unidadDeseada:String(data.unidadDeseada||'').trim(),comentarios:data.comentarios||'',direccion:data.direccion||'',latitud:data.latitud??null,longitud:data.longitud??null,photoIds:[...(data.photoIds||[])]};rows.push(row);savePurchases(rows);return row;}
export function updatePurchase(id,data){const rows=getPurchases();const i=rows.findIndex(p=>String(p.id)===String(id));if(i<0)throw new Error('Compra no encontrada.');rows[i]={...rows[i],...data};savePurchases(rows);return rows[i];}
export function deletePurchase(id){savePurchases(getPurchases().filter(p=>p.id!==id));}

export function marketPriceRecords(){
  const observations=getObservations().map(o=>({...o,source:'mercado',priceDate:o.createdAt}));
  const purchases=getPurchases().map(p=>({id:`purchase:${p.id}`,clienteId:p.clienteId,presentationId:p.presentationId,precio:Number(p.precio)||0,createdAt:p.fecha,priceDate:p.fecha,producto:p.producto,presentacion:p.presentacion,contenidoTotal:p.contenidoTotal,unidad:p.unidad,oferta:p.oferta,photoIds:p.photoIds||[],source:'compra',purchaseId:p.id,tienda:p.tienda}));
  return [...observations,...purchases];
}
export function calculateComparable(precio,contenidoTotal,unidad){
  const price=Number(precio), qty=Number(contenidoTotal), u=normalize(unidad).replace(/\s+/g,'');
  if(!(price>=0)||!(qty>0))return null;
  if(['g','gramo','gramos'].includes(u))return {valor:price/(qty/1000),label:'$/kg',tipo:'peso'};
  if(['kg','kilo','kilos'].includes(u))return {valor:price/qty,label:'$/kg',tipo:'peso'};
  if(['ml','mililitro','mililitros'].includes(u))return {valor:price/(qty/1000),label:'$/L',tipo:'volumen'};
  if(['l','lt','litro','litros'].includes(u))return {valor:price/qty,label:'$/L',tipo:'volumen'};
  if(['unidad','unidades','u','pieza','piezas','pz'].includes(u))return {valor:price/qty,label:'$/unidad',tipo:'unidad'};
  if(['ue','unidadestandar','unidadestándar'].includes(u))return {valor:(price/qty)*100,label:'$/100 UE',tipo:'ue'};
  return null;
}
export function comparableForRecord(record,presentation=null){const p=Number(record?.precio),qty=record?.contenidoTotal??presentation?.contenidoTotal,unit=record?.unidad??presentation?.unidad;return calculateComparable(p,qty,unit);}
export function latestPriceForPresentationPlace(presentationId,placeId){return marketPriceRecords().filter(o=>String(o.presentationId)===String(presentationId)&&String(o.clienteId)===String(placeId)).sort((a,b)=>new Date(b.priceDate)-new Date(a.priceDate))[0]||null;}
export function pricesForPresentation(presentationId){return marketPriceRecords().filter(o=>String(o.presentationId)===String(presentationId)).sort((a,b)=>new Date(b.priceDate)-new Date(a.priceDate));}
export function pricesForProduct(productId){const ids=new Set(presentationsForProduct(productId).map(p=>String(p.id)));return marketPriceRecords().filter(o=>ids.has(String(o.presentationId))).sort((a,b)=>new Date(b.priceDate)-new Date(a.priceDate));}
export function pricesForCategory(categoryId){const ids=new Set(getProducts().filter(p=>String(p.categoryId)===String(categoryId)).flatMap(p=>presentationsForProduct(p.id).map(pr=>String(pr.id))));return marketPriceRecords().filter(o=>ids.has(String(o.presentationId))).sort((a,b)=>new Date(b.priceDate)-new Date(a.priceDate));}
export function pricesForPlace(placeId){return marketPriceRecords().filter(o=>String(o.clienteId)===String(placeId)).sort((a,b)=>new Date(b.priceDate)-new Date(a.priceDate));}
export function ensurePresentation(productId,name){const found=presentationsForProduct(productId).find(p=>normalize(p.nombre)===normalize(name||'Sin presentación'));return found||createPresentation({productId,nombre:name||'Sin presentación'});}

function syncPlaceToMap(place, {remove=false}={}){
  let rows=[]; try { rows=JSON.parse(localStorage.getItem('psr_map_clients'))||[]; } catch { rows=[]; }
  if(!Array.isArray(rows)) rows=[];
  const index=rows.findIndex(m=>String(m.id)===String(place.id)||String(m.marketPlaceId||'')===String(place.id));
  if(remove){
    if(index>=0) rows.splice(index,1);
  } else {
    const data={
      id:index>=0?rows[index].id:place.id, marketPlaceId:place.id, nombre:place.nombre,
      telefono:place.telefono||'', contacto:place.contacto||'', direccion:place.direccion||'',
      comentarios:place.comentarios||'', categoriaId:'tienda', tipo:'tienda',
      latitud:place.latitud??null, longitud:place.longitud??null, estatus:place.estatus||'activo',
      tiendaVirtual:place.tiendaVirtual||'', mapVisible:place.estatus!=='inactivo',
      createdAt:index>=0?(rows[index].createdAt||place.createdAt):place.createdAt, updatedAt:place.updatedAt
    };
    if(index>=0) rows[index]={...rows[index],...data}; else rows.push(data);
  }
  localStorage.setItem('psr_map_clients',JSON.stringify(rows));
}

export function upsertPlace(data){
  const places=getPlaces(); const stamp=now();
  if(data.id){
    const i=places.findIndex(p=>String(p.id)===String(data.id));
    if(i>=0){ places[i]={...places[i],...data,updatedAt:stamp}; savePlaces(places); syncPlaceToMap(places[i]); return places[i]; }
  }
  const p={id:data.id||uid(),nombre:String(data.nombre||'').trim(),encargado:String(data.encargado||'').trim(),telefono:String(data.telefono||'').trim(),contacto:String(data.contacto||data.telefono||data.encargado||'').trim(),tipo:String(data.tipo||'Tienda').trim(),direccion:String(data.direccion||'').trim(),tiendaVirtual:String(data.tiendaVirtual||'').trim(),latitud:data.latitud??null,longitud:data.longitud??null,comentarios:String(data.comentarios||'').trim(),estatus:data.estatus||'activo',createdAt:data.createdAt||stamp,updatedAt:stamp};
  places.push(p); savePlaces(places); syncPlaceToMap(p); return p;
}
export function deactivatePlace(id){const places=getPlaces();const p=places.find(x=>String(x.id)===String(id));if(!p)throw new Error('Empresa no encontrada.');p.estatus='inactivo';p.updatedAt=now();savePlaces(places);syncPlaceToMap(p);return p;}
export function activatePlace(id){const places=getPlaces();const p=places.find(x=>String(x.id)===String(id));if(!p)throw new Error('Empresa no encontrada.');p.estatus='activo';p.updatedAt=now();savePlaces(places);syncPlaceToMap(p);return p;}
export function deletePlace(id){const places=getPlaces();savePlaces(places.filter(p=>String(p.id)!==String(id)));const p=places.find(x=>String(x.id)===String(id));if(p)syncPlaceToMap(p,{remove:true});}

export function photoFileName(placeName,date=new Date()){const clean=normalize(placeName||'lugar').replace(/[^a-z0-9]+/g,'');const d=date.toISOString().slice(0,10).replaceAll('-','');return `${clean||'lugar'}-${d}-${Date.now().toString().slice(-4)}.jpg`;}
function openPhotoDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(PHOTO_DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(PHOTO_STORE,{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function savePhoto(file,placeName){const image=await compressImage(file,1280,0.72);const id=uid();const db=await openPhotoDB();await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put({id,name:photoFileName(placeName),placeName:placeName||'Lugar',createdAt:now(),blob:image});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});return id;}
export async function getPhoto(id){if(!id)return null;try{const db=await openPhotoDB();return await new Promise((resolve,reject)=>{const req=db.transaction(PHOTO_STORE,'readonly').objectStore(PHOTO_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}catch{return null;}}
export async function deletePhoto(id){if(!id)return;const db=await openPhotoDB();await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}

export async function normalizeLegacyMarketPhotos(){try{const db=await openPhotoDB();const rows=await new Promise((resolve,reject)=>{const r=db.transaction(PHOTO_STORE,'readonly').objectStore(PHOTO_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});for(const row of rows){if(!row?.blob||row.blob.size<=80*1024)continue;const blob=await compressImage(row.blob,1280,.72);await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put({...row,blob,size:blob.size});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}}catch(error){console.warn('No fue posible normalizar fotos antiguas de Mercado:',error);}}
normalizeLegacyMarketPhotos();
async function compressImage(file,maxSide=1280,quality=.72){
  const render=(side,q)=>new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(url);const scale=Math.min(1,side/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d',{alpha:false});ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo comprimir la foto')),'image/jpeg',q);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la foto'));};img.src=url;});
  let blob=await render(maxSide,quality), side=maxSide, q=quality;
  for(let i=0;i<12&&blob.size>80*1024;i++){if(q>0.42)q-=0.06;else side=Math.max(320,Math.round(side*.82));blob=await render(side,q);}
  if(blob.size>80*1024)throw new Error('La foto no pudo comprimirse por debajo de 80 KB.');
  return blob;
}
