import LocalDB from "../../../core/storage/local-db.js";

export function actualizarSeguimiento(
    clienteId,
    updates
){

    const clientes =
        LocalDB.getRouteClients();

    const updated =
        clientes.map(cliente => {

            if(cliente.id === clienteId){

                return {

                    ...cliente,

                    ...updates,

                    updatedAt:
                        new Date().toISOString()

                };
            }

            return cliente;
        });

    LocalDB.saveRouteClients(
    updated
    );

    return true;
}
