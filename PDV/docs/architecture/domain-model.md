# Domain Model

**Proyecto:** PDV

Este documento describe los modelos principales del dominio del sistema.

No define implementación.

No define base de datos.

No define interfaz.

Únicamente describe las entidades del negocio.

---

# Producto

Representa un artículo que puede venderse.

## Atributos

- id
- codigo
- nombre
- descripcion
- categoria
- unidad
- precioCompra
- precioVenta
- stockMinimo
- activo
- createdAt
- updatedAt

## Reglas

- El código debe ser único.
- El nombre es obligatorio.
- El precio nunca puede ser negativo.
- Un producto inactivo no puede venderse.

---

# Inventario

Representa la existencia disponible de cada producto.

Su información se obtiene a partir de los movimientos registrados.

No debe duplicar información del producto.

---

# Movimiento de Inventario

Representa cualquier cambio en las existencias.

Ejemplos:

- Alta inicial
- Compra
- Ajuste
- Venta
- Devolución
- Merma

Todo movimiento debe quedar registrado.

---

# Venta

Representa una operación comercial realizada a un cliente.

Contiene:

- folio
- fecha
- productos
- cantidades
- importes
- total

Una venta nunca modifica directamente el inventario.

La actualización del inventario forma parte del flujo de negocio.

---

# Caja

Representa el registro financiero del sistema.

Su función es registrar entradas y salidas de dinero.

No administra inventario.

---

# Cliente

Representa la persona o empresa que realiza una compra.

Puede asociarse con ventas e historial.

---

# Configuración

Representa los parámetros generales del sistema.

Ejemplos:

- nombre del negocio
- moneda
- impuestos
- impresora
- configuración regional

---

# Relaciones

Producto

↓

MovimientoInventario

↓

Inventario

↓

Venta

↓

Caja

---

# Evolución

Este documento describe únicamente el dominio.

Cada nueva versión podrá ampliar los modelos existentes sin modificar la arquitectura general.