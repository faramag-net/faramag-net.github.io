import LocalDB
from "../../../core/storage/local-db.js";

import {
    openModal
}
from "../../../components/ui/modal.js";

export function openClienteModal(clienteId){

    const cliente =
        LocalDB.getClients()
        .find(c => c.id === clienteId);

    if(!cliente) return;

    const visitas =
        LocalDB.getVisits()
        .filter(v =>
            v.clienteId === clienteId
        );

    openModal(`

        <div class="cliente-modal">

            <div class="cliente-header">

                <h2>
                    ${cliente.nombre}
                </h2>

                <span class="cliente-status">

                    ${
                        cliente.saldo > 0
                        ? "💰 Pendiente"
                        : "✅ OK"
                    }

                </span>

            </div>

            <div class="tabs">

                <button class="tab-btn">
                    INFO
                </button>

                <button class="tab-btn">
                    VISITAS
                </button>

                <button class="tab-btn">
                    COBRANZA
                </button>

                <button class="tab-btn">
                    PEDIDOS
                </button>

            </div>

            <div class="cliente-content">

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

                <hr>

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

            </div>

        </div>

    `);
}
