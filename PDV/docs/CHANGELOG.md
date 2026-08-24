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

## 0.9.6 — Cancelaciones y devoluciones en Ventas

- Se agregaron los casos de uso `CancelTransaction` y `ReturnTransaction` dentro del dominio Transaction.
- Cancelar una venta completada conserva la transacción y genera movimientos `ENTRY` compensatorios.
- Las devoluciones conservan la venta original y generan movimientos `ENTRY`.
- Se soportan devoluciones totales y parciales a nivel de caso de uso.
- La interfaz de Ventas incorpora acciones para cancelar y devolver ventas.
- No se crean módulos independientes para cancelaciones o devoluciones; se mantienen como operaciones de Ventas.
- Los movimientos compensatorios pueden conservar la referencia de la transacción y el motivo.
