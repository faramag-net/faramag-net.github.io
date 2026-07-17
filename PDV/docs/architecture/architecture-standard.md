# PDV Architecture Standard

**Proyecto:** PDV  
**Versión del estándar:** 1.0  
**Estado:** Congelado  
**Última actualización:** v0.7.0

---

# Objetivo

Este documento define las reglas oficiales de arquitectura del proyecto.

A partir de la versión **0.7.0**, la arquitectura se considera estable.
Toda nueva funcionalidad deberá adaptarse a estas reglas.

El objetivo es mantener un sistema:

- modular
- desacoplado
- reutilizable
- fácil de mantener
- fácil de escalar

---

# Filosofía

La simplicidad siempre tiene prioridad.

Ante dos soluciones correctas, debe elegirse la más sencilla.

No buscamos impresionar con la arquitectura.
Buscamos que dentro de varios años el proyecto siga siendo fácil de entender.

---

# Principios

## 1. El Core es infraestructura

El Core nunca contiene reglas de negocio.

Su responsabilidad es proporcionar servicios comunes para toda la aplicación.

Ejemplos:

- App
- Router
- Database
- Logger
- Config

---

## 2. Los módulos conocen el negocio

Toda la lógica de negocio pertenece a los módulos.

Cada módulo administra únicamente su propio dominio.

Ejemplos:

- Productos
- Inventario
- Ventas
- Caja

---

## 3. Un componente tiene una única responsabilidad

Cada componente debe hacer una sola cosa.

Ejemplos:

Sidebar

- genera el menú
- emite eventos

Router

- carga módulos
- destruye el módulo anterior

Nunca deben mezclarse responsabilidades.

---

## 4. Los componentes no se conocen entre sí

La comunicación debe realizarse mediante eventos o callbacks.

Incorrecto

Sidebar → Router

Correcto

Sidebar

↓

App

↓

Router

---

## 5. El DOM pertenece al componente

Cada componente modifica únicamente su propio HTML.

Nunca modifica directamente la interfaz de otro componente.

---

## 6. Los servicios no renderizan

Los servicios contienen lógica.

Nunca contienen presentación.

Pueden:

- consultar datos
- validar
- calcular
- transformar información

Nunca:

- generar HTML
- abrir modales
- mostrar Toast
- modificar el DOM

---

## 7. Un flujo tiene un único responsable

Toda operación importante debe tener un único orquestador.

Ejemplo:

Venta

↓

SalesService

↓

Inventario

↓

Caja

No deben existir cadenas de llamadas descontroladas entre módulos.

---

## 8. Un único origen de datos

Cada dato debe tener un único lugar donde se administra.

Nunca duplicar información entre componentes.

---

## 9. Manifest obligatorio

Todo módulo debe contener:

- manifest.js

Con la estructura oficial definida por el proyecto.

---

## 10. Estructura uniforme

Todo módulo comienza con:

modulo/

    manifest.js

    modulo.html

    modulo.css

    modulo.js

Si el módulo crece podrá incorporar:

- services/
- components/
- dialogs/
- utils/

Sin modificar la arquitectura.

---

## 11. Versionado disciplinado

Cada versión desarrolla un único objetivo.

Ejemplos:

v0.7.0

Modelo Producto

v0.7.1

ProductService

v0.7.2

Módulo Productos

Nunca mezclar funcionalidades grandes en la misma versión.

---

## 12. Código explicativo

Los nombres deben explicar la intención.

Se prefieren métodos pequeños con nombres claros antes que comentarios extensos.

---

# Definición de terminado

Una tarea se considera terminada cuando:

- cumple una única responsabilidad
- respeta esta arquitectura
- no introduce dependencias innecesarias
- evita duplicación evidente
- mantiene consistencia con el resto del proyecto
- funciona correctamente

---

# Estado

La arquitectura queda oficialmente congelada a partir de la versión 0.7.0.

Las siguientes versiones deberán enfocarse exclusivamente en construir funcionalidades del negocio.