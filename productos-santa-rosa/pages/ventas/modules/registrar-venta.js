import LocalDB from "../../../core/storage/local-db.js";

export function cargarProductos(){

    const productos =
    LocalDB.getProducts();

    const select =
    document.getElementById("producto");

    select.innerHTML = "";

    productos.forEach(producto=>{

        select.innerHTML += `

        <option value="${producto.nombre}">

            ${producto.nombre}

        </option>

        `;

    });

    actualizarProducto();

}

export function actualizarProducto(){

    const productos =
    LocalDB.getProducts();

    const nombre =
    document.getElementById("producto").value;

    const producto =
    productos.find(
        p => p.nombre === nombre
    );

    if(!producto) return;

    document.getElementById("precio").value =
    producto.precio;

    document.getElementById("costo").value =
    producto.costo;

    actualizarSubtotal();

}

export function actualizarSubtotal(){

    const cantidad =
    Number(
        document.getElementById("cantidad").value
    );

    const precio =
    Number(
        document.getElementById("precio").value
    );

    const subtotal =
    cantidad * precio;

    document.getElementById("subtotalVista")
    .innerText =
    "SUBTOTAL: $" + subtotal.toFixed(2);

}

export function cambiarCantidad(valor){

    const input =
    document.getElementById("cantidad");

    let cantidad =
    parseInt(input.value) || 1;

    cantidad += valor;

    if(cantidad < 1){

        cantidad = 1;

    }

    input.value = cantidad;

    actualizarSubtotal();

}

export function registrarVenta(){

    const productos =
    LocalDB.getProducts();

    const nombre =
    document.getElementById("producto").value;

    const cliente =
    document.getElementById("cliente").value;

    const cantidad =
    Number(
        document.getElementById("cantidad").value
    );

    const precio =
    Number(
        document.getElementById("precio").value
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

    
    const subtotal =
    cantidad * precio;

    const ganancia =
    subtotal - (cantidad * producto.costo);

LocalDB.createSale({

    producto: nombre,

    cliente,

    cantidad,

    precio,

    costo: producto.costo,

    total: subtotal,

    ganancia,

    items: [
        {
            productId: producto.id,
            quantity: cantidad,
            price: precio
        }
    ],

    fecha: new Date().toLocaleString()

});

    limpiarFormulario();

    actualizarSubtotal();

    alert("Venta registrada");

}


function limpiarFormulario(){

    document.getElementById("cliente").value = "";

    document.getElementById("cantidad").value = 1;

}
