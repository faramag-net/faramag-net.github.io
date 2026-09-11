import LocalDB from "../../../core/storage/local-db.js";

const comanda = [];

function obtenerProductos(){

    return LocalDB.getProducts();

}

import {
    actualizarKPIs,
    renderTablaVentas
}
from "./historial.js";

export function agregarComanda(){

    const productos =
    obtenerProductos();

    const nombre =
    document.getElementById("producto").value;

    const cliente =
    document.getElementById("cliente").value;

    const cantidad =
    Number(
        document.getElementById("cantidad").value
    );

    const producto =
    productos.find(
        p => p.nombre === nombre
    );

    if(!producto){

        alert("Producto no encontrado");

        return;

    }
    
    const stockActual =
    LocalDB.getCalculatedStock(
        producto.id
    );
    
if(stockActual <= 0){

    alert(
        "⚠️ Inventario en cero o negativo. La venta será registrada."
    );

}else if(cantidad > stockActual){

    alert(
        "⚠️ La venta dejará inventario negativo. La venta será registrada."
    );

}

    const precio =
        Number(
            document.getElementById("precio").value
        );

    const subtotal =
        cantidad * precio;

    const ganancia =
        subtotal - (cantidad * producto.costo);

    comanda.push({

        producto: nombre,

        cliente,

        cantidad,

        precio: precio,

        costo: producto.costo,

        subtotal,

        ganancia

    });

    renderComanda();

}

export function renderComanda(){

    const tabla =
    document.getElementById("tablaComanda");

    const totalVista =
    document.getElementById("totalComanda");

    if(!tabla) return;

    tabla.innerHTML = "";

    let total = 0;

    comanda.forEach((item,index)=>{

        total += item.subtotal;

        tabla.innerHTML += `

        <tr>

            <td>${item.producto}</td>

            <td>${item.cantidad}</td>

            <td>$${item.precio}</td>

            <td>$${item.subtotal}</td>

            <td>

                <button
                onclick="eliminarComanda(${index})">

                ❌

                </button>

            </td>

        </tr>

        `;

    });

    totalVista.innerText =
    "TOTAL: $" + total.toFixed(2);

}

export function eliminarComanda(index){

    comanda.splice(index,1);

    renderComanda();

}

export function registrarComanda(){
    if(comanda.length === 0){ alert("Comanda vacía"); return; }
    const productos = LocalDB.getProducts();
    const items = comanda.map(item=>{
        const producto=productos.find(p=>p.nombre===item.producto);
        return producto ? {productId:producto.id, quantity:item.cantidad, price:item.precio} : null;
    }).filter(Boolean);
    if(!items.length){ alert("No hay productos válidos en la comanda"); return; }
    const total=comanda.reduce((t,item)=>t+Number(item.subtotal||0),0);
    const ganancia=comanda.reduce((t,item)=>t+Number(item.ganancia||0),0);
    const cliente=comanda.find(item=>item.cliente)?.cliente || "";
    LocalDB.createSale({
        tipoOperacion:"COMANDA",
        producto:items.length===1?comanda[0].producto:`${items.length} productos`,
        cliente,
        cantidad:comanda.reduce((t,item)=>t+Number(item.cantidad||0),0),
        precio:items.length===1?comanda[0].precio:0,
        costo:items.length===1?comanda[0].costo:0,
        total, ganancia, items,
        fecha:new Date().toLocaleString()
    });
    comanda.length=0;
    renderComanda(); renderTablaVentas(); actualizarKPIs();
    alert("Comanda registrada");
}
