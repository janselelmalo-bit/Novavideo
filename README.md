# NovaVideo AI Studio — PWA

Esta versión puede instalarse desde Chrome/Edge como una aplicación en Android.

IMPORTANTE: una PWA no elimina el backend. Para generar videos reales necesitas alojar este proyecto en un servicio que ejecute Node.js y configurar `REPLICATE_API_TOKEN` como secreto del servidor.

Instalación en Android:
1. Abre la URL pública de NovaVideo en Chrome.
2. Pulsa ⋮.
3. Selecciona "Añadir a pantalla de inicio" o "Instalar aplicación".
4. Abre NovaVideo desde el icono.

Para generación real:
- `REPLICATE_API_TOKEN`
- opcional: `VIDEO_MODEL=google/veo-3.1-fast`

No pongas el token dentro de `public/` ni del navegador.
