# Contributing Guide

## PDV

Este documento define las reglas de desarrollo del proyecto.

Todo cambio nuevo deberá respetar la arquitectura definida en
`docs/architecture/architecture-standard.md`.

---

# Filosofía del proyecto

El objetivo principal del proyecto es construir un Punto de Venta
modular, escalable y fácil de mantener.

Antes de escribir código se debe privilegiar:

- simplicidad
- claridad
- modularidad
- bajo acoplamiento
- alta cohesión

No se aceptan soluciones que compliquen innecesariamente la arquitectura.

---

# Principios

## Una responsabilidad por archivo

Cada archivo debe tener un único propósito.

Ejemplos:

Core
    Router

Component
    Sidebar

Service
    ProductService

No mezclar responsabilidades.

---

## Una versión = un objetivo

Cada versión desarrolla una sola funcionalidad.

Ejemplo

v0.7.0
Modelo Producto

v0.7.1
ProductService

v0.7.2
Módulo Productos

Nunca desarrollar varias características grandes en una misma versión.

---

## El Core es infraestructura

El Core nunca conoce el negocio.

Correcto

core/
    router.js
    app.js
    logger.js

Incorrecto

Database.saveSale()

Router.loadProduct()

---

## Los módulos contienen el negocio

Toda la lógica del negocio vive dentro de los módulos.

Cada módulo administra únicamente su propio dominio.

---

## Comunicación

Los componentes no se llaman directamente entre sí.

Se comunican mediante:

- eventos
- callbacks

Nunca:

Sidebar -> Router

Siempre:

Sidebar
↓

App
↓

Router

---

## Servicios

Los servicios:

✔ Devuelven datos

✔ Ejecutan lógica

Nunca:

✘ Renderizan HTML

✘ Muestran Toast

✘ Abren Modales

---

## Componentes

Los componentes solamente modifican su propio DOM.

Nunca modifican el HTML de otro componente.

---

## Manifest

Todo módulo debe tener:

manifest.js

con el mismo contrato.

No existen excepciones.

---

## Estructura de módulos

Todo módulo comienza con:

modulo/

    manifest.js

    modulo.html

    modulo.css

    modulo.js

Si el módulo crece:

services/

components/

dialogs/

utils/

Sin modificar la arquitectura.

---

## Documentación

Antes de comenzar un módulo nuevo debe existir:

docs/modules/modulo.md

explicando:

- objetivo

- reglas

- modelo

- flujo

- casos de uso

Después comienza la programación.

---

## Antes de cerrar una versión

Verificar:

☐ Funciona.

☐ Sigue la arquitectura.

☐ No introduce dependencias.

☐ No duplica código.

☐ Mantiene una única responsabilidad.

☐ Actualizar CHANGELOG.md

☐ Actualizar ROADMAP.md

☐ Limpiar TODO.md

---

## Convención de nombres

Archivos

sidebar.js

router.js

database.js

ProductService.js

Variables

camelCase

Clases

PascalCase

Constantes

UPPER_SNAKE_CASE

---

## Regla de oro

Si una decisión rompe la arquitectura,
primero debe discutirse y documentarse.

La arquitectura solo podrá modificarse mediante
un Architecture Decision Record (ADR).

No mediante cambios directos al código.

# Criterio para aceptar código

Antes de agregar cualquier archivo nuevo, pregúntate:

¿Tiene una única responsabilidad?

¿Pertenece realmente a este módulo?

¿Rompe alguna regla de arquitectura?

¿Existe ya otro archivo que haga lo mismo?

¿Será fácil entenderlo dentro de un año?

Si alguna respuesta es "no", el diseño debe revisarse antes de implementarlo.