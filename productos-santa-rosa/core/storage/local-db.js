// core/storage/local-db.js

const DB_KEYS = {
  PRODUCTS: "psr_products",
  MOVEMENTS: "psr_movements",
  INVENTORY: "psr_inventory",
  SALES: "psr_sales",
  CLIENTS: "psr_clients",
  MARKET_CLIENTS: "psr_market_clients",
  ROUTE_CLIENTS: "psr_route_clients",
  CLIENT_PRODUCTS: "psr_client_products",
  CLIENT_HISTORY: "psr_client_history",
  VISITS: "psr_visits",
  SETTINGS: "psr_settings",
  HISTORY: "psr_history",
  MERCADO_HISTORY: "psr_mercado_history",
  INSUMOS: "psr_insumos",
  CONSIGNATIONS:"psr_consignations"
};

class LocalDB {
  // =========================
  // Base Helpers
  // =========================

  static get(key) {
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return [];
    }
  }
   
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clearAll() {
    Object.values(DB_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  // =========================
  // Products
  // =========================

  static getProducts() {
    return this.get(DB_KEYS.PRODUCTS);
  }

  static saveProducts(products) {
    return this.set(DB_KEYS.PRODUCTS, products);
  }
  
  static addProduct(product) {
    const products = this.getProducts();

    const newProduct = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...product,
    };

    products.push(newProduct);

    this.saveProducts(products);
   
    return newProduct;
  }

  static updateProduct(id, updates) {
    const products = this.getProducts();

    const updated = products.map((product) => {
      if (product.id === id) {
        return {
          ...product,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }

      return product;
    });

    this.saveProducts(updated);

    return updated.find((p) => p.id === id);
  }

static deleteInventoryByProductId(productId) {

   const inventory =
        this.getInventory();

    const filtered =
        inventory.filter(
            (item) =>
                item.productId !== productId
        );

    this.saveInventory(filtered);

    return true;
}
  
static deleteProduct(id) {

    const products =
        this.getProducts();

    const filtered =
        products.filter(
            (p) => p.id !== id
        );

    this.saveProducts(filtered);

    this.deleteInventoryByProductId(id);

    return true;
}
  
  // =========================
  // Inventory
  // =========================

  static getInventory() {
    return this.get(DB_KEYS.INVENTORY);
  }

  static saveInventory(inventory) {
    return this.set(DB_KEYS.INVENTORY, inventory);
  }

  static updateStock(productId, quantity) {
    const inventory = this.getInventory();

    const index = inventory.findIndex(
      (item) => item.productId === productId
    );

    if (index >= 0) {

        inventory[index].stock += quantity;

     
        if (inventory[index].stock < 0) {

            console.warn(
                `Stock negativo en producto ${productId}`
            );
        }


      inventory[index].updatedAt = new Date().toISOString();
    } else {
      
      inventory.push({
        id: crypto.randomUUID(),
        productId,
        stock: quantity,
        updatedAt:
            new Date().toISOString(),
    });
      
    }

    this.saveInventory(inventory);

const product =
    this.getProducts().find(
        p => p.id === productId
    );

    return true;
  }

  static getProductStock(productId) {
  
      const inventory =
          this.getInventory();
  
      const item =
          inventory.find(
              item =>
                  item.productId === productId
          );
  
      return item
          ? item.stock
          : 0;
  
  }

static getCalculatedStock(productId){

    const producto =
        this.getProducts()
        .find(
            p => p.id === productId
        );

    if(!producto){
        return 0;
    }

    let stock = 0;

    const historial =
        this.getHistory();

    historial.forEach(item => {

        if(
            item.producto !== producto.nombre
        ){
            return;
        }

        switch(item.tipo){

            case "ALTA PRODUCTO":
            case "ENTRADA":
            case "CONSIGNACION_ENTRADA":

                stock += item.cantidad;
                break;

            case "MERMA":
            case "CORTESIA":
            case "CONSIGNACION_SALIDA":

                stock -= item.cantidad;
                break;

            case "ELIMINAR PRODUCTO":

                stock = 0;
                break;

        }

    });

    const ventas =
        this.getSales();

ventas.forEach(venta => {

    if(
        venta.consignacion
    ){
        return;
    }

    venta.items?.forEach(item => {

        if(
            item.productId === productId
        ){

            stock -= item.quantity;

        }

    });

});

    return stock;

}

  // =========================
  // Sales
  // =========================

  static getSales() {
    return this.get(DB_KEYS.SALES);
  }

  static saveSales(sales) {
    return this.set(DB_KEYS.SALES, sales);
  }

  static createSale(sale) {
   
    const sales = this.getSales();

    const newSale = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...sale,
    };

    // descontar stock automáticamente

    sales.push(newSale);

    this.saveSales(sales);

this.addHistory({

   tipo: "SALE_CREATED",

   producto: sale.producto,

   cantidad: sale.cantidad,

   stock: this.getCalculatedStock(
       sale.items?.[0]?.productId
   ),

   fecha: new Date().toLocaleString(),

   metadata: newSale

});

    return newSale;
  }

 
  // =========================
  // Movements
  // =========================
  
static getMovements() {
    return this.get(DB_KEYS.MOVEMENTS);
}

static saveMovements(movements) {
    return this.set(
        DB_KEYS.MOVEMENTS,
        movements
    );
}
  // =========================
  // Visits
  // =========================

  static getVisits() {
    return this.get(DB_KEYS.VISITS);
  }

  static saveVisits(visits) {
    return this.set(DB_KEYS.VISITS, visits);
  }

  static addVisit(visit) {
    const visits = this.getVisits();

    const newVisit = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "pending",
      ...visit,
    };

    visits.push(newVisit);

    this.saveVisits(visits);

    return newVisit;
  }

  // =========================
  // History / Logs
  // =========================

  static getHistory() {
    return this.get(DB_KEYS.HISTORY);
  }
  
static saveHistory(data) {

    this.set(
        DB_KEYS.HISTORY,
        data
    );

}
  
  static clearHistory() {

    this.set(
        DB_KEYS.HISTORY,
        []
    );

}
  
  static addHistory(log) {
    const history = this.getHistory();

    history.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...log,
    });

    this.set(DB_KEYS.HISTORY, history);
  }

  // =========================
  // Dashboard Helpers
  // =========================

  static getDashboardMetrics() {
    const sales = this.getSales();
    const inventory = this.getInventory();
    const products = this.getProducts();
    const visits = this.getVisits();

    const today = new Date().toDateString();

    const todaySales = sales.filter(
      (sale) =>
        new Date(sale.createdAt).toDateString() === today
    );

    const totalToday = todaySales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );

    const lowStock =
    inventory.filter(
        item =>
            item.stock > 0 &&
            item.stock <= 5
    );

    const negativeStock =
    inventory.filter(
        item => item.stock < 0
    );

    const pendingVisits = visits.filter(
      (visit) => visit.status === "pending"
    );

    return {
      totalProducts: products.length,
      totalSalesToday: totalToday,
      salesCountToday: todaySales.length,
      lowStockCount: lowStock.length,
      pendingVisits: pendingVisits.length,
      negativeStockCount:negativeStock.length,
    };
  }
  
  // =========================
  // Clients
  // =========================

  static getClients() {
    return this.get(DB_KEYS.CLIENTS);
}

static saveClients(clients) {
    return this.set(
        DB_KEYS.CLIENTS,
        clients
    );
}

static addClient(client) {

    const clients =
        this.getRouteClients();

    const newClient = {

        id: crypto.randomUUID(),

        nombre: client.nombre || "",

        telefono: client.telefono || "",

        direccion: client.direccion || "",

        latitud: client.latitud || null,

        longitud: client.longitud || null,

        notas: client.notas || "",

        saldo: client.saldo || 0,

        ultimaVisita:
            client.ultimaVisita || null,

        createdAt:
            new Date().toISOString()

    };

    clients.push(newClient);

    this.saveRouteClients(
        clients
    );

    return newClient;
}
  
     static getClients() {
        return JSON.parse(
            localStorage.getItem(DB_KEYS.CLIENTS)
        ) || [];
    }

    static saveClients(data) {
        localStorage.setItem(
            DB_KEYS.CLIENTS,
            JSON.stringify(data)
        );
    }

    static getClientProducts() {
        return JSON.parse(
            localStorage.getItem(DB_KEYS.CLIENT_PRODUCTS)
        ) || [];
    }

    static saveClientProducts(data) {
        localStorage.setItem(
            DB_KEYS.CLIENT_PRODUCTS,
            JSON.stringify(data)
        );
    }

    static getClientHistory() {
        return JSON.parse(
            localStorage.getItem(DB_KEYS.CLIENT_HISTORY)
        ) || [];
    }

    static saveClientHistory(data) {
        localStorage.setItem(
            DB_KEYS.CLIENT_HISTORY,
            JSON.stringify(data)
        );
  
} 

  static getMercadoHistory() {
  
      return this.get(
          DB_KEYS.MERCADO_HISTORY
      );
  
  }
  
  static saveMercadoHistory(data) {
    
      return this.set(
          DB_KEYS.MERCADO_HISTORY,
          data
      );

}
  
  static getInsumos() {
      return this.get(DB_KEYS.INSUMOS);
  }
  
  static saveInsumos(data) {
      return this.set(DB_KEYS.INSUMOS, data);
  }

static addClientProduct(data){

    const productos =
        this.getClientProducts();

    productos.push({
        id: crypto.randomUUID(),
        ...data
    });

    this.saveClientProducts(
        productos
    );

}

static getProductsByClient(
    clienteId
){

    return this
        .getClientProducts()
        .filter(
            p =>
                p.clienteId ===
                clienteId
        );

}

static getSuggestedPrice(
    clienteId,
    productId
){

    const sales =
        this.getSales();

    const ventas =
        sales
        .filter(sale => {

            if(!sale.items){
                return false;
            }

            const contieneProducto =
                sale.items.some(
                    item =>
                        item.productId ===
                        productId
                );

            return (
                sale.clienteId === clienteId &&
                contieneProducto
            );

        })
        .sort(
            (a,b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

    if(ventas.length){

        const item =
            ventas[0].items.find(
                i =>
                    i.productId ===
                    productId
            );

        if(item?.price){

            return Number(
                item.price
            );

        }

    }

    const producto =
        this.getProducts()
        .find(
            p => p.id === productId
        );
 
 
      return Number(
          producto?.precio || 0
      );

}
  
static deleteClientProduct(id){

    const productos =
        this.getClientProducts();

    const filtrados =
        productos.filter(
            p => p.id !== id
        );

    this.saveClientProducts(
        filtrados
    );
}

  static getConsignations(){

    return this.get(
        DB_KEYS.CONSIGNATIONS
    ) || [];

}
   
static saveConsignations(
    consignaciones
){

    this.set(

        DB_KEYS.CONSIGNATIONS,

        consignaciones

    );

}

static addConsignation(
    consignacion
){

    const consignaciones =
        this.getConsignations();

    consignaciones.push(
        consignacion
    );

    this.saveConsignations(
        consignaciones
    );

}

static getActiveConsignation(
    clienteId
){

    return this
        .getConsignations()
        .find(

            c =>

                c.clienteId ===
                clienteId

                &&

                c.estado ===
                "ACTIVA"

        );

}

  static closeConsignation(consignacionId){

    const consignaciones =
        this.getConsignations();

    const index =
        consignaciones.findIndex(
            c =>
                c.id ===
                consignacionId
        );

    if(index < 0){
        return;
    }

    consignaciones[index].estado =
        "CERRADA";

    consignaciones[index].fechaCierre =
        new Date()
        .toISOString();

    this.saveConsignations(
        consignaciones
    );

}

  static getMarketClients() {

return this.get(
    DB_KEYS.MARKET_CLIENTS
);

}

static saveMarketClients(
clients
) {

return this.set(
    DB_KEYS.MARKET_CLIENTS,
    clients
);

}

static getRouteClients() {

return this.get(
    DB_KEYS.ROUTE_CLIENTS
);

}

static saveRouteClients(
clients
) {

return this.set(
    DB_KEYS.ROUTE_CLIENTS,
    clients
);

}

  static mergeById(
    localItems = [],
    importedItems = []
){

    const merged = [

        ...localItems,

        ...importedItems

    ];

    return [

        ...new Map(

            merged.map(
                item => [
                    item.id,
                    item
                ]
            )

        ).values()

    ];

}

static mergeSales(
    importedSales
){

    const merged =
        this.mergeById(

            this.getSales(),

            importedSales

        );

    this.saveSales(
        merged
    );

}

static mergeHistory(
    importedHistory
){

    const merged =
        this.mergeById(

            this.getHistory(),

            importedHistory

        );

    this.saveHistory(
        merged
    );

}

static mergeVisits(
    importedVisits
){

    const merged =
        this.mergeById(

            this.getVisits(),

            importedVisits

        );

    this.saveVisits(
        merged
    );

}

static mergeClients(
    importedClients
){

    const merged =
        this.mergeById(

            this.getRouteClients(),

            importedClients

        );

    this.saveRouteClients(
        merged
    );

}

static importBackup(data){

    if(data.routeClients){

        this.mergeClients(
            data.routeClients
        );

    }

    if(data.visits){

        this.mergeVisits(
            data.visits
        );

    }

    if(data.sales){

        this.mergeSales(
            data.sales
        );

    }

    if(data.history){

        this.mergeHistory(
            data.history
        );

    }

}

static importBackup(data){

    if(data.products){

        this.mergeProducts(
            data.products
        );

    }

    if(data.routeClients){

        this.mergeClients(
            data.routeClients
        );

    }

    if(data.visits){

        this.mergeVisits(
            data.visits
        );

    }

    if(data.sales){

        this.mergeSales(
            data.sales
        );

    }

    if(data.history){

        this.mergeHistory(
            data.history
        );

    }

}

static mergeProducts(
    importedProducts
){

    const merged =
        this.mergeById(

            this.getProducts(),

            importedProducts

        );

    this.saveProducts(
        merged
    );

}

static mergeClientProducts(
    importedItems
){

    const merged =
        this.mergeById(

            this.getClientProducts(),

            importedItems

        );

    this.saveClientProducts(
        merged
    );

}


static mergeConsignations(
    importedItems
){

    const merged =
        this.mergeById(

            this.getConsignations(),

            importedItems

        );

    this.saveConsignations(
            merged
        );

}
  
}

export default LocalDB;
export { DB_KEYS };
