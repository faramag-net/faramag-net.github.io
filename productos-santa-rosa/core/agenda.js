const KEY = 'psr_agenda_actividades';
export function getActividades(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
export function saveActividad(item){const all=getActividades();all.push({...item,id:item.id||crypto.randomUUID(),estado:'pendiente',createdAt:new Date().toISOString()});localStorage.setItem(KEY,JSON.stringify(all));return all}
export function actualizarActividad(id, estado){const all=getActividades().map(a=>a.id===id?{...a,estado,updatedAt:new Date().toISOString()}:a);localStorage.setItem(KEY,JSON.stringify(all));return all}
export function fechaCorta(value){if(!value)return 'Sin fecha';const d=new Date(value+'T00:00:00');return Number.isNaN(d.getTime())?value:d.toLocaleDateString('es-MX')}
export function estadoActividad(a){const when=new Date(`${a.fecha}T${a.hora||'23:59'}:00`).getTime();return a.estado==='pendiente'&&when<Date.now()?'vencida':a.estado}
