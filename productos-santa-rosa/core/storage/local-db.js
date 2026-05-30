// core/storage/local-db.js

const DB_KEYS = {
  PRODUCTS: "psr_products",
  MOVEMENTS: "psr_movements",
  INVENTORY: "psr_inventory",
  SALES: "psr_sales",
  CLIENTS: "psr_clients",
  VISITS: "psr_visits",
  SETTINGS: "psr_settings",
  HISTORY: "psr_history",
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
        updatedAt: new Date().toISOString(),
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
    const inventory = this.getInventory();

    const item = inventory.find(
      (item) => item.productId === productId
    );

    return item ? item.stock : 0;
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
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach((item) => {
        this.updateStock(item.productId, -item.quantity);
      });
    }

    sales.push(newSale);

    this.saveSales(sales);

this.addHistory({

   tipo: "SALE_CREATED",

   producto: sale.producto,

   cantidad: sale.cantidad,

   stock: this.getProductStock(
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
        this.getClients();

    const newClient = {

        id: crypto.randomUUID(),

        nombre: client.nombre || "",

        telefono: client.telefono || "",

        direccion: client.direccion || "",

        notas: client.notas || "",

        saldo: client.saldo || 0,

        ultimaVisita:
            client.ultimaVisita || null,

        createdAt:
            new Date().toISOString()

    };

    clients.push(newClient);

    this.saveClients(clients);

this.addHistory({

    tipo: "CLIENT_CREATED",

    producto: newClient.nombre,

    cantidad: 0,

    stock: 0,

    fecha: new Date().toLocaleString(),

    metadata: newClient

});
  
    return newClient;
}
  
}

export default LocalDB;
export { DB_KEYS };
