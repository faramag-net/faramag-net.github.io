let abrirClienteFn = null;

export function setAbrirCliente(fn){

    abrirClienteFn = fn;

}

export function refrescarCliente(id){

    if(abrirClienteFn){

        abrirClienteFn(id);

    }

}
