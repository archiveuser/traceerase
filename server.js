import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sites, kindOf, checkSite, gravatar, dns, rdap, subdomains, breaches, pool } from './scan.js';

const PORT = process.env.PORT || 3000;
const PUB = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

// ponytail: счётчик в памяти процесса. Redis — если нод станет больше одной.
// 10/мин: защищает внешние сайты от нашего трафика, но не режет живую демонстрацию.
const hits = new Map();
const overLimit = ip => {
  const now = Date.now();
  const a = (hits.get(ip) || []).filter(t => now - t < 60_000);
  a.push(now); hits.set(ip, a);
  return a.length > 10;
};

const sse = res => {
  res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  return (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

// null = источник не ответил. Показать «чисто» в этом случае — соврать пользователю.
const state = v => (v === null ? 'unknown' : v.length ? 'found' : 'free');

async function scanStream(q, send) {
  const kind = kindOf(q);
  if (!kind) return send('error', { msg: 'Не похоже на ник, email или домен.' });

  const user = kind === 'email' ? q.split('@')[0] : q;
  const domain = kind === 'email' ? q.split('@')[1] : kind === 'domain' ? q : null;
  const list = kind === 'domain' ? [] : sites;
  const total = list.length + (kind === 'email' ? 3 : 0) + (kind === 'domain' ? 4 : 0);

  send('start', { q, kind, total });
  let done = 0;
  const tick = () => send('progress', { done: ++done, total });

  // Сайты идут через пул, чтобы не долбить сотней соединений разом.
  // Результат по-прежнему уходит в браузер сразу, как только пришёл.
  const jobs = [pool(list, 12, async s => {
    const { state, url } = await checkSite(s, user);
    send('hit', { type: 'account', src: s.n, cat: s.cat, url, state });
    tick();
  })];

  if (kind === 'email') {
    jobs.push(
      gravatar(q).then(g => {
        send('hit', {
          type: 'account', src: 'Gravatar', cat: 'soc', url: `https://gravatar.com/${g.hash}`,
          state: g.avatar ? 'found' : 'free',
          detail: g.profile ? [g.profile.displayName, g.profile.currentLocation].filter(Boolean).join(' · ') : null
        });
        // Хеш email — это не анонимность: он одинаков на всех сайтах и его легко перебрать.
        if (g.avatar) send('hit', { type: 'leak', src: 'MD5-хеш email публичен', cat: 'risk', url: null, state: 'found', detail: g.hash });
        tick();
      }),
      dns(domain, 'MX').then(mx => {
        send('hit', { type: 'info', src: 'Почтовый провайдер', cat: 'infra', state: state(mx), detail: mx?.map(m => m.split(' ').pop()).join(', ') || null });
        tick();
      }),
      breaches(q).then(b => {
        if (b === null) send('note', { msg: 'Проверка утечек (HIBP) выключена: не задан HIBP_KEY.' });
        else if (!b.length) send('hit', { type: 'leak', src: 'Утечки данных', cat: 'risk', state: 'free' });
        else b.forEach(x => send('hit', { type: 'leak', src: x.name, cat: 'risk', state: 'found', detail: `${x.date} · ${x.count.toLocaleString('ru')} записей · ${x.data.slice(0, 4).join(', ')}` }));
        tick();
      })
    );
  }

  if (kind === 'domain') {
    jobs.push(
      dns(domain, 'A').then(a => { send('hit', { type: 'info', src: 'A-записи', cat: 'infra', state: state(a), detail: a?.join(', ') || null }); tick(); }),
      dns(domain, 'TXT').then(t => { send('hit', { type: 'info', src: 'TXT-записи', cat: 'infra', state: state(t), detail: t?.join(' | ').slice(0, 300) || null }); tick(); }),
      rdap(domain).then(w => {
        send('hit', { type: 'info', src: 'Регистрация домена', cat: 'infra', state: w ? 'found' : 'unknown', detail: w ? `${w.registrar || '—'} · создан ${String(w.created).slice(0, 10)}` : null });
        tick();
      }),
      subdomains(domain).then(subs => {
        send('hit', {
          type: 'leak', src: 'Поддомены в CT-логах', cat: 'risk', url: `https://crt.sh/?q=%25.${domain}`,
          state: state(subs),
          detail: subs?.length ? `${subs.length}: ${subs.slice(0, 8).join(', ')}${subs.length > 8 ? '…' : ''}` : subs === null ? 'Источник сейчас недоступен (crt.sh)' : null
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
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify(sites.map(s => s.n)));
    return;
  }

  if (url.pathname === '/api/coverage') {
    const coverage = sites.reduce((out, site) => {
      out[site.cat] = (out[site.cat] || 0) + 1;
      return out;
    }, {});
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify(coverage));
    return;
  }

  if (url.pathname === '/api/scan') {
    const q = (url.searchParams.get('q') || '').trim().slice(0, 64);
    if (!q) { res.writeHead(400).end('no query'); return; }
    if (overLimit(ip)) { res.writeHead(429, { 'content-type': 'text/plain; charset=utf-8' }).end('Слишком много сканирований. Подожди минуту.'); return; }
    const send = sse(res);
    req.on('close', () => res.end());
    try { await scanStream(q, send); } catch (e) { send('error', { msg: String(e.message || e) }); }
    return res.end();
  }

  // статика; resolve + префикс-проверка режет ../ обход
  const p = resolve(join(PUB, url.pathname === '/' ? 'index.html' : url.pathname));
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
