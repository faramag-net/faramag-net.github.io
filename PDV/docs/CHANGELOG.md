
## 0.9.16 — Respaldo y restauración

- Se agregó exportación completa del estado local en JSON.
- Se agregó importación/restauración desde JSON.
- El respaldo usa `format: PDV_BACKUP` y `formatVersion: 1`.
- Los campos desconocidos de los registros se conservan durante la importación.
- Los campos ausentes en respaldos antiguos no rompen la importación.
- Se validan IDs obligatorios y duplicados dentro de cada colección.
- Los respaldos de un formato futuro no compatible se rechazan de forma controlada.
- La restauración reemplaza las entidades conocidas del estado local después de confirmación.
# 0.9.13 — Historial de Caja

- Se agregó historial de sesiones de Caja dentro del módulo Caja.
- Se muestran fechas de apertura y cierre.
- Se conserva el resumen de cada sesión: inicial, ventas netas, esperado, contado y diferencia.
- La sesión abierta también puede consultarse en el historial.
- Se agregó el caso de uso `GetCashSummary` para centralizar el cálculo de Caja y evitar lógica de negocio en la UI.

# 0.9.12 — Ticket con devoluciones

- El ticket conserva íntegra la venta original.
- Las devoluciones se muestran como operaciones adicionales dentro del mismo ticket.
- Se muestra el total devuelto y el total neto.
- El estado visual distingue Completada, Devolución parcial y Devuelta.
- No se crea un ticket nuevo para cada devolución.

# 0.9.11 — Cobro integrado a Ventas

- Ventas ahora abre un flujo de cobro antes de completar la Transaction.
- El cobro inicial de 1.0 se maneja con efectivo.
- Se registra monto recibido y cambio en la Transaction.
- El ticket virtual muestra pago, recibido y cambio.
- La venta solo se completa después de confirmar el cobro.

## 0.9.9 — Ajustes de operación

- Devoluciones únicamente totales.
- Cancelaciones únicamente totales.
- Devoluciones y cancelaciones requieren Caja abierta para registrar el ajuste de efectivo.
- El monto esperado de Caja descuenta devoluciones y cancelaciones realizadas en la sesión actual.
- Validación de códigos de artículo únicos, sin distinguir mayúsculas/minúsculas.
- Validación de IDs duplicados en persistencia de Caja.

# CHANGELOG

## 0.9.4 — Ticket virtual

- Se incorporó la visualización de tickets virtuales a partir de las ventas completadas.
- El módulo Tickets consulta las transacciones existentes y no crea una segunda fuente de verdad.
- Se puede seleccionar una venta y visualizar su ticket con fecha, artículos, cantidades y total.
- No se incorpora todavía impresión física.

## 0.9.3

### Caja básica

- Se implementó el dominio `Cash`.
- Se agregó repositorio local de Caja.
- Se implementaron los casos de uso para abrir, consultar y cerrar Caja.
- Se agregó apertura con monto inicial.
- Las ventas completadas posteriores a la apertura se consideran efectivo para este MVP.
- Se calcula efectivo esperado como monto inicial + ventas.
- Se permite registrar el efectivo contado al cierre y calcular la diferencia.
- Se mantiene el historial de sesiones de Caja; no se eliminan cierres anteriores.
- La impresión física de tickets y los métodos de pago adicionales quedan fuera de esta versión.

/**
 * ---------------------------------------------------
 * PDV
 * Archivo:
 * Descripción:
 * Versión:
 * Autor:
 * ---------------------------------------------------
 */


 v0.1.0 - Núcleo inicial del sistema

 # v0.1.0

## Agregado

- Arquitectura inicial del proyecto.
- Inicialización de la aplicación.
- Sistema de configuración.
- Base de datos.
- Router.
- Logger.
- Punto de entrada.

## v0.6.5
Fecha: 2026-07-17

### Agregado
- Se congeló la arquitectura del Core.
- Se definió el estándar de arquitectura.
- Se establecieron las reglas 18–32.

### Cambiado
- Separación definitiva entre Theme y Variables.
- Manifest unificado.

### Resultado
La arquitectura queda estable y comienza la v0.7.0.

## v0.7.0

Agregado

- Modelo de Dominio.
- Arquitectura del Dominio.
- Lenguaje Ubicuo.
- Principios del Dominio.

Modificado

- Cambio de Producto a Artículo.
- Cambio del enfoque de módulos a agregados del dominio.

Resultado

El dominio queda oficialmente congelado antes de comenzar la implementación.

## v0.9.2

Fecha: 2026-08-18

### Objetivo

Construir el primer ciclo funcional de Ventas e integrarlo con Inventario.

### Agregado

- Entidad `Transaction`.
- Estados `DRAFT`, `COMPLETED` y `CANCELLED` definidos para el dominio.
- Repositorio de transacciones y repositorio local.
- Casos de uso para crear, consultar y completar ventas.
- Módulo Ventas con carrito.
- Historial básico de ventas.
- Una venta completada genera movimientos `EXIT` para artículos inventariables.
- Las existencias se recalculan mediante el historial de movimientos.

### Criterio de producto

La prioridad de la serie 0.9.x es producir una aplicación WEB funcional lo antes posible.
Los tickets físicos y un Dashboard avanzado quedan para etapas posteriores.
El ticket de la primera versión funcional será virtual.


## 0.9.5 — Integración Caja / Ventas

- Las ventas completadas requieren una Caja abierta.
- Las transacciones completadas guardan `cashId` y `paymentMethod`.
- Por ahora el único método de pago es efectivo (`CASH`).
- Caja calcula sus ventas únicamente por la sesión de Caja asociada.
- El ticket virtual muestra método de pago y Caja.
- La validación de existencias ocurre antes de registrar movimientos.
- El monto inicial de Caja sigue siendo un fondo inicial manual; las ventas se suman automáticamente al efectivo esperado.

## 0.9.6 — Devoluciones en Ventas

- Se agregó el caso de uso `ReturnTransaction` dentro del dominio Transaction.
- Las devoluciones conservan la transacción original y generan movimientos `ENTRY` compensatorios.
- Se soportan devoluciones totales y parciales.
- No se crea un módulo independiente de devoluciones; permanece como operación de Ventas.
- Las cancelaciones existentes de versiones anteriores se conservan como datos históricos.

## 0.9.7 - Historial básico

- Se agregó el módulo Historial para consultar ventas y movimientos.
- El historial se reconstruye desde Transactions y Movements existentes; no crea una nueva fuente de datos.
- Las ventas muestran fecha, total y estado.
- Los movimientos muestran fecha, tipo, artículo, cantidad y referencia de venta cuando existe.
- Las salidas generadas por nuevas ventas conservan `transactionId` y `reason: SALE` para trazabilidad.


## 0.9.8 — Integridad básica

- Protección contra IDs duplicados al guardar artículos, ventas y movimientos.
- Historial muestra Devuelta y Devolución parcial sin alterar el estado histórico COMPLETED de la Transaction.

## 0.9.11 — Devoluciones por línea y simplificación de Ventas

- Cancelar deja de ser una operación disponible sobre una venta completada.
- Quitar artículos permanece como operación del carrito antes de completar la venta.
- Después de completar una venta, las correcciones se realizan mediante devoluciones parciales o totales.
- Una devolución puede afectar una o varias líneas y cantidades pendientes de la misma venta.
- Cada devolución conserva su Caja, importe, artículos y fecha.
- Caja descuenta cada operación de devolución según la sesión en la que se realiza.
- La venta original permanece como hecho histórico y su estado operativo se deriva de las cantidades devueltas.
