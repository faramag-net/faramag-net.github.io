# Regla única de versionado — Productos Santa Rosa

Esta es la única regla que define cómo se incrementa `VERSION` en Productos Santa Rosa.

## 1. BUILD

`BUILD` identifica una compilación concreta y cambia en **cada cambio realizado dentro de `productos-santa-rosa` que se entregue como una nueva compilación**.

Formato obligatorio:

```text
BUILD: "xxxxxxxx.xxxxxx"
```

La primera parte corresponde a la fecha (`YYYYMMDD`) y la segunda a la hora (`HHMMSS`).

Ejemplo:

```text
BUILD: "20261006.121856"
```

El ejemplo anterior es solamente ilustrativo. Cada nueva compilación debe recibir su propio BUILD.

## 2. VERSION — arreglos del mismo problema

Cuando se está corrigiendo **un problema específico**, o varios errores que forman parte del mismo conjunto de arreglos, solamente aumenta el último número:

```text
1.0.0.1
1.0.0.2
1.0.0.3
...
1.0.0.20
```

Mientras el mismo problema siga en proceso, se continúa con esa misma familia de versión.

## 3. VERSION — problema nuevo y distinto

Cuando el problema anterior queda resuelto y se empieza a trabajar en **otro problema totalmente distinto**, se inicia una nueva familia de versiones.

Ejemplo:

```text
1.0.0.20  → último arreglo del problema anterior
1.0.2.0   → inicio del problema nuevo
1.0.2.1
1.0.2.2
...
1.0.2.12
```

Los arreglos posteriores de ese nuevo problema continúan aumentando el último número hasta resolverlo.

## 4. VERSION — cambio mayor

Si el cambio implica una modificación mayor de la aplicación, por ejemplo:

- reestructurar un módulo;
- cambiar casi por completo sus lógicas;
- modificar de forma importante la arquitectura interna de un módulo;
- realizar cambios mayores en `core`;
- hacer una modificación estructural que afecte varias partes importantes de la aplicación;

se incrementa el nivel mayor correspondiente y se reinicia la familia de arreglos.

Ejemplo:

```text
1.0.2.12  → versión anterior
1.1.0.0   → cambio mayor
1.1.0.1
1.1.0.2
...
```

## 5. Regla práctica

Antes de modificar `VERSION`, determinar primero cuál de estas tres situaciones corresponde:

1. **Mismo problema:** aumentar el último número.
2. **Problema nuevo y distinto:** iniciar una nueva familia, por ejemplo `1.0.2.0`.
3. **Cambio mayor/estructural:** pasar al siguiente nivel mayor, por ejemplo `1.1.0.0`.

`BUILD` cambia en cada nueva compilación entregada, independientemente de que `VERSION` cambie o no.

## 6. Identificación en Inicio

La pantalla de Inicio debe mostrar siempre ambos valores:

```text
VERSION: "x.x.x.x"
BUILD:   "xxxxxxxx.xxxxxx"
```

`VERSION` indica **qué etapa de evolución funcional** de la aplicación representa el código.

`BUILD` indica **qué compilación concreta** se está ejecutando.
