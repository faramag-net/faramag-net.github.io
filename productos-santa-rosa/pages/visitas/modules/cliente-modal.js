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
        LocalDB.getClients()
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
                    VISITAS
                </button>

            <button
                class="tab-btn"
                data-tab="productos"
            >
                PRODUCTOS
            </button>
            
            <button
                class="tab-btn"
                data-tab="consignacion"
            >
                CONSIGNACIÓN
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

    container.innerHTML = `

        <p>
            📞 ${cliente.telefono || "-"}
        </p>

        <p>
            📍 ${cliente.direccion || "-"}
        </p>

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

        container.innerHTML = `

            <h3>
                Consignación Activa
            </h3>

            <p>
                Fecha:
                ${activa.fecha}
            </p>

            <button
                id="recogerBtn"
            >
                Recoger Producto
            </button>

        `;

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

                    <div>

                        <label>

                            ${
                                producto?.nombre
                            }

                        </label>

                        <input
                            type="number"
                            min="0"
                            value="0"
                            class="cantidad-consignacion"
                            data-productid="${producto?.id || ''}"
                        >

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
    
            items.push({
    
                productId:
                    input.dataset.productid,
    
                cantidadEntregada:
                    cantidad
    
            });
    
        });
    
        if(!items.length){
    
            showToast(
                "Ingresa cantidades"
            );
    
            return;
    
        }
    
        items.forEach(item => {
    
            LocalDB.updateStock(
    
                item.productId,
    
                -item.cantidadEntregada
    
            );
    
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
    
}
