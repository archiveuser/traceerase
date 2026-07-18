const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const CAT = { dev: 'разработка', soc: 'соцсети', blog: 'блоги', media: 'медиа', work: 'работа', game: 'игры', link: 'ссылки', risk: 'риск', infra: 'инфраструктура' };
const ST = { found: 'след найден', free: 'чисто', unknown: 'проверь вручную' };
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- фон: поле следов, которое стирается при скролле ----------
   Вместо созвездия из точек — настоящие следы: телефоны, почты, профили.
   Скроллишь — плашка съедает строку слева направо, и след исчезает.
   Это не украшение, а продукт: то же самое делает кнопка «Стереть всё».      */
{
  const TRACES = [
    'vk.com/id118***', 't.me/durov', 'github.com/torvalds', '+7 9** *** ** 47',
    'ivan.petrov@mail.ru', 'archive.org/web/2016', 'steamcommunity.com/id/***',
    'leak-db.io/breach/2019', 'ok.ru/profile/5***', 'forum.***/member/2291',
    'avito.ru/user/***', 'MD5:9b74c9897bac770ffc02', 'habr.com/users/***',
    'last.fm/user/***', '192.168.***.***', 'bsky.app/profile/***',
    'peoplefinder.***/profile', 'namemc.com/profile/***'
  ];
  const c = $('#trace'), x = c.getContext('2d');
  let lines = [], W, H, queued = false;

  const build = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.font = '11px ui-monospace, Menlo, Consolas, monospace';
    lines = TRACES.map((t, i) => {
      // Золотой угол по горизонтали: раскладывает ровно, без сгустков и без Math.random,
      // поэтому на resize строки не прыгают на новые места.
      const px = ((i * 137.508) % 100) / 100;
      const py = (i + .5) / TRACES.length;
      return { t, x: 24 + px * (W - 240), y: 40 + py * (H - 80), w: x.measureText(t).width, at: py * .5 };
    });
    draw();
  };

  const draw = () => {
    queued = false;
    const s = Math.min(1, scrollY / innerHeight);
    x.clearRect(0, 0, W, H);
    for (const l of lines) {
      const p = Math.max(0, Math.min(1, (s - l.at) / .32));   // 0 — цел, 1 — стёрт
      if (p >= 1) continue;
      x.fillStyle = 'rgba(255,255,255,.07)';
      x.fillText(l.t, l.x, l.y);
      if (p > 0) {
        // destination-out именно стирает пиксели. Залить чёрным нельзя:
        // канвас лежит поверх свечения, и плашка стала бы видимым прямоугольником.
        // Альфа ИСТОЧНИКА задаёт глубину стирания, поэтому fillStyle обязан быть
        // непрозрачным: с оставшимся от текста rgba(...,.07) плашка съедала бы 7% от 7%.
        x.globalCompositeOperation = 'destination-out';
        x.fillStyle = '#000';
        x.fillRect(l.x - 2, l.y - 10, l.w * p + 2, 13);
        x.globalCompositeOperation = 'source-over';
        x.fillStyle = 'rgba(255,255,255,.4)';                 // головка стирателя
        x.fillRect(l.x - 2 + l.w * p, l.y - 10, 1, 13);
      }
    }
  };

  // Ни одного вечного rAF-цикла: перерисовка только на скролл и resize.
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(draw) } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', build);
  build();
}

/* ---------- стекло в шапке появляется только когда есть что преломлять ---------- */
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('stuck', scrollY > 24), { passive: true });

/* ---------- источники: число и бегущая строка берутся с сервера ---------- */
let sourceTotal = '60+';
fetch('/api/sites').then(r => r.json()).then(names => {
  sourceTotal = names.length;
  $('#srccount').textContent = names.length;
  if (!$('#q').value.trim()) $('#signal-state span').textContent = `${names.length} источников готово`;
  // Список дублируется дважды: лента едет на -50% и стыкуется сама с собой без шва.
  $('#tick').innerHTML = [...names, ...names].map(n => `<span>${n}</span>`).join('');
}).catch(() => ($('#srccount').textContent = '60+'));

const COVERAGE = { dev: 'разработка', soc: 'соцсети', blog: 'блоги', media: 'медиа', work: 'работа', game: 'игры', link: 'ссылки' };
fetch('/api/coverage').then(r => r.json()).then(coverage => {
  $('#coverage-grid').innerHTML = Object.entries(coverage).map(([key, count], i) =>
    `<div class="coverage-card" style="--i:${i}"><b>${count}</b><span>${COVERAGE[key] || key}</span></div>`
  ).join('');
}).catch(() => { $('#coverage-grid').innerHTML = '<div class="coverage-card"><b>60+</b><span>публичных источников</span></div>'; });

/* ---------- появление секций ---------- */
const io = new IntersectionObserver((entries, o) => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('vis'); o.unobserve(e.target) }
}), { threshold: .1 });
$$('.rv').forEach(el => io.observe(el));

/* ---------- курсор: магнит на кнопках, свет на панелях ---------- */
if (!calm && matchMedia('(hover: hover)').matches) {
  $$('.mag').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left - r.width / 2) * .22 + 'px');
      el.style.setProperty('--my', (e.clientY - r.top - r.height / 2) * .28 + 'px');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px');
    });
  });
  $$('.spot').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', e.clientX - r.left + 'px');
      el.style.setProperty('--sy', e.clientY - r.top + 'px');
    });
  });
}

/* ---------- GDPR-требование ---------- */
const letterFor = (src, url, q) => {
  const host = url ? new URL(url).hostname.replace(/^www\./, '') : `${src.toLowerCase()}.com`;
  return `Кому: privacy@${host} (или support@${host})
Тема: Требование об удалении персональных данных — ${q}

Здравствуйте!

Я являюсь субъектом персональных данных. На вашем ресурсе размещены мои данные, связанные с идентификатором «${q}».${url ? `\nСсылка: ${url}` : ''}

На основании ст. 17 Регламента (ЕС) 2016/679 (GDPR) — «право на забвение» — и ст. 14 Федерального закона № 152-ФЗ «О персональных данных» требую:

1. Удалить учётную запись «${q}» и все связанные с ней персональные данные.
2. Удалить все резервные копии, содержащие эти данные.
3. Прекратить передачу этих данных третьим лицам.
4. Письменно подтвердить удаление в течение 30 календарных дней.

В случае отказа или отсутствия ответа я буду вынужден(а) обратиться в надзорный орган по защите персональных данных.

С уважением,
${q}
Дата: ${new Date().toLocaleDateString('ru-RU')}`;
};

const dlg = $('#letter');
$('#lclose').onclick = () => dlg.close();
$('#lcopy').onclick = async e => {
  await navigator.clipboard.writeText($('#ltext').value);
  e.target.textContent = 'Скопировано ✓';
  setTimeout(() => (e.target.textContent = 'Скопировать'), 1600);
};
const openLetter = (src, url, q) => {
  const text = letterFor(src, url, q);
  $('#ltext').value = text;
  const host = url ? new URL(url).hostname.replace(/^www\./, '') : '';
  $('#lmail').href = `mailto:${host ? 'privacy@' + host : ''}?subject=${encodeURIComponent('Требование об удалении персональных данных')}&body=${encodeURIComponent(text.split('\n').slice(2).join('\n'))}`;
  dlg.showModal();
};

/* ---------- сканирование ---------- */
const rows = $('#rows'), report = $('#report'), go = $('#go'), q = $('#q');
let n = { found: 0, free: 0, unknown: 0 }, t0 = 0, timer = 0, es = null, foundHits = [];

/* Карта в первом экране реагирует на цель, но не имитирует запущенное сканирование. */
const signalBoard = $('.signal-board'), signalState = $('#signal-state span'), signalQuery = $('#signal-query');
const updateSignalBoard = () => {
  const value = q.value.trim();
  signalBoard.classList.toggle('is-armed', Boolean(value));
  signalState.textContent = value
    ? 'цель обнаружена'
    : `${sourceTotal} источников готово`;
  signalQuery.textContent = value
    ? `${value.slice(0, 24)}${value.length > 24 ? '…' : ''}`
    : 'не выбрана';
};
q.addEventListener('input', updateSignalBoard);

// Перезапуск анимации: снять класс, форсировать reflow, вернуть. Иначе второй раз не сыграет.
const setNum = (el, v) => {
  if (el.textContent === String(v)) return;
  el.textContent = v;
  el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
};
const setCounts = () => {
  setNum($('#c-found'), n.found);
  setNum($('#c-free'), n.free);
  setNum($('#c-unknown'), n.unknown);
  $('#ctan').textContent = n.found;
};

const addRow = h => {
  const el = document.createElement('div');
  el.className = 'row' + (h.state === 'found' ? ' is-found' : '');
  const name = h.url ? `<a href="${h.url}" target="_blank" rel="noopener noreferrer">${h.src}</a>` : h.src;
  el.innerHTML = `
    <div><div class="src">${name}</div>${h.detail ? `<div class="det">${h.detail}</div>` : ''}</div>
    <div class="cat">${CAT[h.cat] || ''}</div>
    <div class="stw"><span class="st ${h.state}">${ST[h.state]}</span></div>`;
  if (h.state === 'found' && h.type === 'account') {
    const b = document.createElement('button');
    b.className = 'act'; b.textContent = 'Запрос';
    b.onclick = () => openLetter(h.src, h.url, q.value.trim());
    el.append(b);
  }
  // найденные — наверх: жюри видит следы, а не список «чисто»
  if (h.state === 'found') { foundHits.push(h); rows.prepend(el); } else rows.append(el);
};

const renderCompletion = () => {
  $('#rcta').hidden = n.found === 0;
  $('#report-actions').hidden = false;
  $('#cleanup').hidden = n.found === 0;
  if (!n.found) return;
  const score = Math.min(100, n.found * 13 + n.unknown * 2);
  $('#visibility-label').textContent = score > 65 ? 'открытый профиль' : score > 30 ? 'заметный профиль' : 'тихий профиль';
  $('#visibility-bar').style.width = score + '%';
  $('#cleanup-list').innerHTML = foundHits.slice(0, 3).map((h, i) =>
    `<li><span><b>${i === 0 ? 'Проверь и удали' : 'Подготовь запрос для'} ${h.src}</b>${h.detail ? ` · ${h.detail}` : ''}</span></li>`
  ).join('');
};

$('#filters').onclick = e => {
  if (!e.target.classList.contains('chip')) return;
  $$('.chip').forEach(c => c.classList.toggle('on', c === e.target));
  rows.classList.toggle('onlyfound', e.target.dataset.f === 'found');
};

const stop = () => { es?.close(); es = null; clearInterval(timer); go.disabled = false; go.textContent = 'Проверить ещё раз'; };

$('#scan').onsubmit = e => {
  e.preventDefault();
  const val = q.value.trim();
  if (!val) return;

  es?.close(); clearInterval(timer);
  rows.innerHTML = ''; rows.classList.add('onlyfound');
  $$('.chip').forEach(c => c.classList.toggle('on', c.dataset.f === 'found'));
  n = { found: 0, free: 0, unknown: 0 };
  foundHits = [];
  ['#c-found', '#c-free', '#c-unknown'].forEach(s => ($(s).textContent = '0'));
  $('#ctan').textContent = '0';
  report.hidden = false;
  $('.counts').classList.add('vis');   // плитки выезжают по очереди
  $('#rcta').hidden = true; $('#cleanup').hidden = true; $('#report-actions').hidden = true; $('#rnote').textContent = '';
  $('#note').className = 'note'; $('#note').textContent = 'Идёт сканирование. Запросы уходят на реальные сайты — это занимает несколько секунд.';
  go.disabled = true; go.textContent = 'Сканирую…';
  $('#arc').style.strokeDashoffset = 276.5; $('#pct').textContent = '0%';
  report.scrollIntoView({ behavior: 'smooth', block: 'start' });

  t0 = performance.now();
  timer = setInterval(() => ($('#c-time').textContent = ((performance.now() - t0) / 1000).toFixed(1) + 'с'), 100);

  es = new EventSource('/api/scan?q=' + encodeURIComponent(val));

  es.addEventListener('start', ev => {
    const d = JSON.parse(ev.data);
    $('#rtitle').textContent = `${d.q} · ${{ username: 'никнейм', email: 'email', domain: 'домен' }[d.kind]}`;
  });
  es.addEventListener('hit', ev => { const h = JSON.parse(ev.data); n[h.state]++; setCounts(); addRow(h); });
  es.addEventListener('progress', ev => {
    const d = JSON.parse(ev.data), p = d.done / d.total;
    $('#arc').style.strokeDashoffset = 276.5 * (1 - p);
    $('#pct').textContent = Math.round(p * 100) + '%';
  });
  es.addEventListener('note', ev => ($('#rnote').textContent = JSON.parse(ev.data).msg));
  es.addEventListener('error', ev => {
    const msg = ev.data ? JSON.parse(ev.data).msg : 'Соединение потеряно. Попробуй ещё раз.';
    $('#note').className = 'note err'; $('#note').textContent = msg;
    stop();
  });
  es.addEventListener('done', () => {
    stop();
    $('#c-time').textContent = ((performance.now() - t0) / 1000).toFixed(1) + 'с';
    renderCompletion();
    $('#note').className = 'note';
    $('#note').textContent = n.found
      ? `Найдено ${n.found} следов. Теперь у тебя есть карта и понятная точка старта.`
      : 'В проверенных публичных источниках совпадений не найдено.';
  });
};

$('#export-report').onclick = () => window.print();

const eraseRange = $('#erase-range');
eraseRange.oninput = () => {
  const value = Number(eraseRange.value);
  $('#eraser').style.setProperty('--erase', value + '%');
  $('#erase-label').textContent = value === 0 ? 'потяни, чтобы собрать маршрут' : value < 100 ? `маршрут собран на ${value}%` : 'теперь всё перед глазами';
};

const DEMO_HITS = [
  { type: 'account', src: 'GitHub', cat: 'dev', url: 'https://github.com/demo-user', state: 'found', detail: 'публичные репозитории' },
  { type: 'account', src: 'Telegram', cat: 'soc', url: 'https://t.me/demo_user', state: 'found', detail: 'публичный профиль' },
  { type: 'leak', src: 'Архивный профиль', cat: 'risk', state: 'found', detail: 'старое упоминание' },
  { type: 'account', src: 'Codeforces', cat: 'game', url: 'https://codeforces.com/profile/demo-user', state: 'free' }
];
$('#demo').onclick = () => {
  es?.close(); clearInterval(timer); rows.innerHTML = ''; rows.classList.add('onlyfound'); foundHits = [];
  n = { found: 0, free: 0, unknown: 0 }; setCounts(); report.hidden = false; $('.counts').classList.add('vis');
  $('#rtitle').textContent = 'demo-user · пример отчёта'; $('#rcta').hidden = true; $('#cleanup').hidden = true; $('#report-actions').hidden = true;
  $('#arc').style.strokeDashoffset = 276.5; $('#pct').textContent = '0%'; report.scrollIntoView({ behavior: 'smooth', block: 'start' });
  DEMO_HITS.forEach((h, i) => setTimeout(() => {
    n[h.state]++; setCounts(); addRow(h); const progress = (i + 1) / DEMO_HITS.length;
    $('#arc').style.strokeDashoffset = 276.5 * (1 - progress); $('#pct').textContent = Math.round(progress * 100) + '%';
    if (i === DEMO_HITS.length - 1) { $('#c-time').textContent = '2.1с'; renderCompletion(); $('#rnote').textContent = 'Демо не отправляет запросы во внешние источники.'; }
  }, i * 330));
};
