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

    const visitas =
        LocalDB.getVisits()
        .filter(v =>
            v.clienteId === clienteId
        );

    openModal(`

        <div class="cliente-modal">

            <h2>
                ${cliente.nombre}
            </h2>

            <div class="tabs">

                <button>
                    INFO
                </button>

                <button>
                    VISITAS
                </button>

                <button>
                    COBRANZA
                </button>

                <button>
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
                    Últimas visitas
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
