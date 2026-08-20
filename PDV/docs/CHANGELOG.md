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
