/* ===== CONFIGURACIÓN (edita aquí) ===== */
const CONFIG = {
  csv: 'catalogo.csv',
  // Contacto: deja vacío ('') para ocultar el botón. Ejemplos:
  //   'https://wa.me/56XXXXXXXXX'   o   'mailto:tu-correo@ejemplo.cl'
  contactoUrl: 'https://wa.me/56956592453',
  contactoTexto: 'Consultar por WhatsApp',
  // Mensaje que se agrega al consultar por una carta (solo para enlaces wa.me / mailto)
  contactoMensaje: 'Hola, me interesa la carta: ',
  miniaturas: 'fotos/thumbs/', // carpeta de miniaturas (scripts/miniaturas.py)
};
/* ====================================== */

const $ = s => document.querySelector(s);
const fmt = n => '$' + Math.round(n).toLocaleString('es-CL');
const norm = s => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = s => (s || '').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Parser CSV (RFC 4180): comillas, comas y saltos de línea dentro de campos, "" escapado, BOM, CRLF.
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const base = s => (s || '').split(' — ')[0].replace(/\s*\(.*$/, '').replace(/^Probable\s+/i, '').trim();
function enriquecer(c) {
  const notas = c.notas || '';
  c.foil = /^FOIL\b/i.test(notas) || /\(foil\)/i.test(c.rareza || '');
  c.acabado = c.foil ? 'Foil' : 'Normal';
  c.estimado = /ESTIMACI[ÓO]N/i.test(notas);
  c.precio = parseInt(c.precio_sugerido_clp, 10) || 0;
  c.min = parseInt(c.precio_ref_min_clp, 10) || 0;
  c.max = parseInt(c.precio_ref_max_clp, 10) || 0;
  c.cant = parseInt(c.cantidad, 10) || 1;
  c.anioN = parseInt(c.anio, 10) || 0;
  c.edicionBase = base(c.edicion) || 'Sin dato';
  c.rarezaBase = (c.rareza || '').replace(/\s*\(foil\)/i, '').split(' (')[0].trim() || 'Sin dato';
  c.texto = norm([c.nombre, c.habilidad, c.notas, c.edicion, c.estrategia, c.raza].join(' '));
  return c;
}

let CARTAS = [];
const FILTROS = [...document.querySelectorAll('#filtros select')];

function poblarFiltros() {
  for (const sel of FILTROS) {
    const campo = sel.dataset.campo;
    const vals = [...new Set(CARTAS.map(c => c[campo]).filter(Boolean))]
      .sort((a, b) => campo === 'anio' ? b - a : a.localeCompare(b, 'es'));
    sel.innerHTML = '<option value="">Todas</option>' + vals.map(v => `<option>${esc(v)}</option>`).join('');
  }
}

function filtrar() {
  const q = norm($('#q').value).split(/\s+/).filter(Boolean);
  const pmin = parseInt($('#pmin').value, 10), pmax = parseInt($('#pmax').value, 10);
  const act = FILTROS.filter(s => s.value).map(s => [s.dataset.campo, s.value]);
  let r = CARTAS.filter(c =>
    q.every(t => c.texto.includes(t)) &&
    act.every(([k, v]) => (c[k] || '') === v) &&
    (isNaN(pmin) || c.precio >= pmin) && (isNaN(pmax) || c.precio <= pmax));
  const [k, dir] = $('#orden').value.split('-'); const s = dir === 'asc' ? 1 : -1;
  r.sort((a, b) => k === 'nombre' ? s * a.nombre.localeCompare(b.nombre, 'es')
    : k === 'anio' ? s * (a.anioN - b.anioN) || a.nombre.localeCompare(b.nombre, 'es')
    : s * (a.precio - b.precio) || a.nombre.localeCompare(b.nombre, 'es'));
  render(r);
}

const thumb = f => f ? CONFIG.miniaturas + f.split('/').pop() : '';
function render(lista) {
  const total = lista.reduce((a, c) => a + c.precio * c.cant, 0);
  const copias = lista.reduce((a, c) => a + c.cant, 0);
  $("#st-filtradas").textContent = copias; $("#st-filtradas").title = lista.length + " fichas";
  $('#st-valor').textContent = fmt(total);
  $('#estado').textContent = lista.length ? '' : 'No hay cartas que coincidan con la búsqueda.';
  $('#grid').innerHTML = lista.map(c => `
    <article class="card" tabindex="0" data-id="${esc(c.id)}">
      <div class="card-img">
        ${c.foto ? `<img loading="lazy" src="${esc(thumb(c.foto))}" data-full="${esc(c.foto)}" alt="${esc(c.nombre)}" onerror="if(this.src.indexOf('thumbs')>-1)this.src=this.dataset.full">` : '<span class="noimg">Sin foto</span>'}
        <span class="badge ${c.foil ? 'foil' : 'normal'}">${c.acabado}</span>
        ${c.cant > 1 ? `<span class="cant">×${c.cant}</span>` : ''}
      </div>
      <div class="card-body">
        <h2>${esc(c.nombre)}</h2>
        <p class="ed">${esc(c.edicionBase)}${c.anio ? ' · ' + esc(c.anio) : ''}</p>
        <div class="tags">
          ${c.tipo ? `<span class="tag">${esc(c.tipo)}</span>` : ''}
          ${c.raza ? `<span class="tag">${esc(c.raza)}</span>` : ''}
          <span class="tag rareza">${esc(c.rarezaBase)}</span>
          <span class="tag estado">${esc(c.estado || '—')}</span>
        </div>
        ${c.estrategia ? `<p class="estr">${esc(c.estrategia)}</p>` : ''}
        <div class="precio">
          <div><strong>${c.precio ? fmt(c.precio) : 'Consultar'}</strong> ${c.cant > 1 ? '<small>c/u</small>' : ''}</div>
          <small class="${c.estimado ? 'est' : ''}">${c.estimado ? 'precio estimado' : 'precio sugerido'}</small>
        </div>
      </div>
    </article>`).join('');
}

function linkContacto(c) {
  const u = CONFIG.contactoUrl; if (!u) return '';
  const msg = encodeURIComponent(CONFIG.contactoMensaje + c.nombre + ' (' + c.id + ')');
  const href = u.startsWith('mailto:') ? `${u}?subject=${msg}` : /wa\.me/.test(u) ? `${u}?text=${msg}` : u;
  return `<p><a class="btn-contacto" href="${esc(href)}" target="_blank" rel="noopener">${esc(CONFIG.contactoTexto)}</a></p>`;
}
function fuentesHTML(f) {
  if (!f) return '<p>Sin fuentes publicadas.</p>';
  return '<p class="fuentes">' + f.split(/;\s*/).map(s =>
    esc(s).replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')).join('<br>') + '</p>';
}
function abrir(id) {
  const c = CARTAS.find(x => x.id === id); if (!c) return;
  const rango = c.min || c.max ? (c.min === c.max ? fmt(c.min) : `${fmt(c.min)} – ${fmt(c.max)}`) : 'Sin referencia publicada';
  const filas = [['Edición', c.edicion], ['Era / formato', c.era], ['Año', c.anio], ['Tipo', c.tipo], ['Raza', c.raza],
    ['Coste', c.coste], ['Fuerza', c.fuerza], ['Rareza', c.rareza], ['Acabado', c.acabado], ['Estrategia', c.estrategia],
    ['Estado', c.estado], ['Idioma', c.idioma], ['Cantidad', c.cant], ['ID', c.id]]
    .filter(([, v]) => v !== '' && v != null).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
  $('#detalle-cuerpo').innerHTML = `<div class="det">
    <div>${c.foto ? `<img src="${esc(c.foto)}" alt="${esc(c.nombre)}">` : ''}</div>
    <div>
      <h2>${esc(c.nombre)}</h2>
      <div class="precio"><div><strong>${c.precio ? fmt(c.precio) : 'Consultar'}</strong> ${c.cant > 1 ? '<small>c/u</small>' : ''}</div>
        <small class="${c.estimado ? 'est' : ''}">${c.estimado ? 'precio estimado' : 'precio sugerido'}</small></div>
      ${c.estimado ? '<div class="aviso">Precio estimado: no se encontró una referencia publicada para esta versión; es una estimación por comparación.</div>' : ''}
      <dl>${filas}</dl>
      <h3>Habilidad</h3><p>${esc(c.habilidad) || '<em>Sin habilidad (o no registrada).</em>'}</p>
      <h3>Rango de precio de referencia</h3><p>${rango}${c.fecha_tasacion ? ` · tasación ${esc(c.fecha_tasacion)}` : ''}</p>
      <h3>Fuentes</h3>${fuentesHTML(c.fuentes)}
      <h3>Notas</h3><p>${esc(c.notas) || '—'}</p>
      ${linkContacto(c)}
    </div></div>`;
  $('#detalle').showModal();
}

async function iniciar() {
  try {
    const res = await fetch(CONFIG.csv + '?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    CARTAS = parseCSV(await res.text()).filter(c => c.id && c.nombre).map(enriquecer);
  } catch (e) {
    $('#estado').textContent = 'No se pudo cargar el catálogo (' + e.message + ').'; return;
  }
  $('#st-cartas').textContent = CARTAS.reduce((a, c) => a + c.cant, 0);
  const fechas = [...new Set(CARTAS.map(c => c.fecha_tasacion).filter(Boolean))].sort();
  $('#fecha-tasacion').textContent = fechas.length ? fechas[fechas.length - 1] : '—';
  if (CONFIG.contactoUrl) { const a = $('#contacto'); a.href = CONFIG.contactoUrl; a.textContent = CONFIG.contactoTexto; a.hidden = false; a.target = '_blank'; a.rel = 'noopener'; }
  poblarFiltros(); filtrar();
}

$('#q').addEventListener('input', filtrar);
$('#orden').addEventListener('change', filtrar);
['#pmin', '#pmax'].forEach(s => $(s).addEventListener('input', filtrar));
FILTROS.forEach(s => s.addEventListener('change', filtrar));
$('#limpiar').addEventListener('click', () => { FILTROS.forEach(s => s.value = ''); $('#pmin').value = $('#pmax').value = ''; $('#q').value = ''; filtrar(); });
$('#toggle-filtros').addEventListener('click', e => { const f = $('#filtros'); f.hidden = !f.hidden; e.currentTarget.setAttribute('aria-expanded', !f.hidden); });
$('#grid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) abrir(c.dataset.id); });
$('#grid').addEventListener('keydown', e => { if (e.key === 'Enter') { const c = e.target.closest('.card'); if (c) abrir(c.dataset.id); } });
$('#detalle .cerrar').addEventListener('click', () => $('#detalle').close());
$('#detalle').addEventListener('click', e => { if (e.target.id === 'detalle') $('#detalle').close(); });
iniciar();
