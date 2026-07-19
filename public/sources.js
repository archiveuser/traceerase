import './ui.js';

const $ = selector => document.querySelector(selector);
const t = (key, vars) => window.TraceUI?.t(key, vars) || key;
const categoryName = category => t(`cat.${category}`);
const safeUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
};

let all = [];
let category = 'all';
const requestedMode = new URLSearchParams(location.search).get('mode');
let mode = ['auto', 'manual'].includes(requestedMode) ? requestedMode : 'all';
let query = '';

const filtered = () => all.filter(source =>
  (category === 'all' || source.cat === category) &&
  (mode === 'all' || source.mode === mode) &&
  (!query || source.n.toLocaleLowerCase().includes(query))
);

const makeButton = (label, count, active, dataName, dataValue) => {
  const button = document.createElement('button');
  button.className = `source-filter${active ? ' on' : ''}`;
  button.dataset[dataName] = dataValue;
  button.append(document.createTextNode(label));
  const number = document.createElement('b'); number.textContent = count; button.append(number);
  return button;
};

const render = () => {
  const grid = $('#source-grid');
  grid.replaceChildren();
  const list = filtered();
  if (!list.length) {
    const empty = document.createElement('p'); empty.className = 'sources-note'; empty.textContent = t('sources.empty');
    grid.append(empty); return;
  }
  list.forEach((source, index) => {
    const article = document.createElement('article');
    article.className = `source-item is-${source.mode}`;
    const number = document.createElement('span'); number.textContent = String(index + 1).padStart(3, '0');
    const copy = document.createElement('div');
    const name = document.createElement('b'); name.textContent = source.n;
    const meta = document.createElement('small');
    meta.textContent = source.limitation === 'no-public-username'
      ? t('sources.noPublicUsername')
      : categoryName(source.cat);
    copy.append(name, meta);
    const badge = document.createElement('em');
    badge.className = `source-mode ${source.mode}`;
    badge.textContent = t(`sources.mode.${source.mode}`);
    const href = safeUrl(source.home);
    if (href) {
      const link = document.createElement('a'); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', t('sources.open', { source: source.n })); link.textContent = '↗';
      article.append(number, copy, badge, link);
    } else article.append(number, copy, badge);
    grid.append(article);
  });
};

const renderFilters = () => {
  const categoryPool = mode === 'all' ? all : all.filter(source => source.mode === mode);
  const categoryCounts = categoryPool.reduce((out, source) => ({ ...out, [source.cat]: (out[source.cat] || 0) + 1 }), {});
  const filters = $('#source-filters'); filters.replaceChildren();
  filters.append(makeButton(t('sources.all'), categoryPool.length, category === 'all', 'cat', 'all'));
  Object.entries(categoryCounts).forEach(([key, count]) => filters.append(makeButton(categoryName(key), count, category === key, 'cat', key)));

  const auto = all.filter(source => source.mode === 'auto').length;
  const manual = all.length - auto;
  const modes = $('#source-modes'); modes.replaceChildren();
  [['all', t('sources.mode.all'), all.length], ['auto', t('sources.mode.auto'), auto], ['manual', t('sources.mode.manual'), manual]]
    .forEach(([key, label, count]) => modes.append(makeButton(label, count, mode === key, 'mode', key)));
};

fetch('/api/sources').then(response => {
  if (!response.ok) throw new Error('source catalog unavailable');
  return response.json();
}).then(sources => {
  all = sources;
  const automatic = all.filter(source => source.mode === 'auto').length;
  $('#sources-total').textContent = all.length;
  $('#sources-auto').textContent = automatic;
  $('#sources-manual').textContent = all.length - automatic;
  renderFilters(); render();
}).catch(() => {
  const error = document.createElement('p'); error.className = 'sources-note'; error.textContent = t('sources.error');
  $('#source-grid').replaceChildren(error);
});

$('#source-filters').addEventListener('click', event => {
  const button = event.target.closest('button[data-cat]');
  if (!button) return;
  category = button.dataset.cat; renderFilters(); render();
});
$('#source-modes').addEventListener('click', event => {
  const button = event.target.closest('button[data-mode]');
  if (!button) return;
  mode = button.dataset.mode;
  const categoryAvailable = category === 'all' || all.some(source => (mode === 'all' || source.mode === mode) && source.cat === category);
  if (!categoryAvailable) category = 'all';
  const url = new URL(location.href);
  if (mode === 'all') url.searchParams.delete('mode'); else url.searchParams.set('mode', mode);
  history.replaceState(null, '', url);
  renderFilters(); render();
});
$('#source-search').addEventListener('input', event => {
  query = event.target.value.trim().toLocaleLowerCase(); render();
});

document.addEventListener('traceerase:languagechange', () => { renderFilters(); render(); });
