import LocalDB
from "../../../core/storage/local-db.js";

import {
    openModal
}
    
from "../../../components/ui/modal.js";

import {
    showToast
}
from "../../../components/toast.js";

export function openClienteModal(clienteId){

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
        .reverse()
        .slice(0,10);

        
    container.innerHTML = `

        <p>
            📞 ${cliente.telefono || "-"}
        </p>

        <p>
            📍 ${cliente.direccion || "-"}
        </p>

                <h3>
    Últimas Compras
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
            ventasCliente.map(v => `

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
 
    `;
      
       
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
        LocalDB.getProducts();

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

    const container =
        document.getElementById(
            "clienteTabContent"
        );

    const productos =
        LocalDB.getProducts();

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

                        <span>
                            ${
                                producto?.nombre
                                || "Producto"
                            }
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
        
        <select
            id="nuevoProductoConsigna"
        >
        
    ${
        productos.map(producto => `

            <option
                value="${producto.id}"
            >
                ${producto.nombre}
            </option>

        `).join("")
    }
</select>

<button
    id="agregarProductoConsignaBtn"
>
    Agregar
</button>

`;

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

    consignaciones[index] =
        consignacion;
  
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

    const activa =
        LocalDB.getActiveConsignation(
            clienteId
        );

if(activa){

    const monto =
        activa.items.reduce(
            (total,item)=>
                total +
                (
                    Number(
                        item.cantidadEntregada || 0
                    )
                    *
                    Number(
                        item.precio || 0
                    )
                ),
            0
        );

    container.innerHTML = `
        <h3>
            Consignación Activa
        </h3>

        <p>
            Fecha:
            ${activa.fecha}
        </p>

        <p>
            Monto consignado:
            <strong>
                $${monto.toFixed(2)}
            </strong>
        </p>

        <button
            id="editarConsignacionBtn"
        >
            Editar
        </button>

        <button
            id="recogerBtn"
        >
            Recoger Producto
        </button>
    `;

    document
    .getElementById(
        "editarConsignacionBtn"
    )
    .onclick = () => {

        renderEditarConsignacion(
            activa
        );

    };

    document
    .getElementById(
        "recogerBtn"
    )
    .onclick = () => {

console.log(
    "CLICK RECOGER"
);
        
        if(
            !confirm(
                "¿Seguro que deseas cerrar la consignación? Se registrarán ventas y devoluciones."
            )
        ){
            return;
        }
    
        renderRecogerProducto(
            activa
        );
    
    };

    return;

}

    container.innerHTML = `

        <h3>
            Consignación
        </h3>

        <button
            id="nuevaEntregaBtn"
        >
            Nueva Entrega
        </button>

    `;

    document
    .getElementById(
        "nuevaEntregaBtn"
    )
    .onclick = () => {

        renderNuevaEntrega();

    };

}

    function renderNuevaEntrega(){
       
    const container =
        document.getElementById(
            "clienteTabContent"
        );

    const productos =
        LocalDB.getProducts();

    const asignados =
        LocalDB.getProductsByClient(
            clienteId
        );
        
    container.innerHTML = `

        <h3>
            Nueva Entrega
        </h3>

        ${

            asignados.map(item => {

                const producto =
                    productos.find(
                        p =>
                        p.id ===
                        item.productoId
                    );

return `

    <div class="producto-row">

        <span
            class="producto-nombre"
            title="${producto?.nombre}"
        >
            ${producto?.nombre}
        </span>

        <input
            type="number"
            min="0"
            step="0.01"
            value="0"
            class="cantidad-consignacion"
            data-productid="${producto?.id || ''}"
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
            data-productid="${producto?.id || ''}"
        >

    </div>

</div>

`;

            }).join("")

        }

        <button
            id="guardarEntregaBtn"
        >
            Guardar Entrega
        </button>

    `;

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
                Number(
                    input.value
                );
    
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
    
items.forEach(item => {

    const producto =
        LocalDB.getProducts()
        .find(
            p =>
                p.id ===
                item.productId
        );

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
                            ${producto?.nombre}
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

    const inputs =
        document.querySelectorAll(
            ".cantidad-devuelta"
        );

    const productos =
        LocalDB.getProducts();

    inputs.forEach(input => {

        const productId =
            input.dataset.productid;

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

        const producto =
            productos.find(
                p =>
                p.id === productId
            );

        if(devuelto > 0){
        
            LocalDB.addHistory({
        
                tipo:
                    "CONSIGNACION_ENTRADA",
        
                producto:
                    producto.nombre,
        
                cantidad:
                    devuelto,
        
                fecha:
                    new Date()
                    .toLocaleString()
        
            });
        
        }

        if(vendido > 0){

            const itemConsignado =
                consignacion.items.find(
                    i =>
                        i.productId ===
                        productId
                );
            
            const precio =
                itemConsignado?.precio ??
                producto.precio;

            const total =
                vendido * precio;

            LocalDB.createSale({

                producto:
                    producto.nombre,

                cliente:
                    cliente.nombre,

                cantidad:
                    vendido,

                precio,

                costo:
                    producto.costo,

                total,

                ganancia:
                    total -
                    (
                        vendido *
                        producto.costo
                    ),

                items:[
                    {
                        productId,
                        quantity:
                            vendido,
                        price:
                            precio
                    }
                ],

                fecha:
                    new Date()
                    .toLocaleString(),
                
                consignacion: true

            });

        }

    });

    LocalDB.closeConsignation(
        consignacion.id
    );

    showToast(
        "Consignación cerrada"
    );

    renderConsignacionTab();

};

}
   
}
