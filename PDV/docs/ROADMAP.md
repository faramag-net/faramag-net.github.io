## 0.9.12

Ticket virtual: reflejar devoluciones parciales y totales sin alterar la venta original.

## Prioridad actual — 0.9.x

La prioridad de la serie 0.9.x es disponer de una aplicación WEB funcional lo antes posible.

- 0.9.2 — Ventas integradas con inventario.
- 0.9.3 — Caja básica.
- 0.9.4 — Ticket virtual.
- 0.9.5 — Integración Caja / Ventas.
- Impresión física de tickets: posterior a 1.0.0.
- Dashboard avanzado: posterior a 1.0.0.

# ROADMAP

## Prioridad actual

La prioridad del proyecto es disponer de una aplicación WEB funcional lo antes posible, incluso antes de completar toda la serie 0.9.x.

- Ticket físico: posterior.
- Ticket virtual: requerido para el primer PDV funcional.
- Dashboard: básico durante 0.9.x y 1.0; mejoras posteriores.
- Historial visual completo: puede esperar mientras el flujo operativo principal sea funcional.

## 0.9.3

- Caja básica: apertura, seguimiento de ventas, efectivo esperado y cierre.

/**
 * ---------------------------------------------------
 * PDV
 * Archivo:
 * Descripción:
 * Versión:
 * Autor:
 * ---------------------------------------------------
 */

Versión	Objetivo
v0.7.0	Modelo del Dominio
v0.7.1	Arquitectura de Casos de Uso
v0.7.2	Modelo Artículo
v0.7.3	Casos de Uso de Artículo
v0.7.4	Persistencia de Artículo
v0.8.0	Primer módulo funcional (Artículos)

# Roadmap

Este documento presenta la planificación general del proyecto, describiendo los objetivos previstos para cada versión. Su contenido podrá ajustarse conforme evolucione el desarrollo, permitiendo adaptar el crecimiento del sistema sin perder la dirección establecida.

## Nueva prioridad de producto

Antes de completar todas las funcionalidades previstas para 1.0.0, la serie 0.9.x debe producir un PDV WEB funcional y utilizable.

| Versión | Objetivo |
|---|---|
| v0.9.1 | Artículos + Movement + Inventario funcional |
| v0.9.2 | Ventas + integración Ventas → Movement → Inventory |
| v0.9.3 | Caja básica y flujo operativo |
| v0.9.4 | Ticket virtual |
| v0.9.5 | Integración Caja / Ventas |
| 1.0.0 | PDV WEB funcional consolidado |
| posterior a 1.0.0 | Dashboard avanzado, impresión física y mejoras no esenciales |

## 0.9.6

- Devoluciones como operación del módulo Ventas.
- Caso de uso de Transaction para devolver.
- Movimientos ENTRY compensatorios sin borrar hechos históricos.
- Las cancelaciones antiguas se conservan únicamente como datos históricos.

## 0.9.7

- [x] Historial básico de ventas.
- [x] Historial básico de movimientos.
- [x] Referencia de movimientos de venta a su Transaction.


## 0.9.8

- [x] Integridad básica de IDs en repositorios locales.
- [x] Estado visible derivado de devoluciones en Historial.
- [x] Mantener Transaction COMPLETED como hecho original; la etiqueta operativa se deriva de devoluciones.
- [ ] Revisión general del flujo operativo.

## 0.9.9

Ajustes de operación antes de la revisión final de 0.9.x: impacto básico en Caja e integridad de códigos/IDs.

## 0.9.11

- La cancelación deja de ser una operación de una venta completada.
- Antes de completar la venta, el carrito permite quitar artículos.
- Después de completar la venta, las correcciones se realizan mediante devoluciones parciales o totales.
- Una devolución puede afectar una o varias líneas y cantidades pendientes de la misma venta.
- Caja descuenta cada operación de devolución según la sesión en la que se realiza.
- La venta original permanece como hecho histórico.

