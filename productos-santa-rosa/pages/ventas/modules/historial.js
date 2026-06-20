import LocalDB from "../../../core/storage/local-db.js";

export function renderTablaVentas(){

    const tabla =
    document.getElementById("tablaVentas");

    if(!tabla) return;

tabla.innerHTML = "";

const ventas =
    [...LocalDB.getSales()]
        .sort((a,b)=>{

            const fechaA =
                new Date(
                    a.createdAt ||
                    a.fecha
                ).getTime();

            const fechaB =
                new Date(
                    b.createdAt ||
                    b.fecha
                ).getTime();

            return fechaB - fechaA;

        });

    const filtro =
    document
        .getElementById(
            "buscarVentas"
        )
        ?.value
        ?.toLowerCase()
        || "";

const ventasFiltradas =
    ventas.filter(
        venta =>

            venta.producto
                ?.toLowerCase()
                .includes(filtro)

            ||

            venta.cliente
                ?.toLowerCase()
                .includes(filtro)

            ||

            venta.fecha
                ?.toLowerCase()
                .includes(filtro)

            ||

            String(
                venta.total || 0
            ).includes(filtro)
    );
    
    
    ventasFiltradas.forEach((venta)=>{

        tabla.innerHTML += `

        <tr>

            <td>${venta.producto}</td>
            <td>${venta.cliente}</td>
            <td>${venta.cantidad}</td>
            <td>$${Number(venta.precio || 0).toFixed(2)}</td>
            <td>$${Number(venta.costo || 0).toFixed(2)}</td>
            <td>$${Number(venta.total || 0).toFixed(2)}</td>
            <td>$${Number(venta.ganancia || 0).toFixed(2)}</td>
            <td>${venta.fecha}</td>

            <td>

                <button
                    class="btnEliminarVenta"
                    data-id="${venta.id}"
                >
                    ❌
                </button>
                
            </td>
    
        </tr>

        `;

    });

        document
        .querySelectorAll(
            ".btnEliminarVenta"
        )
        .forEach(btn => {

            btn.onclick = () => {

                const confirmar =
                    confirm(
                        "¿Eliminar venta?"
                    );

                if(!confirmar)
                    return;

            const ventas =
                LocalDB.getSales();
            
            const actualizadas =
                ventas.filter(
                    venta =>
                        venta.id !==
                        btn.dataset.id
                );
            
            LocalDB.saveSales(
                actualizadas
            );
                
                renderTablaVentas();

                actualizarKPIs();

            };

        });

}


export function actualizarKPIs(){

    const ventas = LocalDB.getSales();
    
    let totalVentas = 0;

    let totalGanancia = 0;

ventas.forEach(venta=>{

    totalVentas +=
    Number(venta.total || 0);

    totalGanancia +=
    Number(venta.ganancia || 0);

});

    const ventasCard =
    document.getElementById("totalVentas");

    const gananciaCard =
    document.getElementById("totalGanancia");

    if(ventasCard){

        ventasCard.innerText =
        "$" + totalVentas.toFixed(2);

    }

    if(gananciaCard){

        gananciaCard.innerText =
        "$" + totalGanancia.toFixed(2);

    }

}
