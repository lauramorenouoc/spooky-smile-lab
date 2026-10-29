Spooky Smile Lab

## Descripción

Spooky Smile Lab es una aplicación interactiva de temática Halloween desarrollada para el proyecto HealthySmile. Utiliza la cámara del ordenador y tecnologías de detección facial para crear una experiencia visual interactiva relacionada con la salud bucodental.

La aplicación web original se ha adaptado a una aplicación de escritorio mediante **Tauri**, con una ventana a pantalla completa optimizada para monitores de 1920 × 1080 píxeles.

## Tecnologías utilizadas

- HTML5, CSS y JavaScript.
- [p5.js](https://p5js.org/) para los elementos visuales interactivos.
- Tauri para empaquetar la aplicación como software de escritorio.
- MediaPipe para las funciones de detección facial.

## Requisitos

- Node.js y npm.
- Los requisitos de desarrollo de Tauri para el sistema operativo utilizado.
- Conexión a Internet para cargar las dependencias externas que utiliza la aplicación.

## Cómo ejecutar el proyecto

1. Clonar o descargar este repositorio.
2. Abrir una terminal en la carpeta del proyecto.
3. Instalar las dependencias:

   npm install


4. Ejecutar la aplicación en modo desarrollo:

   npm run tauri dev

## Cómo compilar la aplicación

Para generar una versión de escritorio:

npm run tauri
