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

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

});

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

L.circleMarker(

    [

        Number(
            cliente.latitud
        ),

        Number(
            cliente.longitud
        )

    ],

    {

        radius:8,

        fillColor:"#ff0000",

        color:"#ff0000",

        weight:1,

        opacity:1,

        fillOpacity:.8

    }

)
        
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
