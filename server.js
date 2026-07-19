import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sites, scanSites, manualSites, kindOf, checkSite, gravatar, dns, rdap, subdomains, breaches, pool } from './scan.js';

const PORT = process.env.PORT || 3000;
const PUB = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

// ponytail: счётчик в памяти процесса. Redis — если нод станет больше одной.
// 10/мин: защищает внешние сайты от нашего трафика, но не режет живую демонстрацию.
const hits = new Map();
const RATE_WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 10_000;
const MAX_ACTIVE_SCANS = Math.max(1, Number.parseInt(process.env.MAX_ACTIVE_SCANS || '20', 10) || 20);
let activeScans = 0;

const pruneHits = (now = Date.now()) => {
  for (const [ip, timestamps] of hits) {
    if (!timestamps.some(t => now - t < RATE_WINDOW_MS)) hits.delete(ip);
  }
};

const overLimit = ip => {
  const now = Date.now();
  if (!hits.has(ip) && hits.size >= MAX_TRACKED_CLIENTS) {
    pruneHits(now);
    if (hits.size >= MAX_TRACKED_CLIENTS) return true;
  }
  const a = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  a.push(now); hits.set(ip, a);
  return a.length > 10;
};
setInterval(pruneHits, RATE_WINDOW_MS).unref();

const sse = (res, signal) => {
  res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  return (event, data) => {
    if (signal.aborted || res.writableEnded || res.destroyed) return false;
    return res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
};

// null = источник не ответил. Показать «чисто» в этом случае — соврать пользователю.
const state = v => (v === null ? 'unknown' : v.length ? 'found' : 'free');

const SCAN_TEXT = {
  ru: {
    invalid: 'Не похоже на ник, email или домен.', hash: 'MD5-хеш email публичен', provider: 'Почтовый провайдер',
    breachOff: 'Проверка утечек (HIBP) выключена.', breaches: 'Утечки данных', records: 'записей',
    aRecords: 'A-записи', txtRecords: 'TXT-записи', registration: 'Регистрация домена', created: 'создан',
    subdomains: 'Поддомены в CT-логах', unavailable: 'Источник сейчас недоступен (crt.sh)', rate: 'Слишком много сканирований. Подожди минуту.'
  },
  en: {
    invalid: 'Enter a valid username, email, or domain.', hash: 'Email MD5 hash is public', provider: 'Email provider',
    breachOff: 'Breach check (HIBP) is disabled.', breaches: 'Data breaches', records: 'records',
    aRecords: 'A records', txtRecords: 'TXT records', registration: 'Domain registration', created: 'created',
    subdomains: 'Subdomains in CT logs', unavailable: 'Source is currently unavailable (crt.sh)', rate: 'Too many scans. Wait one minute and try again.'
  }
};
const scanText = (lang, key) => SCAN_TEXT[lang]?.[key] || SCAN_TEXT.ru[key];
const evidence = (method, reason) => ({ method, reason, checkedAt: new Date().toISOString() });

const SOURCE_STATS = Object.freeze({ total: sites.length, automatic: scanSites.length, manual: manualSites.length });
const MANUAL_HIGHLIGHTS = ['VK', 'MAX', 'Instagram', 'Odnoklassniki', 'TikTok', 'YouTube', 'X', 'LinkedIn'];
const manualUrl = (site, user) => {
  const pattern = site.profile?.includes('{}') ? site.profile : site.home;
  try {
    const href = pattern.replace('{}', encodeURIComponent(user));
    const url = new URL(href);
    return url.protocol === 'https:' ? url.href : site.home;
  } catch { return site.home; }
};
const manualHighlights = user => MANUAL_HIGHLIGHTS
  .map(name => manualSites.find(site => site.n === name))
  .filter(Boolean)
  .map(site => ({ n: site.n, url: manualUrl(site, user), direct: Boolean(site.profile?.includes('{}')) }));

async function scanStream(q, send, lang = 'ru', signal) {
  const rawSend = send;
  send = (event, data) => { if (!signal?.aborted) rawSend(event, data); };
  const kind = kindOf(q);
  if (!kind) return send('error', { msg: scanText(lang, 'invalid') });

  const user = kind === 'email' ? q.split('@')[0] : q;
  const domain = kind === 'email' ? q.split('@')[1] : kind === 'domain' ? q : null;
  // Полный Bluesky-handle может выглядеть как домен (name.example.com), поэтому
  // для доменного ввода запускаем только этот безопасный account-контракт.
  const list = kind === 'domain' ? scanSites.filter(site => site.n === 'Bluesky') : scanSites;
  const hibpEnabled = process.env.ENABLE_PUBLIC_HIBP === 'true' && Boolean(process.env.HIBP_KEY);
  const total = list.length + (kind === 'email' ? 2 + Number(hibpEnabled) : 0) + (kind === 'domain' ? 4 : 0);

  send('start', {
    q, kind, total,
    catalog: SOURCE_STATS,
    manual: kind === 'domain' ? [] : manualHighlights(user)
  });
  let done = 0;
  const tick = () => send('progress', { done: ++done, total });

  // Сайты идут через пул, чтобы не долбить сотней соединений разом.
  // Результат по-прежнему уходит в браузер сразу, как только пришёл.
  const jobs = [pool(list, 12, async s => {
    const { state, url, method, reason, checkedAt } = await checkSite(s, user, signal);
    send('hit', { type: 'account', src: s.n, cat: s.cat, url, state, method, reason, checkedAt });
    tick();
  }, signal)];

  if (kind === 'email') {
    const emailJobs = [
      gravatar(q, signal).then(g => {
        const profileFound = g.avatar === true || g.profileState === true;
        const profileMissing = g.avatar === false && g.profileState === false;
        send('hit', {
          type: 'account', src: 'Gravatar', cat: 'soc', url: `https://gravatar.com/${g.hash}`,
          state: profileFound ? 'found' : profileMissing ? 'free' : 'unknown',
          detail: g.profile ? [g.profile.displayName, g.profile.currentLocation].filter(Boolean).join(' · ') : null,
          ...evidence('gravatar', profileFound ? 'public-profile-response' : profileMissing ? 'no-public-profile' : 'source-unavailable')
        });
        // Хеш email — это не анонимность: он одинаков на всех сайтах и его легко перебрать.
        if (profileFound) send('hit', { type: 'leak', src: scanText(lang, 'hash'), cat: 'risk', url: null, state: 'found', detail: g.hash, ...evidence('gravatar', 'public-hash') });
        tick();
      }),
      dns(domain, 'MX', signal).then(mx => {
        send('hit', { type: 'info', src: scanText(lang, 'provider'), cat: 'infra', state: state(mx), detail: mx?.map(m => m.split(' ').pop()).join(', ') || null, ...evidence('dns', mx === null ? 'source-unavailable' : mx.length ? 'records-present' : 'no-records') });
        tick();
      })
    ];
    if (hibpEnabled) emailJobs.push(
      breaches(q, signal).then(result => {
        if (result.status === 'disabled') send('note', { msg: scanText(lang, 'breachOff') });
        else if (result.status === 'unavailable') {
          send('hit', { type: 'leak', src: scanText(lang, 'breaches'), cat: 'risk', state: 'unknown', ...evidence('hibp', 'source-unavailable') });
        } else if (!result.records.length) {
          send('hit', { type: 'leak', src: scanText(lang, 'breaches'), cat: 'risk', state: 'free', ...evidence('hibp', 'no-breach-response') });
        } else {
          result.records.forEach(x => send('hit', { type: 'leak', src: x.name, cat: 'risk', state: 'found', detail: `${x.date} · ${x.count.toLocaleString(lang === 'en' ? 'en' : 'ru')} ${scanText(lang, 'records')} · ${(x.data || []).slice(0, 4).join(', ')}`, ...evidence('hibp', 'breach-record') }));
        }
        tick();
      })
    );
    else send('note', { msg: scanText(lang, 'breachOff') });
    jobs.push(...emailJobs);
  }

  if (kind === 'domain') {
    jobs.push(
      dns(domain, 'A', signal).then(a => { send('hit', { type: 'info', src: scanText(lang, 'aRecords'), cat: 'infra', state: state(a), detail: a?.join(', ') || null, ...evidence('dns', a === null ? 'source-unavailable' : a.length ? 'records-present' : 'no-records') }); tick(); }),
      dns(domain, 'TXT', signal).then(t => { send('hit', { type: 'info', src: scanText(lang, 'txtRecords'), cat: 'infra', state: state(t), detail: t?.join(' | ').slice(0, 300) || null, ...evidence('dns', t === null ? 'source-unavailable' : t.length ? 'records-present' : 'no-records') }); tick(); }),
      rdap(domain, signal).then(w => {
        send('hit', { type: 'info', src: scanText(lang, 'registration'), cat: 'infra', state: w ? 'found' : 'unknown', detail: w ? `${w.registrar || '—'} · ${scanText(lang, 'created')} ${String(w.created).slice(0, 10)}` : null, ...evidence('rdap', w ? 'registration-record' : 'source-unavailable') });
        tick();
      }),
      subdomains(domain, signal).then(subs => {
        send('hit', {
          type: 'leak', src: scanText(lang, 'subdomains'), cat: 'risk', url: `https://crt.sh/?q=%25.${domain}`,
          state: state(subs),
          detail: subs?.length ? `${subs.length}: ${subs.slice(0, 8).join(', ')}${subs.length > 8 ? '…' : ''}` : subs === null ? scanText(lang, 'unavailable') : null,
          ...evidence('certificate-transparency', subs === null ? 'source-unavailable' : subs.length ? 'records-present' : 'no-records')
        });
        tick();
      })
    );
  }

  await Promise.all(jobs);
  send('done', { total });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const ip = req.socket.remoteAddress;

  // Список источников отдаёт сервер, а не разметка: иначе число на лендинге
  // разъезжается с реальностью при первом же изменении sites.json.
  if (url.pathname === '/api/sites') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify({
      ...SOURCE_STATS,
      names: sites.map(site => site.n)
    }));
    return;
  }

  if (url.pathname === '/api/coverage') {
    const coverage = sites.reduce((out, site) => {
      out[site.cat] ||= { total: 0, automatic: 0 };
      out[site.cat].total++;
      if (site.mode === 'auto') out[site.cat].automatic++;
      return out;
    }, {});
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify(coverage));
    return;
  }

  if (url.pathname === '/api/sources') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify(sites.map(({ id, n, cat, mode, home, profile }) => ({
      id, n, cat, mode, home, direct: Boolean(profile?.includes('{}')),
      limitation: n === 'MAX' ? 'no-public-username' : null
    }))));
    return;
  }

  if (url.pathname === '/api/scan') {
    const q = (url.searchParams.get('q') || '').trim().slice(0, 64);
    const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ru';
    if (!q) { res.writeHead(400).end('no query'); return; }
    if (overLimit(ip)) { res.writeHead(429, { 'content-type': 'text/plain; charset=utf-8' }).end(scanText(lang, 'rate')); return; }
    if (activeScans >= MAX_ACTIVE_SCANS) { res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '5' }).end('scan capacity reached'); return; }
    activeScans++;
    const controller = new AbortController();
    const send = sse(res, controller.signal);
    res.on('close', () => controller.abort());
    try { await scanStream(q, send, lang, controller.signal); } catch (e) { send('error', { msg: String(e.message || e) }); }
    finally { activeScans--; }
    if (!res.writableEnded && !res.destroyed) res.end();
    return;
  }

  // статика; resolve + префикс-проверка режет ../ обход
  const requested = url.pathname === '/' ? 'index.html' : url.pathname === '/sources' ? 'sources.html' : url.pathname;
  const p = resolve(join(PUB, requested));
  if (!p.startsWith(PUB + sep) && p !== join(PUB, 'index.html')) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
  }
});

server.keepAliveTimeout = 120_000;
server.headersTimeout = 125_000;
server.listen(PORT, '0.0.0.0', () => console.log(`TraceErase → http://localhost:${PORT}`));
