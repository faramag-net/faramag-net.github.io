PDV - Reglas Oficiales de Arquitectura (v0.8.0)
Regla 1. El negocio primero

El dominio define la arquitectura, nunca la tecnología.

Regla 2. Arquitectura Modular

Cada módulo es independiente y puede evolucionar sin afectar a los demás.

Regla 3. Responsabilidad Única

Cada clase debe tener una sola responsabilidad.

Regla 4. Core independiente

core/ nunca contiene reglas del negocio.

Regla 5. El Dominio no conoce la UI

El dominio nunca depende de HTML, CSS, Router o Electron.

Regla 6. El Dominio no conoce la Persistencia

Las entidades nunca leen ni escriben directamente en la base de datos.

Regla 7. Toda operación del negocio ocurre mediante un Caso de Uso

Nunca desde la interfaz.

Regla 8. Los Repositories son contratos

No contienen lógica del negocio.

Regla 9. Infrastructure implementa los contratos

LocalStorage, SQLite o API pertenecen a Infrastructure.

Regla 10. Database es una fachada

Todo acceso a la persistencia pasa por Database.

Nunca directamente por localStorage.

Regla 11. Storage solo conoce la tecnología

No conoce entidades del negocio.

Regla 12. El Router solo navega

Nunca ejecuta lógica del negocio.

Regla 13. Los módulos solo coordinan la interfaz

No implementan reglas del negocio.

Regla 14. Las entidades protegen su estado

Las validaciones pertenecen a la entidad.

Regla 15. Las entidades representan conceptos del negocio

No tablas de una base de datos.

Regla 16. El lenguaje ubicuo es obligatorio

Todo el código debe usar los mismos términos del dominio.

Ejemplo:

Article
Transaction
Movement
Cash
Regla 17. No existen cadenas mágicas

Toda constante compartida debe centralizarse.

Ejemplo:

DB_KEYS.ARTICLES
Regla 18. Convención de nombres
Elemento	Convención
Carpetas	minúsculas
Archivos	kebab-case
Clases	PascalCase
Variables	camelCase
Constantes	UPPER_SNAKE_CASE
Regla 19. Un módulo siempre tiene la misma estructura
manifest.js
module.js
module.html
module.css
Regla 20. Un agregado del dominio siempre tiene la misma estructura
article/

article.js

article-repository.js

use-cases/
Regla 21. El dominio se organiza por negocio

Nunca por tipo de archivo.

Correcto:

article/
transaction/
cash/

Incorrecto:

models/
entities/
validators/
Regla 22. No crear dominios anticipadamente

Un nuevo dominio solo nace cuando tiene identidad propia, reglas propias y casos de uso propios.

Regla 23. La simplicidad tiene prioridad

No implementar funcionalidades "por si acaso".

Regla 24. No implementar métodos sin necesidad

Un método solo existe cuando un Caso de Uso lo requiere.

Regla 25. La infraestructura puede cambiar

Cambiar LocalStorage por SQLite no debe afectar al dominio.

Regla 26. Los objetos del dominio son reutilizables

Una entidad debe poder utilizarse desde una aplicación web, Electron o una API sin modificaciones.

Regla 27. La arquitectura está congelada

A partir de la versión 0.7.0 los cambios estructurales requieren una justificación técnica.

Regla 28. Cada versión tiene un único objetivo

No mezclar grandes cambios de arquitectura con nuevas funcionalidades.

Regla 29. Todo cambio importante debe quedar documentado

La arquitectura siempre debe ser comprensible sin depender de la memoria.

Regla 30. La funcionalidad valida la arquitectura

La arquitectura solo se considera correcta cuando un flujo completo funciona.

Ejemplo:

UI

↓

Use Case

↓

Repository

↓

Database

↓

Storage
Regla 31. Cada versión debe producir una funcionalidad visible

No dedicar versiones completas únicamente a infraestructura.

Cada versión debe acercar el sistema a un producto funcional.

Me gustaría agregar cuatro reglas más

Creo que han surgido de forma natural y vale la pena convertirlas en oficiales.

Regla 32. Una dependencia siempre apunta hacia el dominio

Nunca al revés.

UI
↓

Use Case
↓

Domain

Nunca:

Domain
↓

UI
Regla 33. Las entidades son el centro del sistema

Todo gira alrededor del dominio.

La infraestructura es reemplazable.

Regla 34. La arquitectura debe permitir crecer sin reescribir

Agregar un nuevo dominio no debe romper los existentes.

Regla 35. Antes de optimizar, validar

Primero hacer que una funcionalidad funcione correctamente.

Después refactorizar y optimizar.


Regla 36. No refactorizar código estable sin una razón funcional.

Es muy fácil caer en:

"Podemos hacerlo más elegante."

Pero eso hace perder semanas.

La regla sería:

Si funciona, es claro y no impide nuevas funcionalidades, no se modifica.

Y una última regla
Regla 37. Cada Sprint debe terminar con algo demostrable.

No importa cuántas clases se escriban.

Lo importante es poder decir:

"Ya puedo registrar un artículo."

Después:

"Ya puedo editar un artículo."

Después:

"Ya puedo registrar movimientos."

Esas son evidencias de avance.

Regla 38. Cada nueva funcionalidad debe atravesar todas las capas de la arquitectura.

Es decir, nunca implementaremos algo "rápido" saltándonos una capa.

Cada funcionalidad seguirá siempre este recorrido:

Regla 39. No escribimos código sin antes definir el comportamiento esperado.

Regla 40. Nunca usar eventos HTML (onclick, onchange, etc.). Todos los eventos se registran desde JavaScript mediante addEventListener().

Regla 41. Todo módulo debe seguir el mismo ciclo de vida.

Regla 42. El HTML debe expresar la estructura del documento, no solo la apariencia.

Correcto:

<header>

<section>

<form>

<main>

<footer>

Incorrecto:

<div>

<div>

<div>

<div>


Regla 43. Primero funcional, después atractivo.

En esta versión el CSS solo debe:

Dar separación entre secciones.
Hacer legible el formulario.
Hacer legible la tabla.
Verse correctamente en móvil y escritorio.

Nada de colores definitivos, animaciones o efectos. Eso vendrá cuando el módulo ya funcione.