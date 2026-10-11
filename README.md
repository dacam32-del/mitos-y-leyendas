# Mitos y Leyendas — Catálogo y Tienda

Catálogo de cartas de **Mitos y Leyendas** (TCG chileno) de David Eduardo, con tasación según el mercado chileno (CLP).

## 🛒 Tienda web
**https://dacam32-del.github.io/mitos-y-leyendas/**

Tienda estática (GitHub Pages, rama `main`, raíz) que lee `catalogo.csv` directamente en el navegador: al editar y subir el CSV, la tienda se actualiza sola.
- Búsqueda por nombre, habilidad y notas; filtros por edición, era, año, tipo, raza, estrategia, rareza, foil/normal y rango de precio; orden por precio, nombre o año.
- Contador de resultados y valor total filtrado. Las cartas con `ESTIMACIÓN` en notas se muestran como *precio estimado*.
- Contacto: edita `CONFIG.contactoUrl` al inicio de `app.js` (por ejemplo `https://wa.me/56XXXXXXXXX` o `mailto:...`). Vacío = botón oculto.
- Miniaturas: tras agregar fotos nuevas ejecuta `python3 scripts/miniaturas.py` (genera `fotos/thumbs/`).

## Archivos
- `index.html`, `style.css`, `app.js`: la tienda web.
- `catalogo.csv`: una fila por carta. Se puede filtrar y buscar directamente en GitHub o abrir en Excel / Google Sheets.

## Columnas
| Columna | Descripción |
|---|---|
| id | Identificador interno |
| nombre | Nombre de la carta |
| edicion | Edición o expansión (ej. El Reto, Mundo Gótico, Ragnarok) |
| era | Era / formato (Primera Era, Segunda Era/Imperio, Racial, etc.) |
| anio | Año de lanzamiento |
| tipo | Aliado, Talismán, Tótem, Arma, Oro |
| raza | Raza (si aplica) |
| coste | Coste en oros |
| fuerza | Fuerza (aliados) |
| rareza | Rareza (Común, Infrecuente, Rara, Ultra rara, Promo…) |
| estrategia | Arquetipo o estrategia en que se usa |
| estado | Estado físico (NM, LP, MP, HP) |
| idioma | Idioma |
| cantidad | Copias disponibles |
| precio_ref_min_clp | Precio de referencia mínimo encontrado (CLP) |
| precio_ref_max_clp | Precio de referencia máximo encontrado (CLP) |
| precio_sugerido_clp | Precio de venta sugerido (CLP) |
| fuentes | Dónde se encontraron los precios |
| fecha_tasacion | Fecha de la tasación |
| habilidad | Texto / habilidad de la carta |
| notas | Observaciones |
| foto | Ruta o enlace de la foto |
