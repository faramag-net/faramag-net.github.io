import LocalDB from "../../../core/storage/local-db.js";

function normalizarNombreCliente(nombre = "") {
    return String(nombre)
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("es");
}

function obtenerClientesVenta() {
    const nombres = new Map();

    // Clientes registrados específicamente desde Ventas.
    (LocalDB.getClients?.() || []).forEach(cliente => {
        const nombre = String(cliente?.nombre || "").trim().replace(/\s+/g, " ");
        if (nombre) nombres.set(normalizarNombreCliente(nombre), nombre);
    });

    // También se aprovechan los nombres que ya existen en el historial de ventas.
    (LocalDB.getSales?.() || []).forEach(venta => {
        const nombre = String(venta?.cliente || "").trim().replace(/\s+/g, " ");
        if (nombre) nombres.set(normalizarNombreCliente(nombre), nombre);
    });

    return [...nombres.values()].sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" })
    );
}

export function renderClientesVenta() {
    const datalist = document.getElementById("clientesVenta");
    if (!datalist) return;

    datalist.innerHTML = obtenerClientesVenta()
        .map(nombre => `<option value="${nombre.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")}"></option>`)
        .join("");
}

function guardarClienteVenta(nombre) {
    const limpio = String(nombre || "").trim().replace(/\s+/g, " ");
    if (!limpio) return "";

    const clientes = LocalDB.getClients?.() || [];
    const normalizado = normalizarNombreCliente(limpio);
    const existente = clientes.find(c =>
        normalizarNombreCliente(c?.nombre) === normalizado
    );

    if (!existente) {
        clientes.push({
            id: crypto.randomUUID(),
            nombre: limpio,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        LocalDB.saveClients(clientes);
    }

    return existente?.nombre || limpio;
}

export function cargarProductos(){
    renderProductosVenta();
    renderClientesVenta();
}

export function renderProductosVenta(){
    const select = document.getElementById("producto");
    if(!select) return;

    // La búsqueda/filtro de Existencias es la única fuente de filtrado
    // para la selección de productos de Registrar Venta.
    const texto = (document.getElementById("buscarStock")?.value || "")
        .trim().toLowerCase();
    const categoria = document.getElementById("filtroStock")?.value || "todos";
    const valorActual = select.value;

    const productos = [...LocalDB.getProducts()]
        .filter(p => {
            const nombre = (p.nombre || "").toLowerCase();
            const cat = (p.categoria || "historico").toLowerCase();
            return (!texto || nombre.includes(texto)) &&
                   (categoria === "todos" || cat === categoria);
        })
        .sort((a,b) => (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" }));

    select.innerHTML = productos.map(p =>
        `<option value="${p.nombre}">${p.nombre}</option>`
    ).join("");

    if(productos.some(p => p.nombre === valorActual)) {
        select.value = valorActual;
    }

    actualizarProducto();
}

function obtenerPrecioSugeridoVenta(clienteNombre, productoId, precioReal){
    const cliente = normalizarNombreCliente(clienteNombre);
    if(!cliente) return Number(precioReal) || 0;

    const ventas = [...(LocalDB.getSales?.() || [])]
        .filter(venta => normalizarNombreCliente(venta?.cliente) === cliente)
        .sort((a,b) => {
            const fa = new Date(a?.createdAt || a?.fecha || 0).getTime() || 0;
            const fb = new Date(b?.createdAt || b?.fecha || 0).getTime() || 0;
            return fb - fa;
        });

    for(const venta of ventas){
        const item = Array.isArray(venta?.items)
            ? venta.items.find(i => i?.productId === productoId)
            : null;
        if(item && item.price !== undefined && item.price !== null && item.price !== ""){
            return Number(item.price);
        }
    }

    return Number(precioReal) || 0;
}

function actualizarPrecioSugeridoVenta(){
    const producto = LocalDB.getProducts().find(
        p => p.nombre === document.getElementById("producto")?.value
    );
    if(!producto) return;

    const cliente = document.getElementById("cliente")?.value || "";
    const sugerido = obtenerPrecioSugeridoVenta(cliente, producto.id, producto.precio);
    const precio = document.getElementById("precio");
    const etiqueta = document.getElementById("precioSugeridoVenta");

    if(precio) precio.value = sugerido;
    if(etiqueta){
        etiqueta.textContent = `Sugerido: $${sugerido.toFixed(2)}`;
    }
    actualizarSubtotal();
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

    document.getElementById("costo").value =
    producto.costo;

    actualizarPrecioSugeridoVenta();

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

    tipoOperacion: "DIRECTA",

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
    renderClientesVenta();

    actualizarSubtotal();

    alert("Venta registrada");

}


function limpiarFormulario(){

    document.getElementById("cliente").value = "";

    document.getElementById("cantidad").value = 1;

}
