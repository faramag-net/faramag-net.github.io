/**
 * Productos Santa Rosa
 * Componente: Navbar global
 * Versión: 1.2.0
 * Build: 20260928.1129
 * Objetivo: Navegación única y sin duplicados; Compras reemplaza la etiqueta Insumos.
 */
export function crearNavbar(){
  return `
  <nav class="navbar" aria-label="Navegación principal">
    <div class="logo-navbar">🍦 Santa Rosa</div>
    <div class="links-navbar">
      <a href="https://faramag-net.github.io/productos-santa-rosa">🏠 Inicio</a>
      <a href="https://faramag-net.github.io/productos-santa-rosa/pages/producto">🍦 Productos</a>
      <a href="https://faramag-net.github.io/productos-santa-rosa/pages/inventario">📦 Inventario</a>
      <a href="https://faramag-net.github.io/productos-santa-rosa/pages/ventas">💰 Ventas</a>
      <a href="https://faramag-net.github.io/productos-santa-rosa/pages/visitas">📍 Visitas</a>
      <a href="https://faramag-net.github.io/productos-santa-rosa/pages/insumos">🛒 Compras</a>
      <a href="https://faramag-net.github.io/mapa/">🗺️ Mapa</a>
    </div>
  </nav>`;
}
