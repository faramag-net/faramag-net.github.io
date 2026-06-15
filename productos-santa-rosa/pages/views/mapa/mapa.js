import LocalDB
from "../../core/storage/local-db.js";

const mapa =
    L.map("mapa")
    .setView(
        [19.0414,-98.2063],
        12
    );

L.tileLayer(

'https://tile.openstreetmap.org/{z}/{x}/{y}.png',

{
    maxZoom:19
}

).addTo(mapa);

const clientes =
    JSON.parse(
        localStorage.getItem(
            "psr_route_clients"
        )
    ) || [];

clientes.forEach(cliente => {

    if(
        !cliente.latitud ||
        !cliente.longitud
    ){
        return;
    }

    L.marker([

        Number(
            cliente.latitud
        ),

        Number(
            cliente.longitud
        )

    ])
    .addTo(mapa)

    .bindPopup(`

        <b>
            ${cliente.nombre}
        </b>

        <br>

        📞
        ${cliente.telefono || "-"}

        <br>

        📍
        ${cliente.direccion || "-"}

    `);

});
