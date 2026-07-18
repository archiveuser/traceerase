// Реальные проверки. Только публичные данные, только GET по публичным URL.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const sites = JSON.parse(await readFile(new URL('./sites.json', import.meta.url), 'utf8'));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const get = (url, headers = {}, ms = 9000) =>
  fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ru,en;q=0.9', ...headers }, redirect: 'follow', signal: AbortSignal.timeout(ms) });

/**
 * email → domain → username. Порядок важен: "a@b.com" содержит точку, но это email,
 * а "john.doe-91" похож на домен, пока не потребуешь буквенную зону на конце.
 * ponytail: "john.doe" всё ещё уйдёт в домены — .doe не отличить от зоны без списка TLD.
 * Заводить список стоит, только если такие ники реально начнут приходить.
 */
export const kindOf = q =>
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(q) ? 'email'
  : /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(q) ? 'domain'
  : /^[\w.\-]{2,40}$/.test(q) ? 'username'
  : null;

/**
 * 404 → свободно. 200 → занято. Иначе — неизвестно, и мы честно так и пишем.
 * Врать «след найден» нельзя: один ложный плюс дороже десяти пропусков, поэтому
 * всё сомнительное валится в 'free'/'unknown', а не в 'found'.
 */
export const checkSite = async (site, user) => {
  const url = site.u.replace('{}', encodeURIComponent(user));
  const profileUrl = (site.link || site.u).replace('{}', encodeURIComponent(user));
  try {
    const r = await get(url);

    if (r.status === 404 || r.status === 410) return { state: 'free', url: profileUrl };

    // soft-404: страница отдаётся всегда, профиль отличает только маркер в теле.
    // Проверять маркер надо до всего остального: у таких сайтов имя часто живёт
    // в query (news.ycombinator.com/user?id=), и правило про URL их бы оболгало.
    if (site.has) {
      // 403/429 — бот-стена или лимит: тела нет, судить не по чему.
      // Прочие коды (включая 400 от API Bluesky на несуществующий хендл) несут
      // осмысленное тело, и маркер в нём отвечает на вопрос точнее статуса.
      if (r.status === 403 || r.status === 429) return { state: 'unknown', url: profileUrl };
      return { state: (await r.text()).includes(site.has) ? 'found' : 'free', url: profileUrl };
    }

    // Увели с профиля — профиля нет, какой бы код ни вернули.
    // GitLab на несуществующего шлёт 403 на /users/sign_in, wordpress и bandcamp — 200
    // на свою служебную страницу. Общее у них одно: имени в финальном пути больше нет.
    // Query отбрасываем намеренно — там ник остаётся (?subdomain=, ?new_domain=).
    // ponytail: ник вроде "com" или "www" даст ложный плюс. Пофиксить, если такие придут.
    const final = new URL(r.url);
    if (!decodeURIComponent(final.host + final.pathname).toLowerCase().includes(user.toLowerCase())) return { state: 'free', url: profileUrl };

    // URL сохранился, но ответ не 2xx — это бот-стена (npm, CodePen). Честно признаём незнание.
    if (!r.ok) return { state: 'unknown', url: profileUrl };

    return { state: 'found', url: profileUrl };
  } catch {
    return { state: 'unknown', url: profileUrl };
  }
};

/**
 * Не больше `limit` запросов одновременно. Сто параллельных с одного IP — верный
 * способ собрать бот-стены и таймауты вместо ответов: сайты начинают резать,
 * и весь отчёт превращается в стену «требует проверки».
 */
export const pool = async (items, limit, fn) => {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
};

export const md5 = s => createHash('md5').update(s.trim().toLowerCase()).digest('hex');

/** Gravatar раскрывает аватар и публичный профиль по одному хешу email. */
export const gravatar = async email => {
  const h = md5(email);
  const [avatar, profile] = await Promise.all([
    get(`https://www.gravatar.com/avatar/${h}?d=404`).then(r => r.ok).catch(() => false),
    get(`https://www.gravatar.com/${h}.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)
  ]);
  return { hash: h, avatar, profile: profile?.entry?.[0] || null };
};

/**
 * Ниже везде: null = проверить не удалось, [] = проверили, пусто.
 * Схлопывать одно в другое нельзя — иначе упавший источник выглядит как «чисто».
 */

/** DNS-over-HTTPS, без резолвера и без зависимостей. */
export const dns = async (name, type) => {
  try {
    const r = await get(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { accept: 'application/dns-json' });
    if (!r.ok) return null;
    const j = await r.json();
    return (j.Answer || []).map(a => a.data);
  } catch { return null; }
};

/** RDAP — публичный whois. Отдаёт регистратора и даты. */
export const rdap = async domain => {
  try {
    const r = await get(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { accept: 'application/rdap+json' });
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
export const subdomains = async domain => {
  try {
    const r = await get(`https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`, {}, 20000);
    if (!r.ok) return null;
    const j = await r.json();
    return [...new Set(j.flatMap(c => String(c.name_value).split('\n')))]
      .filter(n => n.endsWith(domain) && !n.startsWith('*'))
      .sort();
  } catch { return null; }
};

/** HIBP требует платный ключ. Нет ключа — молча пропускаем, а не врём пользователю. */
export const breaches = async email => {
  if (!process.env.HIBP_KEY) return null;
  try {
    const r = await get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, { 'hibp-api-key': process.env.HIBP_KEY });
    if (r.status === 404) return [];
    if (!r.ok) return null;
    return (await r.json()).map(b => ({ name: b.Name, date: b.BreachDate, count: b.PwnCount, data: b.DataClasses }));
  } catch { return null; }
};
