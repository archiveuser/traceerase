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
let sourceTotal = '200+';
let sourceStats = { total: 0, automatic: 0, manual: 0 };
fetch('/api/sites').then(r => r.json()).then(data => {
  const names = Array.isArray(data) ? data : data.names;
  sourceStats = Array.isArray(data)
    ? { total: names.length, automatic: names.length, manual: 0 }
    : { total: data.total, automatic: data.automatic, manual: data.manual };
  sourceTotal = sourceStats.total;
  $('#srccount').textContent = sourceStats.total;
  if (!$('#q').value.trim()) $('#signal-state span').textContent = t('redaction.ready');
  // Вся база остаётся в каталоге; в декоративной ленте — компактная репрезентативная выборка.
  // Она дублируется дважды: лента едет на -50% и стыкуется сама с собой без шва.
  const featured = ['VK', 'MAX', 'Telegram', 'Odnoklassniki', 'Instagram', 'TikTok', 'YouTube', 'X', 'GitHub', 'GitLab', 'Habr', 'LinkedIn', 'HeadHunter', 'Avito', 'Twitch', 'Behance'];
  const tickerNames = [...featured, ...names.filter(name => !featured.includes(name))].slice(0, 48);
  $('#tick').innerHTML = [...tickerNames, ...tickerNames].map(name => `<span>${name}</span>`).join('');
}).catch(() => ($('#srccount').textContent = '200+'));

let coverageData = null;
const renderCoverage = () => {
  if (!coverageData) return;
  $('#coverage-grid').innerHTML = Object.entries(coverageData).map(([key, value], i) => {
    const count = typeof value === 'number' ? value : value.total;
    const automatic = typeof value === 'number' ? value : value.automatic;
    return `<div class="coverage-card" style="--i:${i}"><b>${count}</b><span>${CAT[key] || key}</span><small>${t('coverage.autoCount', { count: automatic })}</small></div>`;
  }
  ).join('');
};
fetch('/api/coverage').then(r => r.json()).then(coverage => { coverageData = coverage; renderCoverage(); })
  .catch(() => { $('#coverage-grid').innerHTML = `<div class="coverage-card"><b>200+</b><span>${t('coverage.fallback')}</span></div>`; });

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
let n = { found: 0, free: 0, unknown: 0 }, t0 = 0, timer = 0, es = null, foundHits = [], allHits = [];
let lastScanMeta = null, reportMode = null, noteState = 'hero', lastErrorMessage = '';
let selectedIntent = 'general', activeIntent = 'general', activeQuery = '', insightsReady = false;
let completedTasks = new Set(), demoTimers = [], runId = 0;
let scanStartedAt = null, scanFinishedAt = null;

const INTENT_PRIORITY = {
  general: ['soc', 'risk', 'dev', 'work', 'blog', 'media', 'game', 'link', 'infra'],
  career: ['work', 'dev', 'blog', 'media', 'soc', 'link', 'game', 'risk', 'infra'],
  public: ['media', 'blog', 'soc', 'link', 'work', 'dev', 'game', 'risk', 'infra'],
  reset: ['soc', 'blog', 'media', 'game', 'risk', 'dev', 'work', 'link', 'infra']
};

const safeHttpUrl = value => {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
};
const sourceText = hit => hit.srcKey ? t(hit.srcKey) : String(hit.src || '');
const detailText = hit => hit.detailKey ? t(hit.detailKey) : String(hit.detail || '');
const maskTarget = (value, kind = '') => {
  const text = String(value || '').trim();
  if (!text) return '—';
  if (kind === 'email' || text.includes('@')) {
    const [name, domain] = text.split('@');
    return `${name.slice(0, Math.min(2, name.length)) || '*'}***@${domain || '***'}`;
  }
  if (kind === 'domain') {
    try { return new URL(text.includes('://') ? text : `https://${text}`).hostname.replace(/^www\./, ''); } catch {}
  }
  if (text.length <= 3) return text[0] + '**';
  return `${text.slice(0, 2)}***${text.slice(-1)}`;
};

const syncIntentControl = () => {
  $$('input[name="intent"]').forEach(input => {
    input.checked = input.value === selectedIntent;
    input.closest('.intent-option')?.classList.toggle('is-active', input.checked);
  });
  $('#intent-state').textContent = t(`intent.${selectedIntent}Context`);
};
const setIntent = intent => {
  if (!INTENT_PRIORITY[intent]) return;
  selectedIntent = intent;
  syncIntentControl();
};
$('#scan-purpose').addEventListener('change', event => {
  if (event.target.matches('input[name="intent"]')) setIntent(event.target.value);
});
$$('.moment-card[data-intent]').forEach(card => card.addEventListener('click', () => {
  setIntent(card.dataset.intent);
  setTimeout(() => q.focus({ preventScroll: true }), 350);
}));
syncIntentControl();

/* Интерактивное досье в первом экране — образ публичного следа, не результат сканирования. */
const signalBoard = $('.signal-board'), signalState = $('#signal-state span'), signalQuery = $('#signal-query');
const redactionCount = $('#redaction-count'), traceFragments = $$('.trace-fragment');
let redactedFragments = 0;
const renderRedaction = () => {
  redactionCount.textContent = t('redaction.count', { count: redactedFragments, total: traceFragments.length });
  if (redactedFragments === traceFragments.length) signalState.textContent = t('redaction.done');
  else signalState.textContent = q.value.trim() ? t('redaction.armed') : t('redaction.ready');
};
traceFragments.forEach(fragment => fragment.addEventListener('click', () => {
  if (fragment.classList.contains('is-redacted')) return;
  fragment.classList.add('is-redacted');
  redactedFragments++;
  renderRedaction();
}));
const updateSignalBoard = () => {
  const value = q.value.trim();
  signalBoard.classList.toggle('is-armed', Boolean(value));
  signalQuery.textContent = value
    ? `${value.slice(0, 24)}${value.length > 24 ? '…' : ''}`
    : t('signal.none');
  renderRedaction();
};
q.addEventListener('input', updateSignalBoard);
document.addEventListener('traceerase:languagechange', renderRedaction);
renderRedaction();

// Перезапуск анимации: снять класс, форсировать reflow, вернуть. Иначе второй раз не сыграет.
const setNum = (el, v) => {
  if (el.textContent === String(v)) return;
  el.textContent = v;
  el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
};
const countForm = count => {
  if (currentLanguage() === 'en') return count === 1 ? 'one' : 'many';
  const mod10 = count % 10, mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
  return 'many';
};
const renderCtaTail = () => { $('#rcta-tail').textContent = t(`report.nextTitle.${countForm(n.found)}`); };
const setCounts = () => {
  setNum($('#c-found'), n.found);
  setNum($('#c-free'), n.free);
  setNum($('#c-unknown'), n.unknown);
  $('#ctan').textContent = n.found;
  renderCtaTail();
};

/* ---------- карта следа: центр → тематическая зона → подтверждённый профиль ---------- */
const SVG_NS = 'http://www.w3.org/2000/svg';
const graphBox = $('#trace-graph'), graphLinks = $('#graph-links'), graphNodes = $('#graph-nodes');
const GRAPH_ROOT = { x: 480, y: 210 };
const GRAPH_ZONES = {
  soc: { x: 250, y: 104 }, dev: { x: 696, y: 96 }, game: { x: 716, y: 314 },
  blog: { x: 262, y: 326 }, media: { x: 820, y: 206 }, work: { x: 480, y: 360 },
  link: { x: 480, y: 58 }, message: { x: 128, y: 210 }, creator: { x: 126, y: 330 },
  market: { x: 810, y: 82 }, learn: { x: 604, y: 370 }
};
let graphState = { target: '', nodes: [], groups: new Map(), finished: false };
const svgNode = name => document.createElementNS(SVG_NS, name);
const graphLabel = value => {
  const text = String(value || '—');
  return text.length > 20 ? `${text.slice(0, 19)}…` : text;
};
const graphLabelPosition = point => {
  if (point.x < 270) return { x: point.x + 15, anchor: 'start' };
  if (point.x > 690) return { x: point.x - 15, anchor: 'end' };
  return { x: point.x, anchor: 'middle' };
};
const graphZonePoint = key => GRAPH_ZONES[key] || {
  x: 480 + Math.cos(graphState.groups.size * 2.4) * 292,
  y: 210 + Math.sin(graphState.groups.size * 2.4) * 142
};
const graphMemberPoint = (zone, index) => {
  const angle = -1.68 + index * 1.91;
  const radius = 54 + Math.floor(index / 4) * 18;
  return { x: zone.x + Math.cos(angle) * radius, y: zone.y + Math.sin(angle) * radius * .72 };
};
const graphText = (group, text, x, y, className, anchor = 'middle') => {
  const el = svgNode('text');
  el.classList.add(className); el.setAttribute('x', x); el.setAttribute('y', y); el.setAttribute('text-anchor', anchor);
  el.textContent = text; group.append(el); return el;
};
const graphLine = (from, to, type, delay = 0) => {
  const edge = svgNode('line'); edge.classList.add('trace-edge', type);
  edge.setAttribute('x1', from.x); edge.setAttribute('y1', from.y); edge.setAttribute('x2', to.x); edge.setAttribute('y2', to.y);
  edge.style.animationDelay = `${delay}ms`; graphLinks.append(edge); return edge;
};
const graphCount = () => { $('#graph-count').textContent = `${graphState.nodes.length} · ${t('graph.count')}`; };
const graphRoot = target => {
  graphBox.hidden = false; graphLinks.replaceChildren(); graphNodes.replaceChildren();
  graphState = { target, nodes: [], groups: new Map(), finished: false };
  const node = svgNode('g'); node.classList.add('trace-node', 'trace-node-root');
  const square = svgNode('rect'); square.classList.add('trace-node-dot'); square.setAttribute('x', GRAPH_ROOT.x - 8); square.setAttribute('y', GRAPH_ROOT.y - 8); square.setAttribute('width', 16); square.setAttribute('height', 16);
  const title = svgNode('title'); title.textContent = t('graph.rootTitle', { target });
  node.append(title, square);
  graphText(node, graphLabel(target), GRAPH_ROOT.x, GRAPH_ROOT.y + 32, 'trace-node-label');
  graphText(node, t('graph.root'), GRAPH_ROOT.x, GRAPH_ROOT.y + 48, 'trace-node-sub');
  graphNodes.append(node); graphCount();
  $('#graph-note').textContent = t('graph.waiting');
};
const graphGroup = key => {
  const existing = graphState.groups.get(key);
  if (existing) return existing;
  const point = graphZonePoint(key);
  graphLine(GRAPH_ROOT, point, 'is-zone');
  const node = svgNode('g'); node.classList.add('trace-group');
  const diamond = svgNode('rect'); diamond.classList.add('trace-group-dot'); diamond.setAttribute('x', point.x - 6); diamond.setAttribute('y', point.y - 6); diamond.setAttribute('width', 12); diamond.setAttribute('height', 12); diamond.setAttribute('transform', `rotate(45 ${point.x} ${point.y})`);
  const title = svgNode('title'); title.textContent = CAT[key] || t('graph.profile');
  const label = graphLabelPosition(point);
  node.append(title, diamond);
  graphText(node, CAT[key] || t('graph.profile'), label.x, point.y - 16, 'trace-group-label', label.anchor);
  const count = graphText(node, t('graph.zoneCount', { count: 0 }), label.x, point.y + 24, 'trace-node-sub', label.anchor);
  graphNodes.append(node);
  const group = { key, point, hits: [], count };
  graphState.groups.set(key, group); return group;
};
const graphAdd = hit => {
  if (hit.state !== 'found' || hit.type !== 'account' || !graphState.target) return;
  const url = safeHttpUrl(hit.url);
  const key = `${sourceText(hit)}|${url}`;
  if (graphState.nodes.some(node => node.key === key)) return;
  const group = graphGroup(hit.cat || 'link');
  const point = graphMemberPoint(group.point, group.hits.length);
  graphLine(group.point, point, 'is-account', 130);

  const node = svgNode('g'); node.classList.add('trace-node'); node.style.animationDelay = '130ms'; if (url) node.classList.add('is-link');
  const title = svgNode('title'); title.textContent = `${sourceText(hit)} — ${t('graph.profile')}`;
  const dot = svgNode('circle'); dot.classList.add('trace-node-dot'); dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y); dot.setAttribute('r', 6.5);
  const label = graphLabelPosition(point);
  node.append(title, dot);
  graphText(node, graphLabel(sourceText(hit)), label.x, point.y - 13, 'trace-node-label', label.anchor);
  graphText(node, t('graph.profile'), label.x, point.y + 22, 'trace-node-sub', label.anchor);
  if (url) {
    const wrapper = svgNode('a');
    wrapper.setAttribute('href', url); wrapper.setAttribute('target', '_blank'); wrapper.setAttribute('rel', 'noopener noreferrer');
    wrapper.append(node); graphNodes.append(wrapper);
  } else graphNodes.append(node);
  group.hits.push(hit); group.count.textContent = t('graph.zoneCount', { count: group.hits.length });
  graphState.nodes.push({ key, hit }); graphCount();
  $('#graph-note').textContent = t('graph.found', { count: graphState.nodes.length });
};
const graphFinish = () => {
  if (!graphState.target) return;
  graphState.finished = true;
  if (!graphState.nodes.length) $('#graph-note').textContent = t('graph.empty');
};
const resetGraph = () => {
  graphState = { target: '', nodes: [], groups: new Map(), finished: false };
  graphLinks.replaceChildren(); graphNodes.replaceChildren(); graphBox.hidden = true;
};
const refreshGraph = () => {
  if (!graphState.target) return;
  const previous = graphState.nodes.map(node => node.hit);
  const finished = graphState.finished;
  graphRoot(graphState.target); previous.forEach(graphAdd);
  if (finished) graphFinish();
};

const addRow = h => {
  const normalized = { ...h, url: safeHttpUrl(h.url), checkedAt: h.checkedAt || new Date().toISOString() };
  allHits.push(normalized);
  const el = document.createElement('div');
  el.className = 'row' + (h.state === 'found' ? ' is-found' : '');
  el.dataset.state = h.state;
  const info = document.createElement('div');
  const src = document.createElement('div');
  src.className = 'src';
  const url = normalized.url;
  const source = sourceText(h);
  const sourceNode = url ? document.createElement('a') : document.createElement('span');
  sourceNode.textContent = source;
  if (h.srcKey) sourceNode.dataset.srcKey = h.srcKey;
  if (url) { sourceNode.href = url; sourceNode.target = '_blank'; sourceNode.rel = 'noopener noreferrer'; }
  src.append(sourceNode); info.append(src);
  if (h.detail || h.detailKey) {
    const detail = document.createElement('div');
    detail.className = 'det'; detail.textContent = detailText(h);
    if (h.detailKey) detail.dataset.detailKey = h.detailKey;
    info.append(detail);
  }
  const category = document.createElement('div');
  category.className = 'cat'; category.dataset.cat = h.cat; category.textContent = CAT[h.cat] || '';
  const stateWrap = document.createElement('div'); stateWrap.className = 'stw';
  const state = document.createElement('span');
  state.className = `st ${h.state}`; state.dataset.state = h.state; state.textContent = ST[h.state];
  stateWrap.append(state); el.append(info, category, stateWrap);
  if (h.state === 'found' && h.type === 'account') {
    const b = document.createElement('button');
    b.className = 'act'; b.textContent = t('report.request');
    b.onclick = () => openLetter(sourceText(h), url, activeQuery);
    el.append(b);
  }
  // найденные — наверх: жюри видит следы, а не список «чисто»
  if (h.state === 'found') { foundHits.push(normalized); rows.prepend(el); } else rows.append(el);
  graphAdd(normalized);
};

const rankedFoundHits = () => {
  const priority = INTENT_PRIORITY[activeIntent] || INTENT_PRIORITY.general;
  return [...foundHits].sort((a, b) => {
    const categoryDelta = (priority.indexOf(a.cat) < 0 ? 99 : priority.indexOf(a.cat)) - (priority.indexOf(b.cat) < 0 ? 99 : priority.indexOf(b.cat));
    return categoryDelta || sourceText(a).localeCompare(sourceText(b), currentLanguage());
  });
};

const deriveReportModel = () => {
  const accountHits = foundHits.filter(hit => hit.type === 'account');
  const accountResults = allHits.filter(hit => hit.type === 'account');
  const conclusive = accountResults.filter(hit => hit.state === 'found' || hit.state === 'free').length;
  const unknownAccounts = accountResults.filter(hit => hit.state === 'unknown').length;
  const insufficient = reportMode === 'scan' && conclusive === 0;
  const categories = [...new Set(accountHits.map(hit => hit.cat).filter(Boolean))];
  const volume = Math.min(accountHits.length, 6) / 6 * 60;
  const breadth = Math.min(categories.length, 4) / 4 * 40;
  const score = insufficient ? null : Math.round(volume + breadth);
  const grade = insufficient ? 'insufficient' : score >= 70 ? 'open' : score >= 35 ? 'visible' : 'quiet';
  return {
    intent: activeIntent,
    target: activeQuery,
    maskedTarget: maskTarget(activeQuery, reportMode === 'demo' ? 'username' : lastScanMeta?.kind),
    score, grade, categories, conclusive, unknownAccounts, insufficient,
    attempts: Number(lastScanMeta?.total || allHits.length),
    checked: Number(lastScanMeta?.total || allHits.length),
    matches: accountHits.length,
    found: n.found, unknown: n.unknown,
    hits: rankedFoundHits(), accountHits
  };
};

const renderDossier = model => {
  const panel = $('#stranger-view');
  panel.hidden = false;
  const viewer = t(`stranger.role.${model.intent}`);
  $('#dossier-mode').textContent = `VIEW / ${t(`intent.${model.intent}`).toUpperCase()}`;
  $('#dossier-lens').textContent = viewer;
  const scoreText = model.insufficient ? '—' : String(model.score);
  $('#stranger-score').textContent = scoreText;
  $('.dossier-score i').hidden = model.insufficient;
  $('#stranger-grade').textContent = t(`report.${model.grade}`);
  $('.dossier-score').setAttribute('aria-label', model.insufficient
    ? t('stranger.scoreAriaUnavailable')
    : t('stranger.scoreAriaValue', { score: model.score, grade: t(`report.${model.grade}`) }));
  $('#dossier-score-note').textContent = t(model.insufficient ? 'stranger.scoreNoteInsufficient' : 'stranger.scoreNote');
  $('#dossier-target').textContent = model.maskedTarget;
  $('#dossier-found').textContent = `${model.matches} · ${model.attempts}`;
  $('#dossier-categories').textContent = model.categories.length;

  const topHit = model.hits.find(hit => hit.type === 'account') || model.hits[0];
  const topSource = topHit ? sourceText(topHit) : '';
  const summaryKey = model.insufficient ? 'insufficient' : !model.matches ? 'empty' : model.score >= 70 ? 'high' : model.score >= 35 ? 'medium' : 'quiet';
  $('#dossier-summary').textContent = t(`stranger.summary.${summaryKey}`, {
    viewer, count: model.insufficient ? (model.unknownAccounts || model.attempts) : model.matches, source: topSource
  });

  const sourceList = $('#dossier-sources');
  sourceList.replaceChildren();
  const sources = [...new Set(model.hits.map(sourceText))].slice(0, 5);
  (sources.length ? sources : [t(model.insufficient ? 'stranger.noConclusion' : 'stranger.noMatches')]).forEach(name => {
    const chip = document.createElement('span'); chip.textContent = name; sourceList.append(chip);
  });
};

const cleanupTasks = model => {
  const tasks = model.hits.slice(0, 3).map((hit, index) => ({
    id: `hit-${String(sourceText(hit) + safeHttpUrl(hit.url)).toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').slice(0, 96)}`,
    title: t(index === 0 ? 'cleanup.firstTitle' : 'cleanup.hitTitle', { source: sourceText(hit) }),
    detail: t(`cleanup.reason.${model.intent}`, { category: CAT[hit.cat] || hit.cat }),
    url: safeHttpUrl(hit.url)
  }));
  const universal = [
    { id: 'intent', title: t(`cleanup.intent.${model.intent}Title`), detail: t(`cleanup.intent.${model.intent}Text`) },
    { id: 'privacy', title: t('cleanup.privacyTitle'), detail: t('cleanup.privacyText') },
    { id: 'decide', title: t('cleanup.decideTitle'), detail: t('cleanup.decideText') },
    { id: 'aliases', title: t('cleanup.aliasesTitle'), detail: t('cleanup.aliasesText') }
  ];
  for (const task of universal) if (tasks.length < 4) tasks.push(task);
  tasks.push({ id: 'rescan', title: t('cleanup.rescanTitle'), detail: t('cleanup.rescanText') });
  return tasks.slice(0, 5);
};

let visibleTasks = [];
const renderCleanupProgress = () => {
  const done = visibleTasks.filter(task => completedTasks.has(task.id)).length;
  const total = visibleTasks.length;
  $('#cleanup-progress').textContent = `${done}/${total}`;
  $('#cleanup-progress-bar').style.width = (total ? done / total * 100 : 0) + '%';
};
const renderChecklist = model => {
  visibleTasks = cleanupTasks(model);
  const list = $('#cleanup-list'); list.replaceChildren();
  visibleTasks.forEach((task, index) => {
    const item = document.createElement('li'); item.className = 'cleanup-task';
    item.classList.toggle('is-done', completedTasks.has(task.id)); item.dataset.taskId = task.id;
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = completedTasks.has(task.id);
    input.dataset.taskId = task.id;
    const check = document.createElement('span'); check.className = 'cleanup-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('span'); copy.className = 'cleanup-copy';
    const title = document.createElement('b'); title.textContent = `${String(index + 1).padStart(2, '0')} · ${task.title}`;
    const detail = document.createElement('small'); detail.textContent = task.detail;
    copy.append(title, detail); label.append(input, check, copy); item.append(label);
    if (task.url) {
      const link = document.createElement('a'); link.className = 'task-link'; link.href = task.url;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = '↗';
      link.setAttribute('aria-label', t('cleanup.open', { source: task.title })); item.append(link);
    }
    list.append(item);
  });
  renderCleanupProgress();
};

const renderManualReview = () => {
  const panel = $('#manual-review');
  const catalog = lastScanMeta?.catalog?.total ? lastScanMeta.catalog : sourceStats;
  const count = Number(catalog.manual || 0);
  const links = Array.isArray(lastScanMeta?.manual) ? lastScanMeta.manual : [];
  panel.hidden = !count || lastScanMeta?.kind === 'domain';
  if (panel.hidden) return;
  $('#manual-count').textContent = count;
  const wrap = $('#manual-links'); wrap.replaceChildren();
  links.forEach(item => {
    const href = safeHttpUrl(item.url);
    if (!href) return;
    const link = document.createElement('a');
    link.className = 'manual-chip'; link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = `${item.n} ↗`;
    link.setAttribute('aria-label', t('manual.open', { source: item.n }));
    wrap.append(link);
  });
};

$('#cleanup-list').addEventListener('change', event => {
  const input = event.target.closest('input[data-task-id]');
  if (!input) return;
  if (input.checked) completedTasks.add(input.dataset.taskId); else completedTasks.delete(input.dataset.taskId);
  input.closest('.cleanup-task')?.classList.toggle('is-done', input.checked);
  renderCleanupProgress();
});

const renderCompletion = () => {
  insightsReady = true;
  const model = deriveReportModel();
  graphFinish();
  $('#rcta').hidden = model.found === 0;
  $('#report-actions').hidden = false;
  $('#cleanup').hidden = model.found === 0;
  renderDossier(model);
  renderManualReview();
  $('#visibility-label').textContent = model.insufficient
    ? t('report.insufficient')
    : `${model.score}/100 · ${t(`report.${model.grade}`)}`;
  $('#visibility-bar').style.width = (model.score ?? 0) + '%';
  if (!model.found) { visibleTasks = []; return model; }
  renderChecklist(model);
  return model;
};

$('#filters').onclick = e => {
  if (!e.target.classList.contains('chip')) return;
  $$('.chip').forEach(c => c.classList.toggle('on', c === e.target));
  rows.classList.toggle('onlyfound', e.target.dataset.f === 'found');
};

const cancelActiveRun = () => {
  runId++;
  es?.close(); es = null; clearInterval(timer);
  demoTimers.forEach(clearTimeout); demoTimers = [];
  go.disabled = false;
};
const stop = currentRun => {
  if (currentRun !== runId) return;
  es?.close(); es = null; clearInterval(timer);
  go.disabled = false; go.textContent = t('scan.again');
};
const resetReport = () => {
  rows.replaceChildren(); rows.classList.add('onlyfound'); rows.dataset.empty = t('report.waiting');
  $$('.chip').forEach(chip => chip.classList.toggle('on', chip.dataset.f === 'found'));
  n = { found: 0, free: 0, unknown: 0 }; foundHits = []; allHits = []; completedTasks.clear(); visibleTasks = [];
  scanStartedAt = null; scanFinishedAt = null;
  resetGraph();
  insightsReady = false;
  ['#c-found', '#c-free', '#c-unknown'].forEach(selector => ($(selector).textContent = '0'));
  $('#c-time').textContent = '0.0'; $('#ctan').textContent = '0';
  report.hidden = false; $('.counts').classList.add('vis');
  $('#rcta').hidden = true; $('#cleanup').hidden = true; $('#stranger-view').hidden = true; $('#report-actions').hidden = true; $('#manual-review').hidden = true;
  $('#manual-links').replaceChildren(); $('#print-meta').replaceChildren();
  $('#rnote').textContent = ''; $('#cleanup-list').replaceChildren();
  $('#cleanup-progress').textContent = '0/0'; $('#cleanup-progress-bar').style.width = '0%';
  $('#arc').style.strokeDashoffset = 276.5; $('#pct').textContent = '0%';
};

const renderReportTitle = () => {
  if (reportMode === 'demo') $('#rtitle').textContent = t('demo.title');
  else if (lastScanMeta) $('#rtitle').textContent = `${lastScanMeta.q} · ${t(`kind.${lastScanMeta.kind}`)}`;
};

const renderNote = () => {
  if (noteState === 'running') $('#note').textContent = t('scan.wait');
  else if (noteState === 'doneFound') $('#note').textContent = t(`scan.doneFound.${countForm(n.found)}`, { count: n.found });
  else if (noteState === 'doneEmpty') $('#note').textContent = t('scan.doneEmpty');
  else if (noteState === 'doneUnknown') $('#note').textContent = t('scan.doneUnknown');
  else if (noteState === 'error') $('#note').textContent = lastErrorMessage || t('scan.connection');
  else if (noteState === 'hero') $('#note').textContent = t('hero.note');
};

$('#scan').onsubmit = e => {
  e.preventDefault();
  const val = q.value.trim();
  if (!val) return;

  cancelActiveRun(); const currentRun = runId; let finished = false;
  activeIntent = selectedIntent; activeQuery = val;
  reportMode = 'scan'; lastScanMeta = null; resetReport();
  scanStartedAt = new Date();
  noteState = 'running'; $('#note').className = 'note'; renderNote();
  go.disabled = true; go.textContent = t('scan.running');
  report.scrollIntoView({ behavior: 'smooth', block: 'start' });

  t0 = performance.now();
  timer = setInterval(() => ($('#c-time').textContent = ((performance.now() - t0) / 1000).toFixed(1) + t('time.unit')), 100);

  es = new EventSource('/api/scan?q=' + encodeURIComponent(val) + '&lang=' + currentLanguage());

  es.addEventListener('start', ev => {
    if (currentRun !== runId) return;
    const d = JSON.parse(ev.data);
    lastScanMeta = d; graphRoot(activeQuery); renderReportTitle();
  });
  es.addEventListener('hit', ev => {
    if (currentRun !== runId) return;
    const h = JSON.parse(ev.data); n[h.state]++; setCounts(); addRow(h);
  });
  es.addEventListener('progress', ev => {
    if (currentRun !== runId) return;
    const d = JSON.parse(ev.data), p = d.done / d.total;
    $('#arc').style.strokeDashoffset = 276.5 * (1 - p);
    $('#pct').textContent = Math.round(p * 100) + '%';
  });
  es.addEventListener('note', ev => { if (currentRun === runId) $('#rnote').textContent = JSON.parse(ev.data).msg; });
  es.addEventListener('error', ev => {
    if (currentRun !== runId || finished) return;
    const msg = ev.data ? JSON.parse(ev.data).msg : t('scan.connection');
    noteState = 'error'; lastErrorMessage = msg; $('#note').className = 'note err'; renderNote();
    stop(currentRun);
  });
  es.addEventListener('done', () => {
    if (currentRun !== runId) return;
    finished = true; scanFinishedAt = new Date(); stop(currentRun);
    $('#c-time').textContent = ((performance.now() - t0) / 1000).toFixed(1) + t('time.unit');
    const model = renderCompletion();
    $('#note').className = 'note';
    noteState = model.insufficient ? 'doneUnknown' : n.found ? 'doneFound' : 'doneEmpty'; renderNote();
  });
};

const oneLine = value => String(value || '').replace(/\s+/g, ' ').trim();
const localTimestamp = value => value ? new Intl.DateTimeFormat(currentLanguage() === 'en' ? 'en-GB' : 'ru-RU', {
  dateStyle: 'medium', timeStyle: 'long'
}).format(value) : '—';
const fileStamp = (date = new Date()) => {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
};
const buildExportSnapshot = () => {
  const model = deriveReportModel();
  const order = { found: 0, unknown: 1, free: 2 };
  const results = allHits.map(hit => ({
    source: sourceText(hit), category: CAT[hit.cat] || hit.cat || '—', state: hit.state,
    detail: oneLine(detailText(hit)), url: safeHttpUrl(hit.url), method: hit.method || '—',
    reason: hit.reason || '—', checkedAt: hit.checkedAt || null
  })).sort((a, b) => (order[a.state] ?? 9) - (order[b.state] ?? 9) || a.source.localeCompare(b.source, currentLanguage()));
  return {
    generatedAt: new Date(), startedAt: scanStartedAt, finishedAt: scanFinishedAt,
    mode: reportMode, language: currentLanguage(), intent: activeIntent,
    kind: lastScanMeta?.kind || 'username', target: activeQuery, maskedTarget: model.maskedTarget,
    attempts: model.attempts, emitted: results.length, matches: model.matches, conclusive: model.conclusive,
    counts: { ...n }, score: model.score, grade: model.grade, insufficient: model.insufficient,
    categories: model.categories, checklist: {
      done: visibleTasks.filter(task => completedTasks.has(task.id)).length,
      total: visibleTasks.length
    },
    catalog: lastScanMeta?.catalog?.total ? lastScanMeta.catalog : sourceStats,
    results
  };
};
const methodLabel = method => t(`export.method.${method}`) === `export.method.${method}` ? method : t(`export.method.${method}`);
const buildTxt = snapshot => {
  const duration = snapshot.startedAt && snapshot.finishedAt
    ? `${((snapshot.finishedAt - snapshot.startedAt) / 1000).toFixed(1)} ${t('time.unit')}` : '—';
  const visibility = snapshot.insufficient
    ? t('report.insufficient')
    : `${snapshot.score}/100 · ${t(`report.${snapshot.grade}`)}`;
  const lines = [
    `TRACEERASE — ${t('export.personalTitle')}`,
    '='.repeat(64),
    `${t('export.generated')}: ${localTimestamp(snapshot.generatedAt)}`,
    `${t('export.mode')}: ${t(`export.mode.${snapshot.mode}`)}`,
    `${t('export.target')}: ${snapshot.target || '—'}`,
    `${t('export.kind')}: ${t(`kind.${snapshot.kind}`)}`,
    `${t('export.intent')}: ${t(`intent.${snapshot.intent}`)}`,
    `${t('export.duration')}: ${duration}`,
    '',
    `${t('export.catalog')}: ${snapshot.catalog?.total || '—'} (${t('export.automatic')}: ${snapshot.catalog?.automatic || 0}; ${t('export.manual')}: ${snapshot.catalog?.manual || 0})`,
    `${t('export.attempts')}: ${snapshot.attempts}`,
    `${t('export.responses')}: ${snapshot.emitted}`,
    `${t('export.profileMatches')}: ${snapshot.matches}`,
    `${t('export.conclusive')}: ${snapshot.conclusive}`,
    `${t('report.found')}: ${snapshot.counts.found}`,
    `${t('report.clean')}: ${snapshot.counts.free}`,
    `${t('report.unknown')}: ${snapshot.counts.unknown}`,
    `${t('export.visibility')}: ${visibility}`,
    `${t('cleanup.progress')}: ${snapshot.checklist.done}/${snapshot.checklist.total}`,
    '',
    t('export.disclaimerMatch'),
    t('export.disclaimerMissing'),
    t('export.disclaimerScore'),
    t('export.disclaimerIncomplete'),
    '',
    t('export.resultsTitle').toUpperCase(),
    '-'.repeat(64)
  ];
  if (!snapshot.results.length) lines.push(t('export.noResults'));
  snapshot.results.forEach((result, index) => {
    lines.push(
      `${String(index + 1).padStart(3, '0')}. ${result.source}`,
      `   ${t('export.category')}: ${result.category}`,
      `   ${t('export.status')}: ${t(`export.state.${result.state}`)}`,
      `   ${t('export.method')}: ${methodLabel(result.method)} (${result.reason})`
    );
    if (result.checkedAt) lines.push(`   ${t('export.checkedAt')}: ${localTimestamp(new Date(result.checkedAt))}`);
    if (result.detail) lines.push(`   ${t('export.detail')}: ${result.detail}`);
    if (result.url) lines.push(`   URL: ${result.url}`);
    lines.push('');
  });
  return lines.join('\r\n');
};
const downloadBlob = (blob, filename) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = href; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};
$('#download-txt').onclick = () => {
  if (!insightsReady) return;
  const txt = buildTxt(buildExportSnapshot());
  downloadBlob(new Blob(['\uFEFF', txt], { type: 'text/plain;charset=utf-8' }), `traceerase-report-${fileStamp()}.txt`);
  const button = $('#download-txt'); button.textContent = t('report.downloaded'); button.dataset.downloaded = 'true';
  setTimeout(() => { button.textContent = t('report.downloadTxt'); delete button.dataset.downloaded; }, 1500);
};
const preparePrintMeta = snapshot => {
  const meta = $('#print-meta'); meta.replaceChildren();
  const title = document.createElement('b'); title.textContent = t('export.personalTitle');
  const summary = document.createElement('span');
  summary.textContent = `${t('export.generated')}: ${localTimestamp(snapshot.generatedAt)} · ${t('export.attempts')}: ${snapshot.attempts} · ${t('export.catalog')}: ${snapshot.catalog?.total || '—'}`;
  const note = document.createElement('small');
  note.textContent = `${t('export.pdfScope', { count: snapshot.counts.free })} ${t('export.disclaimerMatch')} ${t('export.disclaimerScore')} ${t('export.disclaimerIncomplete')}`;
  meta.append(title, summary, note);
};
$('#export-report').onclick = () => {
  if (!insightsReady) return;
  const snapshot = buildExportSnapshot(); preparePrintMeta(snapshot);
  const previousTitle = document.title;
  document.title = `traceerase-report-${fileStamp(snapshot.generatedAt)}`;
  document.body.classList.add('print-report');
  addEventListener('afterprint', () => {
    document.title = previousTitle; document.body.classList.remove('print-report');
  }, { once: true });
  window.print();
};

const fitCanvasText = (ctx, value, maxWidth) => {
  const text = String(value || '');
  if (ctx.measureText(text).width <= maxWidth) return text;
  let short = text;
  while (short.length > 1 && ctx.measureText(short + '…').width > maxWidth) short = short.slice(0, -1);
  return short + '…';
};
const downloadResultCard = async event => {
  event.preventDefault();
  if (!insightsReady) return;
  try { await document.fonts?.load?.('700 25px Monocraft'); } catch {}
  const model = deriveReportModel();
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  const light = document.documentElement.dataset.theme === 'light';
  const bg = light ? '#f5f5f2' : '#0a0a0b';
  const fg = light ? '#101011' : '#ffffff';
  const dim = light ? '#67676b' : '#8b8b8f';
  const hair = light ? 'rgba(16,16,17,.16)' : 'rgba(255,255,255,.14)';
  const pixel = 'Monocraft, ui-monospace, monospace';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = hair; ctx.lineWidth = 1;
  for (let x = 32; x < canvas.width; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 32; y < canvas.height; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  ctx.fillStyle = bg; ctx.fillRect(32, 32, 1136, 566);
  ctx.strokeStyle = fg; ctx.lineWidth = 2; ctx.strokeRect(32, 32, 1136, 566);

  ctx.fillStyle = fg; ctx.font = `700 25px ${pixel}`; ctx.fillText('TRACE', 64, 80);
  const traceWidth = ctx.measureText('TRACE').width;
  ctx.fillStyle = fg; ctx.fillRect(64 + traceWidth + 5, 56, 92, 31);
  ctx.fillStyle = bg; ctx.fillText('ERASE', 64 + traceWidth + 10, 80);
  ctx.fillStyle = dim; ctx.font = `400 16px ${pixel}`;
  const date = new Intl.DateTimeFormat(currentLanguage() === 'en' ? 'en-GB' : 'ru-RU').format(new Date());
  ctx.textAlign = 'right'; ctx.fillText(`${reportMode === 'demo' ? t('card.demo') + ' · ' : ''}${date}`, 1136, 78); ctx.textAlign = 'left';
  ctx.strokeStyle = hair; ctx.beginPath(); ctx.moveTo(64, 112); ctx.lineTo(1136, 112); ctx.stroke();

  ctx.fillStyle = dim; ctx.font = `400 14px ${pixel}`; ctx.fillText(t('card.publicView').toUpperCase(), 64, 154);
  ctx.fillStyle = fg; ctx.font = `700 45px ${pixel}`;
  ctx.fillText(fitCanvasText(ctx, model.maskedTarget, 680), 64, 209);
  ctx.fillStyle = dim; ctx.font = `400 15px ${pixel}`;
  ctx.fillText(`${t('card.intent')}: ${t(`intent.${model.intent}`)} · ${t(`stranger.role.${model.intent}`)}`, 64, 248);

  ctx.fillStyle = dim; ctx.font = `400 13px ${pixel}`; ctx.fillText(t('card.visibility').toUpperCase(), 866, 151);
  const scoreText = model.insufficient ? '—' : String(model.score);
  ctx.fillStyle = fg; ctx.font = `700 92px ${pixel}`; ctx.fillText(scoreText, 858, 235);
  const scoreWidth = ctx.measureText(scoreText).width;
  if (!model.insufficient) {
    ctx.fillStyle = dim; ctx.font = `400 19px ${pixel}`; ctx.fillText('/100', 866 + scoreWidth, 232);
  }
  ctx.fillStyle = fg; ctx.font = `400 14px ${pixel}`; ctx.fillText(t(`report.${model.grade}`).toUpperCase(), 866, 270);

  ctx.strokeStyle = hair; ctx.beginPath(); ctx.moveTo(64, 312); ctx.lineTo(1136, 312); ctx.stroke();
  const done = visibleTasks.filter(task => completedTasks.has(task.id)).length;
  const facts = [
    [t('card.matches'), `${model.matches} · ${model.attempts}`],
    [t('card.categories'), String(model.categories.length)],
    [t('cleanup.progress'), `${done}/${visibleTasks.length}`]
  ];
  facts.forEach(([label, value], index) => {
    const x = 64 + index * 210;
    ctx.fillStyle = dim; ctx.font = `400 12px ${pixel}`; ctx.fillText(label.toUpperCase(), x, 354);
    ctx.fillStyle = fg; ctx.font = `700 31px ${pixel}`; ctx.fillText(value, x, 393);
  });

  ctx.fillStyle = dim; ctx.font = `400 12px ${pixel}`; ctx.fillText(t('card.review').toUpperCase(), 704, 354);
  const sourceNames = [...new Set(model.hits.map(sourceText))].slice(0, 3);
  ctx.fillStyle = fg; ctx.font = `400 18px ${pixel}`;
  (sourceNames.length ? sourceNames : [t(model.insufficient ? 'stranger.noConclusion' : 'stranger.noMatches')]).forEach((source, index) => {
    ctx.fillText(`${String(index + 1).padStart(2, '0')}  ${fitCanvasText(ctx, source, 390)}`, 704, 391 + index * 34);
  });

  ctx.strokeStyle = hair; ctx.beginPath(); ctx.moveTo(64, 536); ctx.lineTo(1136, 536); ctx.stroke();
  ctx.fillStyle = dim; ctx.font = `400 12px ${pixel}`;
  ctx.fillText(t(model.insufficient ? 'card.noteInsufficient' : 'card.note'), 64, 572);
  ctx.textAlign = 'right'; ctx.fillText('traceerase · public view', 1136, 572); ctx.textAlign = 'left';

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (blob) downloadBlob(blob, `traceerase-public-view-${fileStamp()}.png`);
};
$('#download-card').onclick = downloadResultCard;

const eraseRange = $('#erase-range');
eraseRange.oninput = () => {
  const value = Number(eraseRange.value);
  $('#eraser').style.setProperty('--erase', value + '%');
  $('#erase-label').textContent = value === 0 ? t('erase.start') : value < 100 ? t('erase.progress', { value }) : t('erase.done');
};

const demoHits = () => [
  { type: 'account', src: 'GitHub', cat: 'dev', url: 'https://github.com/demo-user', state: 'found', detail: t('demo.publicRepos'), detailKey: 'demo.publicRepos', method: 'demo', reason: 'sample' },
  { type: 'account', src: 'Telegram', cat: 'soc', url: 'https://t.me/demo_user', state: 'found', detail: t('demo.publicProfile'), detailKey: 'demo.publicProfile', method: 'demo', reason: 'sample' },
  { type: 'leak', src: t('demo.archive'), srcKey: 'demo.archive', cat: 'risk', state: 'found', detail: t('demo.oldMention'), detailKey: 'demo.oldMention', method: 'demo', reason: 'sample' },
  { type: 'account', src: 'Codeforces', cat: 'game', url: 'https://codeforces.com/profile/demo-user', state: 'free', method: 'demo', reason: 'sample' }
];
$('#demo').onclick = () => {
  cancelActiveRun(); const currentRun = runId;
  const demoItems = demoHits();
  activeIntent = selectedIntent; activeQuery = 'demo-user';
  reportMode = 'demo'; lastScanMeta = null; noteState = 'hero'; resetReport(); setCounts();
  scanStartedAt = new Date();
  lastScanMeta = {
    q: 'demo-user', kind: 'username', total: demoItems.length,
    catalog: sourceStats,
    manual: [
      { n: 'VK', url: 'https://vk.com/demo-user', direct: true },
      { n: 'MAX', url: 'https://max.ru/', direct: false },
      { n: 'Instagram', url: 'https://www.instagram.com/demo-user/', direct: true },
      { n: 'TikTok', url: 'https://www.tiktok.com/@demo-user', direct: true }
    ]
  };
  graphRoot(activeQuery); renderReportTitle(); report.scrollIntoView({ behavior: 'smooth', block: 'start' });
  demoItems.forEach((h, i) => demoTimers.push(setTimeout(() => {
    if (currentRun !== runId) return;
    n[h.state]++; setCounts(); addRow(h); const progress = (i + 1) / demoItems.length;
    $('#arc').style.strokeDashoffset = 276.5 * (1 - progress); $('#pct').textContent = Math.round(progress * 100) + '%';
    if (i === demoItems.length - 1) { scanFinishedAt = new Date(); $('#c-time').textContent = '2.1' + t('time.unit'); renderCompletion(); $('#rnote').textContent = t('demo.note'); }
  }, i * 330)));
};

document.addEventListener('traceerase:languagechange', () => {
  syncIntentControl();
  renderCtaTail();
  updateSignalBoard();
  renderCoverage();
  refreshGraph();
  renderReportTitle();
  renderNote();
  go.textContent = es ? t('scan.running') : report.hidden ? t('hero.cta') : t('scan.again');
  $$('.row .cat[data-cat]').forEach(element => { element.textContent = CAT[element.dataset.cat]; });
  $$('.row .st[data-state]').forEach(element => { element.textContent = ST[element.dataset.state]; });
  $$('.row .act').forEach(element => { element.textContent = t('report.request'); });
  $$('[data-src-key]').forEach(element => { element.textContent = t(element.dataset.srcKey); });
  $$('[data-detail-key]').forEach(element => { element.textContent = t(element.dataset.detailKey); });
  rows.dataset.empty = t('report.waiting');
  if (insightsReady) renderCompletion();
  if (reportMode === 'demo') $('#rnote').textContent = t('demo.note');
  eraseRange.oninput();
});
