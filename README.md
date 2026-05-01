# iBoost Studio - Sitio para GitHub Pages

## Archivos principales
- `index.html`: sitio público.
- `admin.html`: panel de administración.
- `data/site-config.json`: contenido editable.
- `assets/style.css`: estilos responsive.
- `assets/app.js`: carga dinámica del contenido.
- `assets/admin.js`: sincronización con GitHub.

## Publicación rápida en GitHub Pages
1. Crea un repositorio.
2. Sube todos los archivos respetando carpetas.
3. Activa GitHub Pages desde Settings > Pages > Deploy from branch.
4. Abre `https://TU-USUARIO.github.io/TU-REPO/`.

## Panel admin
En `admin.html` captura:
- owner: tu usuario u organización
- repo: nombre del repositorio
- branch: normalmente `main`
- token: token personal de GitHub con permisos para Contents / repo

Después podrás actualizar `data/site-config.json` y subir imágenes, música o PDF.
