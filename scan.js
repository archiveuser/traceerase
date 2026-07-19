// Реальные проверки. Только публичные данные, только GET по публичным URL.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const baseSites = JSON.parse(await readFile(new URL('./sites.json', import.meta.url), 'utf8'));
const catalogGroups = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));

// Только эти источники участвуют в автоматической классификации. Для остальных
// сервисов мы даём официальный/прямой маршрут, но никогда не выдумываем found/free.
const AUTO_SOURCES = new Set([
  'GitHub', 'GitLab', 'Gitea.com', 'Telegram', 'Bluesky',
  'Minecraft', 'Codeforces', 'Chess.com', 'Lichess'
]);
const AUTO_METHODS = {
  GitHub: 'status', GitLab: 'json-array', 'Gitea.com': 'status', Telegram: 'marker',
  Bluesky: 'marker', Minecraft: 'status', Codeforces: 'marker', 'Chess.com': 'status', Lichess: 'status'
};
const ALLOWED_CATEGORIES = new Set(['dev', 'soc', 'message', 'blog', 'media', 'work', 'creator', 'market', 'game', 'link', 'learn']);
const slug = value => String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const homeFrom = site => {
  if (site.home) return site.home;
  const pattern = site.link || site.u;
  try { return new URL(pattern.replace('{}', 'www')).origin + '/'; } catch { return ''; }
};

// catalog.json хранит компактные кортежи [название, официальный URL, прямой шаблон?].
// Совпавшие с sites.json записи обогащают существующий источник, а не дублируют его.
const merged = new Map(baseSites.map(site => [site.n.toLowerCase(), {
  ...site,
  mode: AUTO_SOURCES.has(site.n) ? 'auto' : 'manual',
  method: AUTO_METHODS[site.n] || 'manual'
}]));
for (const [cat, entries] of Object.entries(catalogGroups)) {
  for (const [n, home, profile = null] of entries) {
    const key = n.toLowerCase();
    const current = merged.get(key);
    merged.set(key, current
      ? { ...current, home: current.home || home, profile: current.profile || profile || current.link || current.u }
      : { n, cat, home, profile, mode: 'manual', method: 'manual' });
  }
}

export const sites = [...merged.values()].map(site => ({ ...site, id: site.id || slug(site.n), home: homeFrom(site) }));
export const scanSites = sites.filter(site => site.mode === 'auto');
export const manualSites = sites.filter(site => site.mode === 'manual');

const assertCatalog = () => {
  if (sites.length < 200) throw new Error(`Source catalog must contain at least 200 entries; received ${sites.length}`);
  const ids = new Set();
  for (const site of sites) {
    if (!site.id || ids.has(site.id)) throw new Error(`Duplicate or invalid source id: ${site.id || site.n}`);
    ids.add(site.id);
    if (!ALLOWED_CATEGORIES.has(site.cat)) throw new Error(`Invalid category for ${site.n}: ${site.cat}`);
    if (!['auto', 'manual'].includes(site.mode)) throw new Error(`Invalid mode for ${site.n}: ${site.mode}`);
    if (!site.home?.startsWith('https://')) throw new Error(`Invalid official URL for ${site.n}`);
    if (site.profile && (!site.profile.startsWith('https://') || (site.profile.match(/\{\}/g) || []).length !== 1)) {
      throw new Error(`Manual route ${site.n} needs one HTTPS {} placeholder`);
    }
    if (site.mode === 'auto') {
      if (typeof site.u !== 'string' || !site.u.startsWith('https://') || (site.u.match(/\{\}/g) || []).length !== 1) {
        throw new Error(`Automatic source ${site.n} needs exactly one HTTPS {} placeholder`);
      }
      new URL(site.u.replace('{}', 'traceerase-test'));
    }
  }
};
assertCatalog();

const COMMON_TLDS = new Set([
  'ru', 'рф', 'com', 'org', 'net', 'info', 'biz', 'io', 'dev', 'app', 'ai', 'me', 'co', 'tv', 'fm',
  'site', 'online', 'store', 'tech', 'pro', 'xyz', 'name', 'cloud', 'blog', 'shop', 'su', 'by', 'kz', 'ua',
  'de', 'fr', 'it', 'es', 'nl', 'pl', 'cz', 'uk', 'us', 'ca', 'au', 'jp', 'cn', 'in', 'br', 'ch', 'se',
  'no', 'fi', 'dk', 'ee', 'lv', 'lt', 'ge', 'am', 'az', 'kg', 'uz', 'md'
]);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const get = async (url, headers = {}, ms = 9000, parentSignal) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  const abort = () => controller.abort();
  if (parentSignal?.aborted) abort();
  else parentSignal?.addEventListener('abort', abort, { once: true });
  try {
    return await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ru,en;q=0.9', ...headers }, redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener('abort', abort);
  }
};

/**
 * email → domain → username. Порядок важен: "a@b.com" содержит точку, но это email,
 * а "john.doe-91" похож на домен, пока не потребуешь буквенную зону на конце.
 * ponytail: "john.doe" всё ещё уйдёт в домены — .doe не отличить от зоны без списка TLD.
 * Заводить список стоит, только если такие ники реально начнут приходить.
 */
export const kindOf = q =>
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(q) ? 'email'
  : /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/i.test(q) && COMMON_TLDS.has(q.split('.').pop().toLowerCase()) ? 'domain'
  : /^[\w.\-]{2,40}$/.test(q) ? 'username'
  : null;

/**
 * 404 → свободно. 200 → занято. Иначе — неизвестно, и мы честно так и пишем.
 * Врать «след найден» нельзя: один ложный плюс дороже десяти пропусков, поэтому
 * всё сомнительное валится в 'free'/'unknown', а не в 'found'.
 */
export const checkSite = async (site, user, signal) => {
  // Bluesky принимает полный handle. Короткий ник дополняем стандартным доменом,
  // а пользовательский handle вида name.example.com оставляем без изменений.
  const lookupUser = site.handleSuffix && !user.includes('.') ? `${user}${site.handleSuffix}` : user;
  const url = site.u.replace('{}', encodeURIComponent(lookupUser));
  const profileUrl = (site.link || site.u).replace('{}', encodeURIComponent(lookupUser));
  const checkedAt = new Date().toISOString();
  const method = site.method || (site.has ? 'marker' : 'redirect');
  const answer = (state, reason) => ({ state, url: profileUrl, method, reason, checkedAt });
  try {
    const r = await get(url, {}, 9000, signal);

    if (r.status === 404 || r.status === 410) return answer('free', 'not-found-status');
    if (r.status === 401 || r.status === 403 || r.status === 429 || r.status >= 500) {
      return answer('unknown', r.status === 429 ? 'rate-limited' : 'source-blocked');
    }

    if (method === 'json-array') {
      if (!r.ok) return answer('unknown', 'unexpected-status');
      const data = await r.json().catch(() => null);
      if (!Array.isArray(data)) return answer('unknown', 'invalid-response');
      const match = data.some(item => String(item?.username || '').toLowerCase() === lookupUser.toLowerCase());
      return answer(match ? 'found' : 'free', match ? 'exact-json-match' : 'no-exact-json-match');
    }

    // soft-404: страница отдаётся всегда, профиль отличает только маркер в теле.
    // Проверять маркер надо до всего остального: у таких сайтов имя часто живёт
    // в query (news.ycombinator.com/user?id=), и правило про URL их бы оболгало.
    if (site.has) {
      // 403/429 — бот-стена или лимит: тела нет, судить не по чему.
      // Прочие коды (включая 400 от API Bluesky на несуществующий хендл) несут
      // осмысленное тело, и маркер в нём отвечает на вопрос точнее статуса.
      const text = await r.text();
      if (text.includes(site.has)) return answer('found', 'marker-present');
      if (r.ok || (site.missingStatuses || []).includes(r.status)) return answer('free', 'marker-absent');
      return answer('unknown', 'unexpected-status');
    }

    // Увели с профиля — профиля нет, какой бы код ни вернули.
    // GitLab на несуществующего шлёт 403 на /users/sign_in, wordpress и bandcamp — 200
    // на свою служебную страницу. Общее у них одно: имени в финальном пути больше нет.
    // Query отбрасываем намеренно — там ник остаётся (?subdomain=, ?new_domain=).
    // ponytail: ник вроде "com" или "www" даст ложный плюс. Пофиксить, если такие придут.
    const final = new URL(r.url);
    const hostLabels = decodeURIComponent(final.hostname).toLowerCase().split('.').filter(Boolean);
    const pathSegments = decodeURIComponent(final.pathname).toLowerCase().split('/').filter(Boolean)
      .map(segment => segment.replace(/^[@~]+/, ''));
    if (![...hostLabels, ...pathSegments].includes(lookupUser.toLowerCase())) {
      return answer('free', 'redirected-away');
    }

    // URL сохранился, но ответ не 2xx — это бот-стена (npm, CodePen). Честно признаём незнание.
    if (!r.ok) return answer('unknown', 'unexpected-status');

    return answer('found', 'profile-response');
  } catch {
    return answer('unknown', 'network-error');
  }
};

/**
 * Не больше `limit` запросов одновременно. Сто параллельных с одного IP — верный
 * способ собрать бот-стены и таймауты вместо ответов: сайты начинают резать,
 * и весь отчёт превращается в стену «требует проверки».
 */
export const pool = async (items, limit, fn, signal) => {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length && !signal?.aborted) await fn(items[i++]);
  }));
};

export const md5 = s => createHash('md5').update(s.trim().toLowerCase()).digest('hex');

/** Gravatar раскрывает аватар и публичный профиль по одному хешу email. */
export const gravatar = async (email, signal) => {
  const h = md5(email);
  const [avatar, publicProfile] = await Promise.all([
    get(`https://www.gravatar.com/avatar/${h}?d=404`, {}, 9000, signal)
      .then(r => (r.ok ? true : [404, 410].includes(r.status) ? false : null))
      .catch(() => null),
    get(`https://www.gravatar.com/${h}.json`, {}, 9000, signal)
      .then(async r => {
        if ([404, 410].includes(r.status)) return { state: false, entry: null };
        if (!r.ok) return { state: null, entry: null };
        const data = await r.json().catch(() => null);
        const entry = data?.entry?.[0];
        return { state: entry && typeof entry === 'object' ? true : null, entry: entry || null };
      })
      .catch(() => ({ state: null, entry: null }))
  ]);
  return { hash: h, avatar, profileState: publicProfile.state, profile: publicProfile.entry };
};

/**
 * Ниже везде: null = проверить не удалось, [] = проверили, пусто.
 * Схлопывать одно в другое нельзя — иначе упавший источник выглядит как «чисто».
 */

/** DNS-over-HTTPS, без резолвера и без зависимостей. */
export const dns = async (name, type, signal) => {
  try {
    const r = await get(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { accept: 'application/dns-json' }, 9000, signal);
    if (!r.ok) return null;
    const j = await r.json();
    return (j.Answer || []).map(a => a.data);
  } catch { return null; }
};

/** RDAP — публичный whois. Отдаёт регистратора и даты. */
export const rdap = async (domain, signal) => {
  try {
    const r = await get(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { accept: 'application/rdap+json' }, 9000, signal);
    if (!r.ok) return null;
    const j = await r.json();
    const ev = Object.fromEntries((j.events || []).map(e => [e.eventAction, e.eventDate]));
    return {
      registrar: j.entities?.find(e => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find(f => f[0] === 'fn')?.[3] || null,
      created: ev.registration || null,
      expires: ev.expiration || null,
      ns: (j.nameservers || []).map(n => n.ldhName)
    };
  } catch { return null; }
};

/**
 * crt.sh — каждый выпущенный TLS-сертификат публичен. Отсюда утекают внутренние поддомены.
 * Сервис регулярно отдаёт 502 под нагрузкой, поэтому падение обязано вернуть null, а не [].
 */
const MAX_CT_RESPONSE_BYTES = 1_000_000;
const readJsonWithinLimit = async (response, maxBytes) => {
  const length = Number(response.headers?.get?.('content-length') || 0);
  if (length > maxBytes || !response.body?.getReader) return null;
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

export const subdomains = async (domain, signal) => {
  try {
    const r = await get(`https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`, {}, 20000, signal);
    if (!r.ok) return null;
    const j = await readJsonWithinLimit(r, MAX_CT_RESPONSE_BYTES);
    if (!Array.isArray(j)) return null;
    return [...new Set(j.flatMap(c => String(c.name_value).split('\n')))]
      .filter(n => n.endsWith(domain) && !n.startsWith('*'))
      .sort();
  } catch { return null; }
};

/** HIBP требует платный ключ. Отключённую проверку отличаем от временно упавшей. */
export const breaches = async (email, signal) => {
  if (!process.env.HIBP_KEY) return { status: 'disabled', records: null };
  try {
    const r = await get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, { 'hibp-api-key': process.env.HIBP_KEY }, 9000, signal);
    if (r.status === 404) return { status: 'ok', records: [] };
    if (!r.ok) return { status: 'unavailable', records: null };
    const data = await r.json().catch(() => null);
    if (!Array.isArray(data)) return { status: 'unavailable', records: null };
    const valid = data.every(b => b && typeof b.Name === 'string' && typeof b.BreachDate === 'string'
      && Number.isFinite(Number(b.PwnCount)) && Array.isArray(b.DataClasses));
    if (!valid) return { status: 'unavailable', records: null };
    return {
      status: 'ok',
      records: data.map(b => ({ name: b.Name, date: b.BreachDate, count: Number(b.PwnCount), data: b.DataClasses }))
    };
  } catch { return { status: 'unavailable', records: null }; }
};
