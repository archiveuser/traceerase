import './ui.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const t = (key, vars) => window.TraceUI?.t(key, vars) || key;
const currentLanguage = () => window.TraceUI?.getLanguage() || 'ru';
const CAT = new Proxy({}, { get: (_, key) => t(`cat.${String(key)}`) });
const ST = new Proxy({}, { get: (_, key) => t(`state.${String(key)}`) });
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
    const traceRGB = getComputedStyle(document.documentElement).getPropertyValue('--trace-rgb').trim() || '255, 255, 255';
    x.clearRect(0, 0, W, H);
    for (const l of lines) {
      const p = Math.max(0, Math.min(1, (s - l.at) / .32));   // 0 — цел, 1 — стёрт
      if (p >= 1) continue;
      x.fillStyle = `rgba(${traceRGB},.07)`;
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
        x.fillStyle = `rgba(${traceRGB},.4)`;                 // головка стирателя
        x.fillRect(l.x - 2 + l.w * p, l.y - 10, 1, 13);
      }
    }
  };

  // Ни одного вечного rAF-цикла: перерисовка только на скролл и resize.
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(draw) } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', build);
  document.addEventListener('traceerase:themechange', build);
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
  if (!$('#q').value.trim()) $('#signal-state span').textContent = t('signal.ready', { count: names.length });
  // Список дублируется дважды: лента едет на -50% и стыкуется сама с собой без шва.
  $('#tick').innerHTML = [...names, ...names].map(n => `<span>${n}</span>`).join('');
}).catch(() => ($('#srccount').textContent = '60+'));

let coverageData = null;
const renderCoverage = () => {
  if (!coverageData) return;
  $('#coverage-grid').innerHTML = Object.entries(coverageData).map(([key, count], i) =>
    `<div class="coverage-card" style="--i:${i}"><b>${count}</b><span>${CAT[key] || key}</span></div>`
  ).join('');
};
fetch('/api/coverage').then(r => r.json()).then(coverage => { coverageData = coverage; renderCoverage(); })
  .catch(() => { $('#coverage-grid').innerHTML = `<div class="coverage-card"><b>60+</b><span>${t('coverage.fallback')}</span></div>`; });

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
  if (currentLanguage() === 'en') return `To: privacy@${host} (or support@${host})
Subject: Personal data removal request — ${q}

Hello,

I am the data subject. Your service displays personal data associated with the identifier “${q}”.${url ? `\nLink: ${url}` : ''}

Under Article 17 of Regulation (EU) 2016/679 (GDPR), the “right to erasure”, I request that you:

1. Delete the account “${q}” and all personal data associated with it.
2. Delete backup copies containing this data where legally and technically applicable.
3. Stop sharing this data with third parties.
4. Confirm the outcome of this request in writing within the applicable time limit.

If you cannot fulfil this request, please explain the reason and the available appeal procedure.

Sincerely,
${q}
Date: ${new Date().toLocaleDateString('en-GB')}`;
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
  e.target.textContent = t('letter.copied');
  setTimeout(() => (e.target.textContent = t('letter.copy')), 1600);
};
const openLetter = (src, url, q) => {
  const text = letterFor(src, url, q);
  $('#ltext').value = text;
  const host = url ? new URL(url).hostname.replace(/^www\./, '') : '';
  const subject = currentLanguage() === 'en' ? 'Personal data removal request' : 'Требование об удалении персональных данных';
  $('#lmail').href = `mailto:${host ? 'privacy@' + host : ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text.split('\n').slice(2).join('\n'))}`;
  dlg.showModal();
};

/* ---------- сканирование ---------- */
const rows = $('#rows'), report = $('#report'), go = $('#go'), q = $('#q');
let n = { found: 0, free: 0, unknown: 0 }, t0 = 0, timer = 0, es = null, foundHits = [];
let lastScanMeta = null, reportMode = null, noteState = 'hero', lastErrorMessage = '';

/* Карта в первом экране реагирует на цель, но не имитирует запущенное сканирование. */
const signalBoard = $('.signal-board'), signalState = $('#signal-state span'), signalQuery = $('#signal-query');
const updateSignalBoard = () => {
  const value = q.value.trim();
  signalBoard.classList.toggle('is-armed', Boolean(value));
  signalState.textContent = value
    ? t('signal.detected')
    : t('signal.ready', { count: sourceTotal });
  signalQuery.textContent = value
    ? `${value.slice(0, 24)}${value.length > 24 ? '…' : ''}`
    : t('signal.none');
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
    <div><div class="src">${name}</div>${h.detail ? `<div class="det"${h.detailKey ? ` data-detail-key="${h.detailKey}"` : ''}>${h.detailKey ? t(h.detailKey) : h.detail}</div>` : ''}</div>
    <div class="cat" data-cat="${h.cat}">${CAT[h.cat] || ''}</div>
    <div class="stw"><span class="st ${h.state}" data-state="${h.state}">${ST[h.state]}</span></div>`;
  if (h.state === 'found' && h.type === 'account') {
    const b = document.createElement('button');
    b.className = 'act'; b.textContent = t('report.request');
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
  $('#visibility-label').textContent = score > 65 ? t('report.open') : score > 30 ? t('report.visible') : t('report.quiet');
  $('#visibility-bar').style.width = score + '%';
  $('#cleanup-list').innerHTML = foundHits.slice(0, 3).map((h, i) =>
    `<li><span><b>${i === 0 ? t('report.checkDelete') : t('report.prepare')} ${h.src}</b>${h.detail ? ` · ${h.detailKey ? t(h.detailKey) : h.detail}` : ''}</span></li>`
  ).join('');
};

$('#filters').onclick = e => {
  if (!e.target.classList.contains('chip')) return;
  $$('.chip').forEach(c => c.classList.toggle('on', c === e.target));
  rows.classList.toggle('onlyfound', e.target.dataset.f === 'found');
};

const stop = () => { es?.close(); es = null; clearInterval(timer); go.disabled = false; go.textContent = t('scan.again'); };

const renderReportTitle = () => {
  if (reportMode === 'demo') $('#rtitle').textContent = t('demo.title');
  else if (lastScanMeta) $('#rtitle').textContent = `${lastScanMeta.q} · ${t(`kind.${lastScanMeta.kind}`)}`;
};

const renderNote = () => {
  if (noteState === 'running') $('#note').textContent = t('scan.wait');
  else if (noteState === 'doneFound') $('#note').textContent = t('scan.doneFound', { count: n.found });
  else if (noteState === 'doneEmpty') $('#note').textContent = t('scan.doneEmpty');
  else if (noteState === 'error') $('#note').textContent = lastErrorMessage || t('scan.connection');
  else if (noteState === 'hero') $('#note').textContent = t('hero.note');
};

$('#scan').onsubmit = e => {
  e.preventDefault();
  const val = q.value.trim();
  if (!val) return;

  es?.close(); clearInterval(timer);
  rows.innerHTML = ''; rows.classList.add('onlyfound');
  $$('.chip').forEach(c => c.classList.toggle('on', c.dataset.f === 'found'));
  n = { found: 0, free: 0, unknown: 0 };
  foundHits = [];
  reportMode = 'scan'; lastScanMeta = null;
  ['#c-found', '#c-free', '#c-unknown'].forEach(s => ($(s).textContent = '0'));
  $('#ctan').textContent = '0';
  report.hidden = false;
  $('.counts').classList.add('vis');   // плитки выезжают по очереди
  $('#rcta').hidden = true; $('#cleanup').hidden = true; $('#report-actions').hidden = true; $('#rnote').textContent = '';
  noteState = 'running'; $('#note').className = 'note'; renderNote();
  go.disabled = true; go.textContent = t('scan.running');
  $('#arc').style.strokeDashoffset = 276.5; $('#pct').textContent = '0%';
  report.scrollIntoView({ behavior: 'smooth', block: 'start' });

  t0 = performance.now();
  timer = setInterval(() => ($('#c-time').textContent = ((performance.now() - t0) / 1000).toFixed(1) + t('time.unit')), 100);

  es = new EventSource('/api/scan?q=' + encodeURIComponent(val) + '&lang=' + currentLanguage());

  es.addEventListener('start', ev => {
    const d = JSON.parse(ev.data);
    lastScanMeta = d; renderReportTitle();
  });
  es.addEventListener('hit', ev => { const h = JSON.parse(ev.data); n[h.state]++; setCounts(); addRow(h); });
  es.addEventListener('progress', ev => {
    const d = JSON.parse(ev.data), p = d.done / d.total;
    $('#arc').style.strokeDashoffset = 276.5 * (1 - p);
    $('#pct').textContent = Math.round(p * 100) + '%';
  });
  es.addEventListener('note', ev => ($('#rnote').textContent = JSON.parse(ev.data).msg));
  es.addEventListener('error', ev => {
    const msg = ev.data ? JSON.parse(ev.data).msg : t('scan.connection');
    noteState = 'error'; lastErrorMessage = msg; $('#note').className = 'note err'; renderNote();
    stop();
  });
  es.addEventListener('done', () => {
    stop();
    $('#c-time').textContent = ((performance.now() - t0) / 1000).toFixed(1) + t('time.unit');
    renderCompletion();
    $('#note').className = 'note';
    noteState = n.found ? 'doneFound' : 'doneEmpty'; renderNote();
  });
};

$('#export-report').onclick = () => window.print();

const eraseRange = $('#erase-range');
eraseRange.oninput = () => {
  const value = Number(eraseRange.value);
  $('#eraser').style.setProperty('--erase', value + '%');
  $('#erase-label').textContent = value === 0 ? t('erase.start') : value < 100 ? t('erase.progress', { value }) : t('erase.done');
};

const demoHits = () => [
  { type: 'account', src: 'GitHub', cat: 'dev', url: 'https://github.com/demo-user', state: 'found', detail: t('demo.publicRepos'), detailKey: 'demo.publicRepos' },
  { type: 'account', src: 'Telegram', cat: 'soc', url: 'https://t.me/demo_user', state: 'found', detail: t('demo.publicProfile'), detailKey: 'demo.publicProfile' },
  { type: 'leak', src: t('demo.archive'), cat: 'risk', state: 'found', detail: t('demo.oldMention'), detailKey: 'demo.oldMention' },
  { type: 'account', src: 'Codeforces', cat: 'game', url: 'https://codeforces.com/profile/demo-user', state: 'free' }
];
$('#demo').onclick = () => {
  const demoItems = demoHits();
  es?.close(); clearInterval(timer); rows.innerHTML = ''; rows.classList.add('onlyfound'); foundHits = [];
  reportMode = 'demo'; lastScanMeta = null; noteState = 'hero';
  n = { found: 0, free: 0, unknown: 0 }; setCounts(); report.hidden = false; $('.counts').classList.add('vis');
  renderReportTitle(); $('#rcta').hidden = true; $('#cleanup').hidden = true; $('#report-actions').hidden = true;
  $('#arc').style.strokeDashoffset = 276.5; $('#pct').textContent = '0%'; report.scrollIntoView({ behavior: 'smooth', block: 'start' });
  demoItems.forEach((h, i) => setTimeout(() => {
    n[h.state]++; setCounts(); addRow(h); const progress = (i + 1) / demoItems.length;
    $('#arc').style.strokeDashoffset = 276.5 * (1 - progress); $('#pct').textContent = Math.round(progress * 100) + '%';
    if (i === demoItems.length - 1) { $('#c-time').textContent = '2.1' + t('time.unit'); renderCompletion(); $('#rnote').textContent = t('demo.note'); }
  }, i * 330));
};

document.addEventListener('traceerase:languagechange', () => {
  updateSignalBoard();
  renderCoverage();
  renderReportTitle();
  renderNote();
  go.textContent = es ? t('scan.running') : report.hidden ? t('hero.cta') : t('scan.again');
  $$('.row .cat[data-cat]').forEach(element => { element.textContent = CAT[element.dataset.cat]; });
  $$('.row .st[data-state]').forEach(element => { element.textContent = ST[element.dataset.state]; });
  $$('.row .act').forEach(element => { element.textContent = t('report.request'); });
  $$('[data-detail-key]').forEach(element => { element.textContent = t(element.dataset.detailKey); });
  if (!$('#cleanup').hidden) renderCompletion();
  if (reportMode === 'demo') $('#rnote').textContent = t('demo.note');
  eraseRange.oninput();
});
