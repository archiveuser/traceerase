const $ = s => document.querySelector(s);
const CATS = { dev: 'разработка', soc: 'соцсети', blog: 'блоги', media: 'медиа', work: 'работа', game: 'игры', link: 'ссылки' };
let all = [], active = 'all';

const render = () => {
  const list = active === 'all' ? all : all.filter(source => source.cat === active);
  $('#source-grid').innerHTML = list.map((source, i) => `<article class="source-item"><span>${String(i + 1).padStart(2, '0')}</span><b>${source.n}</b><small>${CATS[source.cat] || source.cat}</small></article>`).join('');
};

fetch('/api/sources').then(r => r.json()).then(sources => {
  all = sources;
  $('#sources-total').textContent = all.length;
  const counts = all.reduce((out, source) => ({ ...out, [source.cat]: (out[source.cat] || 0) + 1 }), {});
  $('#source-filters').innerHTML = [['all', 'все', all.length], ...Object.entries(counts).map(([cat, count]) => [cat, CATS[cat], count])]
    .map(([cat, label, count]) => `<button class="source-filter${cat === active ? ' on' : ''}" data-cat="${cat}">${label}<b>${count}</b></button>`).join('');
  $('#source-filters').onclick = event => {
    const button = event.target.closest('button');
    if (!button) return;
    active = button.dataset.cat;
    $('#source-filters').querySelectorAll('button').forEach(item => item.classList.toggle('on', item === button));
    render();
  };
  render();
}).catch(() => { $('#source-grid').innerHTML = '<p class="sources-note">Не удалось загрузить список. Попробуй обновить страницу.</p>'; });
