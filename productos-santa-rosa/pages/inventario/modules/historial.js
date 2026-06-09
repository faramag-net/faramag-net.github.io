import LocalDB from "../../../core/storage/local-db.js";

export function renderTabla(){

    const tabla =
    document.getElementById("tablaInventario");

    if(!tabla) return;

    tabla.innerHTML = "";

    const movimientos =
    LocalDB.getHistory();

        movimientos.forEach((movimiento,index)=>{
           
        tabla.innerHTML += `

        <tr>

            <td>${movimiento.tipo}</td>

            <td>${movimiento.producto}</td>

            <td>${movimiento.cantidad}</td>

            <td>${movimiento.stock || 0}</td>

            <td>${movimiento.fecha}</td>
            
            <td>
                <button
                    class="btnEliminarMovimiento"
                    data-index="${index}"
                    title=""
                >
                    🗑
                </button>
        
            </td>     
                
        </tr>

        `;

    });
    
                document
            .querySelectorAll(
                ".btnEliminarMovimiento"
            )
            .forEach(btn => {
        
                btn.onclick = () => {
        
                    const confirmar =
                        confirm(
                            "¿Eliminar movimiento?"
                        );
        
                    if(!confirmar)
                        return;
        
                    const movimientos =
                        LocalDB.getHistory();
                    
                    movimientos.splice(
                        Number(
                            btn.dataset.index
                        ),
                        1
                    );
                    
                    LocalDB.saveHistory(
                        movimientos
                    );
                    
                    renderTabla();
                    
                    actualizarResumen();
        
                };
        
            });
    
}

export function actualizarResumen(){

    const totalProductos =
    document.getElementById("totalProductos");

    if(totalProductos){

        totalProductos.innerText =
        productos.length;

    }

    const cards =
    document.getElementById("cardsInventario");

    if(!cards) return;

    cards.innerHTML = "";

    productos.forEach(producto=>{

        let color = "#28a745";

        let estado = "✅ OK";
        
        const stock =
        LocalDB.getProductStock(
        producto.id
        );
        
    if(stock > 0 && stock <= 5){

            color = "#ffc107";

            estado = "⚠️ BAJO";

        }

        if(stock === 0){

            color = "#dc3545";

            estado = "⛔ AGOTADO";

        }

        if(stock < 0){

            color = "#b00020";

            estado = "🚨 NEGATIVO";

        }

        cards.innerHTML += `

        <div class="card-producto">

            <h4>${producto.nombre}</h4>

            <p style="color:${color}">
                ${stock}
            </p>

            <small
            style="
            color:${color};
            font-weight:bold;
            ">

            ${estado}

            </small>

        </div>

        `;

    });

}
