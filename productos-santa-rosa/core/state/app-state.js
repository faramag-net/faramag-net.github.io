class AppState {

    static state = {

        carrito: [],

        filtros: {},

        usuario: null,

        paginaActual: "dashboard",

        ultimaActualizacion:
            Date.now()

    };

    static get(key) {

        return this.state[key];

    }

    static set(key, value) {

        this.state[key] = value;

        return true;

    }

    static update() {

        this.state.ultimaActualizacion =
            Date.now();

    }

}

export default AppState;
