import LocalDB
from "../../../core/storage/local-db.js";

import {
    mostrarTicketConsignacion
}
from "../../ventas/modules/ticket.js";

import {
    openModal
}
    
from "../../../components/ui/modal.js";

import {
    showToast
}
from "../../../components/toast.js";

export function openClienteModal(clienteId){

    let historialClientePagina = 1;
    const registrosHistorialCliente = 10;

    const cliente =
        LocalDB.getRouteClients()
        .find(c => c.id === clienteId);

    if(!cliente) return;

    const visitas =
    LocalDB.getVisits()
    .filter(v =>
        v.clienteId === clienteId
    )
    .sort((a,b)=>

        new Date(b.fecha)
        -
        new Date(a.fecha)

    );
    
    const totalVisitas =
        LocalDB.getVisits()
        .filter(v =>
        v.clienteId === clienteId
        ).length;
    
    openModal(`

        <div class="cliente-modal">

            <div class="cliente-header">
            
            <div>
            
                <h2>
                    ${cliente.nombre}
                </h2>
               
                <small>
                    ${totalVisitas} visitas
                </small>
                
               </div>
   
                <span class="cliente-status">

                    ${
                        cliente.saldo > 0
                        ? "💰 Pendiente"
                        : "✅ OK"
                    }

                </span>

            </div>

            <div class="tabs">

                <button
                    class="tab-btn"
                    data-tab="info"
                >
                    INFO
                </button>

                <button
                    class="tab-btn"
                    data-tab="visitas"
                >
                    VIS
                </button>

            <button
                class="tab-btn"
                data-tab="productos"
            >
                PROD
            </button>
            
            <button
                class="tab-btn"
                data-tab="consignacion"
            >
                CONSI
            </button>

            </div>

            <div
                class="cliente-content"
                id="clienteTabContent"
            >

            </div>

        </div>

    `);
    
setTimeout(() => {

    const buttons =
        document.querySelectorAll(
            ".tab-btn"
        );

    buttons[0]?.classList.add(
        "active"
    );

    renderInfoTab();

    buttons.forEach(btn => {

        btn.onclick = () => {

            buttons.forEach(b =>
                b.classList.remove(
                    "active"
                )
            );

            btn.classList.add(
                "active"
            );

            const tab =
                btn.dataset.tab;

            if(tab === "info"){

                renderInfoTab();
            }

            if(tab === "visitas"){

                renderVisitasTab();
            }

            if(tab === "productos"){
            
                renderProductosTab();
            }
            
            if(tab === "consignacion"){
            
                renderConsignacionTab();
            }

        };

    });

},0);

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function conectarEdicionCliente() {
        document.getElementById("btnGuardarCliente")?.addEventListener("click", () => {
            const nombre = document.getElementById("editarClienteNombre")?.value.trim();
            const telefono = document.getElementById("editarClienteTelefono")?.value.trim();
            const direccion = document.getElementById("editarClienteDireccion")?.value.trim();
            const latitud = document.getElementById("editarClienteLatitud")?.value || null;
            const longitud = document.getElementById("editarClienteLongitud")?.value || null;

            if (!nombre) {
                alert("El nombre del cliente es requerido");
                return;
            }

            const actualizado = LocalDB.updateRouteClient(clienteId, {
                nombre, telefono, direccion, latitud, longitud
            });

            if (!actualizado) {
                alert("No se pudo actualizar el cliente");
                return;
            }

            cliente.nombre = actualizado.nombre;
            cliente.telefono = actualizado.telefono;
            cliente.direccion = actualizado.direccion;
            cliente.latitud = actualizado.latitud;
            cliente.longitud = actualizado.longitud;

            showToast("Cliente actualizado");
            renderInfoTab();
        });

        document.getElementById("btnObtenerUbicacionCliente")?.addEventListener("click", () => {
            if (!navigator.geolocation) {
                alert("La geolocalización no está disponible en este dispositivo");
                return;
            }

            const boton = document.getElementById("btnObtenerUbicacionCliente");
            if (boton) { boton.disabled = true; boton.textContent = "📍 Obteniendo ubicación..."; }

            const restaurarBoton = () => {
                if (boton) {
                    boton.disabled = false;
                    boton.textContent = "📍 Obtener ubicación";
                }
            };

            const mostrarErrorUbicacion = (error) => {
                restaurarBoton();
                let mensaje = "No se pudo obtener la ubicación.";

                if (error?.code === 1) {
                    mensaje = "El navegador bloqueó el acceso a la ubicación. En tu móvil, permite la ubicación para faramag-net.github.io y vuelve a intentarlo.";
                } else if (error?.code === 2) {
                    mensaje = "El dispositivo no pudo determinar tu ubicación. Activa la ubicación/GPS y vuelve a intentarlo.";
                } else if (error?.code === 3) {
                    mensaje = "La ubicación tardó demasiado en responder. Vuelve a intentarlo; el sistema hará un segundo intento más preciso.";
                }

                console.warn("Geolocalización:", error);
                alert(mensaje);
            };

            const procesarUbicacion = async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const latEl = document.getElementById("editarClienteLatitud");
                const lonEl = document.getElementById("editarClienteLongitud");
                if (latEl) latEl.value = lat;
                if (lonEl) lonEl.value = lon;

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&accept-language=es`, {
                        headers: { "Accept": "application/json" }
                    });
                    if (!response.ok) throw new Error("Error de geocodificación");
                    const data = await response.json();
                    const direccion = data.display_name || "";
                    if (direccion) {
                        const direccionEl = document.getElementById("editarClienteDireccion");
                        if (direccionEl) direccionEl.value = direccion;
                    }
                } catch (error) {
                    console.error("Geocodificación:", error);
                    alert("Se obtuvo la ubicación, pero no fue posible convertirla en dirección. Puedes escribir la dirección manualmente.");
                } finally {
                    restaurarBoton();
                }
            };

            // En móviles, una lectura de alta precisión puede tardar o fallar.
            // Primero usamos una lectura rápida y, si expira, hacemos un segundo
            // intento con GPS de mayor precisión y más tiempo.
            navigator.geolocation.getCurrentPosition(
                procesarUbicacion,
                mostrarErrorUbicacion,
                { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
            );
        });
    }

    function renderInfoTab(){

    const container =
        document.getElementById(
            "clienteTabContent"
        );
        
    const ventasCliente =
        LocalDB.getSales()
        .filter(
            sale =>
                sale.cliente ===
                cliente.nombre
        )
        .slice()
        .sort((a,b) => {
            const fa = new Date(a.createdAt || a.fecha || 0).getTime() || 0;
            const fb = new Date(b.createdAt || b.fecha || 0).getTime() || 0;
            return fb - fa;
        });

    const totalPaginasHistorialCliente =
        Math.max(1, Math.ceil(ventasCliente.length / registrosHistorialCliente));

    if(historialClientePagina > totalPaginasHistorialCliente){
        historialClientePagina = totalPaginasHistorialCliente;
    }

    const inicioHistorialCliente =
        (historialClientePagina - 1) * registrosHistorialCliente;

    const ventasClientePagina =
        ventasCliente.slice(
            inicioHistorialCliente,
            inicioHistorialCliente + registrosHistorialCliente
        );

        
    container.innerHTML = `

        <div class="cliente-info-resumen">
            <p>📞 ${cliente.telefono || "-"}</p>
            <p>📍 ${cliente.direccion || "-"}</p>
            ${cliente.latitud && cliente.longitud ? `<small>📌 Ubicación guardada</small>` : ""}
        </div>

        <div class="cliente-edicion" style="margin:16px 0; padding:14px; border:1px solid #ddd; border-radius:10px;">
            <h3 style="margin-top:0;">✏️ Editar cliente</h3>

            <input id="editarClienteNombre" type="text" value="${escapeHtml(cliente.nombre || "")}" placeholder="Nombre">
            <input id="editarClienteTelefono" type="tel" value="${escapeHtml(cliente.telefono || "")}" placeholder="Teléfono">
            <input id="editarClienteDireccion" type="text" value="${escapeHtml(cliente.direccion || "")}" placeholder="Dirección">

            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                <button type="button" id="btnObtenerUbicacionCliente">📍 Obtener ubicación</button>
                <button type="button" id="btnGuardarCliente">💾 Guardar cambios</button>
            </div>
            <input id="editarClienteLatitud" type="hidden" value="${cliente.latitud ?? ""}">
            <input id="editarClienteLongitud" type="hidden" value="${cliente.longitud ?? ""}">
        </div>

        <h3>
    Historial de Compras
</h3>

<table class="mini-history">

    <thead>

        <tr>

            <th>Fecha</th>

            <th>Producto</th>

            <th>Cant.</th>

            <th>Precio</th>

            <th>Total</th>

        </tr>

    </thead>

    <tbody>

        ${
            ventasCliente.length
            ?
            ventasClientePagina.map(v => `

                <tr>

                    <td>${v.fecha}</td>

                    <td>${v.producto}</td>

                    <td>${v.cantidad}</td>

                    <td>$${Number(v.precio).toFixed(2)}</td>

                    <td>$${Number(v.total).toFixed(2)}</td>

                </tr>

            `).join("")
            :
            `
                <tr>

                    <td colspan="5">

                        Sin compras registradas

                    </td>

                </tr>
            `
        }

    </tbody>

</table>

<div class="historial-cliente-paginacion">
    <span>
        ${ventasCliente.length ? `${inicioHistorialCliente + 1}-${Math.min(inicioHistorialCliente + registrosHistorialCliente, ventasCliente.length)} de ${ventasCliente.length}` : "0 registros"}
    </span>
    ${ventasCliente.length > registrosHistorialCliente ? `
        <div class="historial-cliente-controles">
            <button type="button" data-hist-page="${historialClientePagina - 1}" ${historialClientePagina === 1 ? "disabled" : ""}>‹</button>
            <strong>${historialClientePagina} / ${totalPaginasHistorialCliente}</strong>
            <button type="button" data-hist-page="${historialClientePagina + 1}" ${historialClientePagina === totalPaginasHistorialCliente ? "disabled" : ""}>›</button>
        </div>
    ` : ""}
</div>
 
    `;

    container.querySelectorAll("[data-hist-page]:not(:disabled)").forEach(btn => {
        btn.onclick = () => {
            historialClientePagina = Number(btn.dataset.histPage);
            renderInfoTab();
        };
    });

    conectarEdicionCliente();
}

    function renderVisitasTab(){

    const container =
        document.getElementById(
            "clienteTabContent"
        );
        
    const visitas =
        LocalDB.getVisits()
        .filter(v =>
        v.clienteId === clienteId
        )
        .sort((a,b)=>

        new Date(b.fecha)
        -
        new Date(a.fecha)

    );
        
    container.innerHTML = `
    
<div class="form-visita">

    <textarea
        id="nuevaNota"
        placeholder="Nota visita"
    ></textarea>

    <input
        id="nuevoPedido"
        placeholder="Pedido"
    >

    <button
        id="guardarVisitaBtn"
    >
        Guardar Visita
    </button>

</div>

        <h3>
            Historial visitas
        </h3>

        ${
            visitas.length
            ? visitas.map(v => `

                <div class="visita-item">

                    <small>

                        ${
                            new Date(v.fecha)
                            .toLocaleDateString()
                        }

                    </small>

                    <p>
                        ${v.nota || "-"}
                    </p>

                    <strong>
                        Pedido:
                        ${v.pedido || "-"}
                    </strong>

                </div>

            `).join("")
            : `
                <p>
                    Sin visitas registradas
                </p>
            `
        }

    `;
        const guardarBtn =
    document.getElementById(
        "guardarVisitaBtn"
    );

guardarBtn.onclick = () => {

    const nota =
        document.getElementById(
            "nuevaNota"
        ).value;

    const pedido =
        document.getElementById(
            "nuevoPedido"
        ).value;

    LocalDB.addVisit({

        clienteId,

        nota,

        pedido,

        status: "pending",

        fecha:
            new Date().toISOString()

    });
    
    showToast(
    "Visita registrada"
    );
    
    renderVisitasTab();

};
        
}

function renderProductosTab(){

    const container =
        document.getElementById(
            "clienteTabContent"
        );

    const productos =
        [...LocalDB.getProducts()]
        .sort((a,b) =>
            (a.nombre || "").localeCompare(
                b.nombre || "",
                "es",
                { sensitivity: "base" }
            )
        );

    const asignados =
        LocalDB.getProductsByClient(
            clienteId
        );

    container.innerHTML = `

        <h3>
            Productos Cliente
        </h3>

        <div class="form-producto-cliente">

            <select id="productoCliente">

                ${
                    productos.map(
                        p => `
                        <option
                            value="${p.id}"
                        >
                            ${p.nombre}
                        </option>
                        `
                    ).join("")
                }

            </select>

            <button
                id="agregarProductoCliente"
            >
                Agregar
            </button>

        </div>

        <hr>

        <div id="listaProductosCliente">

            ${
                asignados.length

                ?

                asignados.map(item => {

                    const producto =
                        productos.find(
                            p =>
                            p.id ===
                            item.productoId
                        );
                   
                    return `

                        <div
                            class="producto-cliente-item"
                        >

                            <strong>

                                ${
                                    producto?.nombre
                                    || "Producto"
                                }

                            </strong>

                            <button
                                class="eliminar-producto-cliente"
                                data-id="${item.id}"
                            >
                                ❌
                            </button>

                        </div>

                    `;

                }).join("")

                :

                `
                <p>
                    Sin productos asignados
                </p>
                `

            }

        </div>

    `;
    
    document
    .getElementById(
        "agregarProductoCliente"
    )
    .onclick = () => {
    
        const productoId =
            document.getElementById(
                "productoCliente"
            ).value;
    
        const existe =
    asignados.find(
        p =>
            p.productoId ===
            productoId
    );

        if(existe){
        
            showToast(
                "Producto ya agregado"
            );
        
            return;
        }
        
        LocalDB.addClientProduct({
    
            clienteId,
    
            productoId,
   
        });

        showToast(
            "Producto agregado"
        );
        
        renderProductosTab();
    
        };

    document
    .querySelectorAll(
        ".eliminar-producto-cliente"
    )
    .forEach(btn => {
    
        btn.onclick = () => {

                    if(
            !confirm(
                "¿Seguro que deseas eliminar este producto del cliente?"
                )
            ){
                return;
            }
    
            LocalDB.deleteClientProduct(
                btn.dataset.id            
            );

            showToast(
                "Producto eliminado"
            );
    
            renderProductosTab();
    
        };
    
    });
    
    }

function renderEditarConsignacion(
    consignacion
){

consignacion =
    JSON.parse(
        JSON.stringify(consignacion)
    );
    
    const container =
        document.getElementById(
            "clienteTabContent"
        );

    const productos =
        [...LocalDB.getProducts()]
        .sort((a,b) =>
            (a.nombre || "").localeCompare(
                b.nombre || "",
                "es",
                { sensitivity: "base" }
            )
        );

    container.innerHTML = `

        <h3>
            Editar Consignación
        </h3>

        ${
            consignacion.items.map(item => {

                const producto =
                    productos.find(
                        p =>
                            p.id ===
                            item.productId
                    );

                return `

                    <div
                        class="producto-row"
                    >

                        <span class="producto-nombre">
                            ${
                                producto?.nombre
                                || "Producto"
                            }
                        </span>

                        <span class="stock-consigna" title="Inventario disponible">
                            Inv: ${producto ? Number(LocalDB.getCalculatedStock(producto.id) || 0) : 0}
                        </span>

                        <input
                            type="number"
                            min="0"
                            value="${
                                item.cantidadEntregada
                            }"
                            class="cantidad-editar-consignacion"
                            data-productid="${
                                item.productId
                            }"
                        >

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value="${item.precio}"
                            class="precio-editar-consignacion"
                            data-productid="${item.productId}"
                        >

                    </div>

                `;

            }).join("")
        }

        <button
            id="guardarEdicionConsignacionBtn"
        >
            Guardar Cambios
        </button>
        
        <button
            id="volverConsignacionBtn"
        >
            Volver
        </button>
        
        <hr>
        
        <h4>
            Agregar producto
        </h4>

        <div class="consigna-filtros">
            <input
                type="search"
                id="buscarProductoEditarConsigna"
                placeholder="🔍 Buscar producto..."
                autocomplete="off">

            <select id="filtroProductoEditarConsigna">
                <option value="todos">Todos</option>
                <option value="paleta">Paleta</option>
                <option value="boli">Boli</option>
                <option value="postre">Postre</option>
                <option value="historico">Antiguos</option>
                <option value="otro">Otro</option>
            </select>
        </div>

        <select id="nuevoProductoConsigna"></select>

        <button id="agregarProductoConsignaBtn">Agregar</button>

`;

const selectNuevoProducto = document.getElementById("nuevoProductoConsigna");
const buscarEditar = document.getElementById("buscarProductoEditarConsigna");
const filtroEditar = document.getElementById("filtroProductoEditarConsigna");

function renderProductosEditarConsigna(){
    if(!selectNuevoProducto) return;
    const texto = (buscarEditar?.value || "").trim().toLowerCase();
    const categoria = filtroEditar?.value || "todos";
    const opciones = productos.filter(producto => {
        const nombre = (producto.nombre || "").toLowerCase();
        const cat = (producto.categoria || "historico").toLowerCase();
        const yaExiste = consignacion.items.some(item => item.productId === producto.id);
        return !yaExiste && (!texto || nombre.includes(texto)) &&
               (categoria === "todos" || cat === categoria);
    }).sort((a,b) => (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" }));
    selectNuevoProducto.innerHTML = opciones.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");
}

buscarEditar?.addEventListener("input", renderProductosEditarConsigna);
filtroEditar?.addEventListener("change", renderProductosEditarConsigna);
renderProductosEditarConsigna();

document
.getElementById(
    "agregarProductoConsignaBtn"
)
    
.onclick = () => {

    const productId =
        document.getElementById(
            "nuevoProductoConsigna"
        ).value;

    const existe =
        consignacion.items.some(
            item =>
                item.productId ===
                productId
        );

    if(existe){

        showToast(
            "El producto ya existe en la consignación"
        );

        return;

    }

    const producto =
        productos.find(
            p =>
                p.id ===
                productId
        );

    consignacion.items.push({

        productId,

        cantidadEntregada: 0,

        precio:
            producto?.precio || 0

    });

    renderEditarConsignacion(
        consignacion
    );

};

    
    document
.getElementById(
    "guardarEdicionConsignacionBtn"
)
.onclick = () => {

    const cantidades =
        document.querySelectorAll(
            ".cantidad-editar-consignacion"
        );

    const productos =
        LocalDB.getProducts();

    cantidades.forEach(input => {

        const productId =
            input.dataset.productid;

        const nuevaCantidad =
            Number(input.value);

        const itemOriginal =
            consignacion.items.find(
                item =>
                    item.productId ===
                    productId
            );

        const cantidadOriginal =
            itemOriginal.cantidadEntregada;

        const diferencia =
            nuevaCantidad -
            cantidadOriginal;

        const producto =
            productos.find(
                p =>
                    p.id ===
                    productId
            );

        if(diferencia > 0){

            LocalDB.addHistory({

                tipo:
                    "CONSIGNACION_SALIDA",

                producto:
                    producto.nombre,

                cantidad:
                    diferencia,

                fecha:
                    new Date()
                    .toLocaleString()

            });

        }

        if(diferencia < 0){

            LocalDB.addHistory({

                tipo:
                    "CONSIGNACION_ENTRADA",

                producto:
                    producto.nombre,

                cantidad:
                    Math.abs(
                        diferencia
                    ),

                fecha:
                    new Date()
                    .toLocaleString()

            });

        }

        itemOriginal.cantidadEntregada =
            nuevaCantidad;
           
        const precioInput =
            document.querySelector(
                `.precio-editar-consignacion[data-productid="${productId}"]`
            );
        
        itemOriginal.precio =
            Number(
                precioInput.value
            );
          
        });

    consignacion.items =
    consignacion.items.filter(
        item =>
            item.cantidadEntregada > 0
    );
    
const consignaciones =
    LocalDB.getConsignations();

const index =
    consignaciones.findIndex(
        c =>
            c.id ===
            consignacion.id
    );

if(index < 0){

    showToast(
        "No se encontró la consignación."
    );

    return;

}

// Reemplazar la consignación editada
consignaciones[index] =
    consignacion;

// Guardar el arreglo actualizado
LocalDB.saveConsignations(
    consignaciones
);

showToast(
    "Consignación actualizada"
);

renderConsignacionTab();

};
    
    document
    .getElementById(
        "volverConsignacionBtn"
    )
    .onclick = () => {

        renderConsignacionTab();

    };

}

function renderConsignacionTab(){

    const container =
        document.getElementById(
            "clienteTabContent"
        );

const consignaciones =
    LocalDB.getClientConsignations(
        clienteId
    )
    .slice()
    .sort((a,b) => {
        const fa = new Date(a.createdAt || a.fecha || 0).getTime() || 0;
        const fb = new Date(b.createdAt || b.fecha || 0).getTime() || 0;
        return fb - fa;
    });

                                                                console.log(
                                                                    "Cliente actual:",
                                                                    clienteId
                                                                );
                                                                
                                                                console.table(
                                                                    consignaciones.map(c => ({
                                                                        id: c.id,
                                                                        clienteId: c.clienteId,
                                                                        estado: c.estado,
                                                                        fecha: c.fecha
                                                                    }))
                                                                );
    
container.innerHTML = `

    <h3>Consignaciones</h3>

    <button id="nuevaEntregaBtn">
        Nueva Consignación
    </button>

    <div id="listaConsignaciones"></div>

`;

document
.getElementById("nuevaEntregaBtn")
.onclick = () => {

    renderNuevaEntrega();

};

const lista =
    document.getElementById(
        "listaConsignaciones"
    );

if(!consignaciones.length){

    lista.innerHTML = `

        <p>
            Este cliente aún no tiene consignaciones.
        </p>

    `;

    return;

}


lista.innerHTML =
    consignaciones.map(
        consignacion=>{

            const monto =
                consignacion.items.reduce(

                    (t,item)=>

                        t +

                        (

                            Number(
                                item.cantidadEntregada||0
                            )

                            *

                            Number(
                                item.precio||0
                            )

                        ),

                    0

                );

            return `

            <div
                class="consignacion-card"
                data-id="${consignacion.id}"
            >

                <h4>

                    ${
                        consignacion.estado==="ACTIVA"
                        ? "🟢 Consignación Activa"
                        : "⚫ Consignación Cerrada"
                    }

                </h4>

                <p>

                    ${consignacion.fecha}

                </p>

                <p>

                    <strong>

                        $${monto.toFixed(2)}

                    </strong>

                </p>

                <p>

                    Productos:
                    ${consignacion.items.length}
                
                </p>

                <div class="acciones">

                    ${
                        consignacion.estado==="ACTIVA"

                        ?

                        `

                        <button
                            class="editar-consignacion"
                            data-id="${consignacion.id}"
                        >
                            Editar
                        </button>

                        <button
                            class="ticket-consignacion"
                            data-id="${consignacion.id}"
                        >
                            🧾 Ticket
                        </button>

                        <button
                            class="recoger-consignacion"
                            data-id="${consignacion.id}"
                        >
                            Recoger
                        </button>

                        `

                        :

                        `

                        <button
                            class="ver-consignacion"
                            data-id="${consignacion.id}"
                        >
                            Ver
                        </button>

                        <button
                            class="ticket-consignacion"
                            data-id="${consignacion.id}"
                        >
                            🧾 Ticket
                        </button>

                        `

                    }

                </div>

            </div>

            `;

        }

    ).join("");


document
.querySelectorAll(
    ".editar-consignacion"
)
.forEach(btn=>{

    btn.onclick=()=>{

        const consignacion =
            LocalDB.getConsignationById(
                btn.dataset.id
            );

        renderEditarConsignacion(
            consignacion
        );

    };

});

document
.querySelectorAll(
    ".recoger-consignacion"
)
.forEach(btn=>{

    btn.onclick=()=>{

        if(
            !confirm(
                "¿Cerrar esta consignación?"
            )
        ){
            return;
        }

        const consignacion =
            LocalDB.getConsignationById(
                btn.dataset.id
            );

        renderRecogerProducto(
            consignacion
        );

    };

});

document.querySelectorAll(".ticket-consignacion").forEach(btn=>{
    btn.onclick=()=>mostrarTicketConsignacion(LocalDB.getConsignationById(btn.dataset.id));
});
    
}

        function renderNuevaEntrega(){

            const container =
                document.getElementById(
                    "clienteTabContent"
                );

            const productos =
                [...LocalDB.getProducts()]
                .sort((a,b) =>
                    (a.nombre || "").localeCompare(
                        b.nombre || "",
                        "es",
                        { sensitivity: "base" }
                    )
                );

            container.innerHTML = `

                <h3>
                    Nueva Entrega
                </h3>

                <div class="consigna-filtros">

                    <input
                        type="search"
                        id="buscarProductoConsigna"
                        placeholder="🔍 Buscar producto..."
                        autocomplete="off"
                    >

                    <select id="filtroProductoConsigna">
                        <option value="todos">Todos</option>
                        <option value="paleta">Paleta</option>
                        <option value="boli">Boli</option>
                        <option value="postre">Postre</option>
                        <option value="historico">Antiguos</option>
                        <option value="otro">Otro</option>
                    </select>

                </div>

                <div class="consigna-columnas">
                    <span>Producto</span>
                    <span>Inventario</span>
                    <span>Cant.</span>
                    <span>Precio</span>
                </div>

                <div
                    id="listaProductosConsigna"
                    class="lista-productos-consigna"
                >

                    ${
                        productos.map(producto => `

                            <div
                                class="producto-row producto-consigna-item"
                                data-nombre="${(producto.nombre || "").toLowerCase()}"
                                data-categoria="${(producto.categoria || "historico").toLowerCase()}"
                            >

                                <span
                                    class="producto-nombre"
                                    title="${producto.nombre || "[PRODUCTO ELIMINADO]"}"
                                >
                                    ${producto.nombre || "[PRODUCTO ELIMINADO]"}
                                </span>

                                <span
                                    class="stock-consigna"
                                    title="Inventario disponible"
                                >
                                    Inv: ${Number(LocalDB.getCalculatedStock(producto.id) || 0)}
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value="0"
                                    class="cantidad-consignacion"
                                    data-productid="${producto.id}"
                                >

                                <div class="precio-box">

                                    <span>$</span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value="${LocalDB.getSuggestedPrice(
                                            cliente.id,
                                            producto.id
                                        )}"
                                        class="precio-consignacion"
                                        data-productid="${producto.id}"
                                    >

                                </div>

                            </div>

                        `).join("")
                    }

                </div>

                <button
                    id="guardarEntregaBtn"
                >
                    Guardar Entrega
                </button>

            `;

            const buscar =
                document.getElementById(
                    "buscarProductoConsigna"
                );

            const filtro =
                document.getElementById(
                    "filtroProductoConsigna"
                );

            function filtrarProductos(){

                const texto =
                    buscar.value
                    .trim()
                    .toLowerCase();

                const categoria =
                    filtro.value;

                document
                    .querySelectorAll(
                        ".producto-consigna-item"
                    )
                    .forEach(row => {

                        const coincideTexto =
                            !texto ||
                            row.dataset.nombre.includes(texto);

                        const coincideCategoria =
                            categoria === "todos" ||
                            row.dataset.categoria === categoria;

                        row.style.display =
                            coincideTexto && coincideCategoria
                            ? "flex"
                            : "none";

                    });

            }

            buscar.addEventListener(
                "input",
                filtrarProductos
            );

            filtro.addEventListener(
                "change",
                filtrarProductos
            );

            document
                .getElementById(
                    "guardarEntregaBtn"
                )
                .onclick = () => {

                    const inputs =
                        document.querySelectorAll(
                            ".cantidad-consignacion"
                        );

                    const items = [];

                    inputs.forEach(input => {

                        const cantidad =
                            Number(input.value);

                        if(cantidad <= 0){
                            return;
                        }

                        const precioInput =
                            document.querySelector(
                                `.precio-consignacion[data-productid="${input.dataset.productid}"]`
                            );

                        items.push({

                            productId:
                                input.dataset.productid,

                            cantidadEntregada:
                                cantidad,

                            precio:
                                Number(
                                    precioInput.value
                                )

                        });

                    });

                    if(!items.length){

                        showToast(
                            "Ingresa cantidades"
                        );

                        return;

                    }

                    const productosActuales =
                        LocalDB.getProducts();

                    items.forEach(item => {

                        const producto =
                            productosActuales.find(
                                p =>
                                    p.id ===
                                    item.productId
                            );

                        if(!producto) return;

                        LocalDB.addHistory({

                            tipo:
                                "CONSIGNACION_SALIDA",

                            producto:
                                producto.nombre,

                            cantidad:
                                item.cantidadEntregada,

                            fecha:
                                new Date()
                                .toLocaleString()

                        });

                    });

                    LocalDB.addConsignation({

                        id:
                            crypto.randomUUID(),

                        clienteId,

                        createdAt:
                            new Date().toISOString(),

                        fecha:
                            new Date()
                            .toLocaleString(),

                        estado:
                            "ACTIVA",

                        items

                    });

                    showToast(
                        "Consignación creada"
                    );

                    renderConsignacionTab();

                };

        }

    function renderRecogerProducto(consignacion){

    const container =
        document.getElementById(
            "clienteTabContent"
        );

    const productos =
        LocalDB.getProducts();

container.innerHTML = `

    <h3>
        Recoger Producto
    </h3>

    ${

        consignacion.items.map(
            item => {

                const producto =
                    productos.find(
                        p =>
                            p.id ===
                            item.productId
                    );

                return `

                    <div
                        class="recoger-row"
                    >

                        <span
                            class="producto-nombre"
                        >
                            ${producto?.nombre || "[PRODUCTO ELIMINADO]"}
                        </span>

                        <span>
                            E:${item.cantidadEntregada}
                        </span>

                        <span>
                            D:
                        </span>

                        <input
                            type="number"
                            min="0"
                            max="${item.cantidadEntregada}"
                            value="0"
                            class="cantidad-devuelta"
                            data-productid="${item.productId}"
                            data-entregado="${item.cantidadEntregada}"
                        >

                        <span>

                            V:

                            <span
                                class="vendido-preview"
                            >
                                ${item.cantidadEntregada}
                            </span>

                        </span>

                    </div>

                `;

            }

        ).join("")

    }

    <button
        id="cerrarConsignacionBtn"
    >
        Cerrar Consignación
    </button>

`;

    document
    .querySelectorAll(
        ".cantidad-devuelta"
    )
    .forEach(input => {
    
        input.oninput = () => {
    
            const entregado =
                Number(
                    input.dataset.entregado
                );
    
            const devuelto =
                Number(
                    input.value
                );
    
            const vendido =
                entregado -
                devuelto;
    
            input
                .parentElement
                .querySelector(
                    ".vendido-preview"
                )
                .textContent =
                vendido;
    
        };
    
    });

    document
.getElementById(
    "cerrarConsignacionBtn"
)
.onclick = () => {

        if(
        !confirm(
            "¿Seguro que deseas cerrar la consignación?"
        )
    ){
        return;
    }

    const inputs = document.querySelectorAll(".cantidad-devuelta");
    const productos = LocalDB.getProducts();
    const itemsVenta = [];
    let total = 0, ganancia = 0, totalVendido = 0;

    inputs.forEach(input=>{
        const productId=input.dataset.productid;
        const entregado=Number(input.dataset.entregado||0);
        const devuelto=Math.max(0,Math.min(entregado,Number(input.value||0)));
        const vendido=entregado-devuelto;
        const producto=productos.find(p=>p.id===productId);
        const itemConsignado=consignacion.items.find(i=>i.productId===productId);
        if(!producto || !itemConsignado) return;

        if(devuelto>0) LocalDB.addHistory({tipo:"CONSIGNACION_ENTRADA",producto:producto.nombre,cantidad:devuelto,fecha:new Date().toLocaleString()});
        if(vendido>0){
            const precio=Number(itemConsignado.precio ?? producto.precio ?? 0);
            const subtotal=vendido*precio;
            total+=subtotal;
            ganancia+=subtotal-(vendido*Number(producto.costo||0));
            totalVendido+=vendido;
            itemsVenta.push({productId,quantity:vendido,price:precio});
        }
        itemConsignado.cantidadDevuelta=devuelto;
        itemConsignado.cantidadVendida=vendido;
    });

    consignacion.fechaCierre=new Date().toISOString();
    consignacion.estado="CERRADA";
    consignacion.totalVendido=total;
    consignacion.cantidadVendida=totalVendido;
    consignacion.cantidadDevuelta=consignacion.items.reduce((t,i)=>t+Number(i.cantidadDevuelta||0),0);

    const consignaciones=LocalDB.getConsignations();
    const index=consignaciones.findIndex(c=>c.id===consignacion.id);
    if(index>=0) consignaciones[index]=consignacion;
    LocalDB.saveConsignations(consignaciones);

    {
        const clienteObj=LocalDB.getRouteClients().find(c=>c.id===consignacion.clienteId);
        LocalDB.createSale({
            tipoOperacion:"CONSIGNACION",
            consignacion:true,
            consignacionId:consignacion.id,
            producto:`${itemsVenta.length} productos`,
            cliente:clienteObj?.nombre || "",
            cantidad:totalVendido,
            precio:itemsVenta.length===1?itemsVenta[0].price:0,
            costo:0,total,ganancia,items:itemsVenta,
            fecha:new Date().toLocaleString()
        });
    }

    showToast(
        "Consignación cerrada"
    );

    renderConsignacionTab();

};

}
   
}
