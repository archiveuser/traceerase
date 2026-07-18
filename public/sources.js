import './ui.js';

const $ = s => document.querySelector(s);
const t = key => window.TraceUI?.t(key) || key;
const categoryName = category => t(`cat.${category}`);
let all = [], active = 'all', counts = {};

const render = () => {
  const list = active === 'all' ? all : all.filter(source => source.cat === active);
  $('#source-grid').innerHTML = list.map((source, i) => `<article class="source-item"><span>${String(i + 1).padStart(2, '0')}</span><b>${source.n}</b><small>${categoryName(source.cat)}</small></article>`).join('');
};

const renderFilters = () => {
  $('#source-filters').innerHTML = [['all', t('sources.all'), all.length], ...Object.entries(counts).map(([cat, count]) => [cat, categoryName(cat), count])]
    .map(([cat, label, count]) => `<button class="source-filter${cat === active ? ' on' : ''}" data-cat="${cat}">${label}<b>${count}</b></button>`).join('');
};

fetch('/api/sources').then(r => r.json()).then(sources => {
  all = sources;
  $('#sources-total').textContent = all.length;
  counts = all.reduce((out, source) => ({ ...out, [source.cat]: (out[source.cat] || 0) + 1 }), {});
  renderFilters();
  $('#source-filters').onclick = event => {
    const button = event.target.closest('button');
    if (!button) return;
    active = button.dataset.cat;
    $('#source-filters').querySelectorAll('button').forEach(item => item.classList.toggle('on', item === button));
    render();
  };
  render();
}).catch(() => { $('#source-grid').innerHTML = `<p class="sources-note">${t('sources.error')}</p>`; });

document.addEventListener('traceerase:languagechange', () => { renderFilters(); render(); });
