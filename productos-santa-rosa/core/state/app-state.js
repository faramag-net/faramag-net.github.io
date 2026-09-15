
class AppState {
     
    static state = {

        carrito: [],

        filtros: {},

        usuario: null,

        paginaActual: "dashboard",

        ultimaActualizacion:
            Date.now()

    };

    static init() {

    const saved =
        localStorage.getItem(
            "psr_app_state"
        );

    if(saved){

        this.state =
            JSON.parse(saved);
    }
}
    
    static get(key) {

        return this.state[key];

    }

    static set(key, value) {

        this.state[key] = value;

        this.update();
        
        return true;

    }

    static update() {

        this.state.ultimaActualizacion =
            Date.now();
        
        localStorage.setItem(
            
        "psr_app_state",
            
        JSON.stringify(this.state)
    );
}

    static pushToCart(item) {

        this.state.carrito.push(item);

        this.update();

    }

    static removeFromCart(index) {

        this.state.carrito.splice(index, 1);

        this.update();

    }

    static clearCart() {

        this.state.carrito = [];

        this.update();

    }

}

export default AppState;
