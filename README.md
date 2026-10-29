# Portafolio · Verónica Urrutia

Sitio estático (HTML, CSS y JS, sin framework). Se publica en Vercel desde la carpeta `src`.

## Verlo en local

```bash
npm run dev
```

Abre http://localhost:3000. También puedes abrir `src/index.html` directo en el navegador, o usar la extensión Live Server de VS Code.

> No hace falta `npm install`: no hay dependencias.

## Estructura

```
src/
  index.html     contenido
  styles.css     estilos (tokens de color arriba, modo oscuro automático)
  script.js      menú móvil y link activo
  favicon.svg
  img/*.webp     capturas optimizadas (las .png originales ya no se usan)
```

## Agregar un proyecto

Copia un bloque `<article class="feature">` (destacados) o `<li class="more-item">` (más trabajo) en `index.html`. Guarda las imágenes en `img/` como `.webp` de 1600 px de ancho.
