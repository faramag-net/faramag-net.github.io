import {
    productos,
    movimientos,
    guardarLocal
}
from "./storage.js";

export function agregarInventario(){

    const nombre =
    document.getElementById("productoInventario").value;

    const cantidad =
    Number(
        document.getElementById("agregarStock").value
    );

    const tipo =
    document.getElementById("tipoMovimiento").value;

    const producto =
    productos.find(
        p => p.nombre === nombre
    );

    if(!producto){

        alert("Producto no encontrado");

        return;

    }

    if(cantidad <= 0){

        alert("Cantidad inválida");

        return;

    }

    if(
        tipo === "MERMA" ||
        tipo === "CORTESIA"
    ){

        producto.stock -= cantidad;

    }else{

        producto.stock += cantidad;

    }

    movimientos.push({

        tipo,

        producto: nombre,

        cantidad,

        stock: producto.stock,

        fecha: new Date().toLocaleString()

    });

    guardarLocal();

    document.getElementById("agregarStock").value = "";

    alert("Movimiento registrado");

}
