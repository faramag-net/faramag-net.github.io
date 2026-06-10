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
                    data-tab="cobranza"
                >
                    COBRANZA
                </button>

                <button
                    class="tab-btn"
                    data-tab="pedidos"
                >
                    PEDIDOS
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

            if(tab === "cobranza"){

                renderCobranzaTab();
            }

            if(tab === "pedidos"){

                renderPedidosTab();
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

        <p>
            💵 Saldo:
            $${cliente.saldo || 0}
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

    function renderPedidosTab(){

    const container =
        document.getElementById(
            "clienteTabContent"
        );

    container.innerHTML = `

        <h3>
            Pedidos
        </h3>

        <p>
            Próximamente...
        </p>

    `;
}
    
}
