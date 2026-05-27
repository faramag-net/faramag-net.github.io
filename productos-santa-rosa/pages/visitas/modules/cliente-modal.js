export function openClienteModal(clienteId){
    
    const cliente =
        LocalDB.getClients()
        .find(c => c.id === clienteId);

    const visitas =
        LocalDB.getVisits()
        .filter(v => v.clienteId === clienteId);

    openModal(`
    
        <div class="cliente-modal">

            <h2>${cliente.nombre}</h2>

            <div class="tabs">

                INFO
                VISITAS
                COBRANZA
                PEDIDOS

            </div>

        </div>

    `);
}
