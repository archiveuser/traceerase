// node test.js  — падает, если ломается классификация запроса или логика определения аккаунта.
import assert from 'node:assert/strict';
import { kindOf, checkSite, md5 } from './scan.js';

assert.equal(kindOf('durov'), 'username');
assert.equal(kindOf('john.doe-91'), 'username');
assert.equal(kindOf('me@example.com'), 'email');       // точка есть, но это email, не домен
assert.equal(kindOf('a@b.co.uk'), 'email');
assert.equal(kindOf('example.com'), 'domain');
assert.equal(kindOf('sub.example.co.uk'), 'domain');
assert.equal(kindOf('a'), null);                        // слишком коротко
assert.equal(kindOf('drop table users'), null);         // пробелы не пролезают
assert.equal(kindOf('x'.repeat(50)), null);
assert.equal(md5('Me@Example.COM '), md5('me@example.com')); // gravatar: trim + lowercase обязательны

const live = await fetch('https://github.com', { method: 'HEAD' }).then(r => r.ok).catch(() => false);
if (!live) console.log('⚠ сеть недоступна — живые проверки пропущены');
else {
  const gh = { n: 'GitHub', u: 'https://github.com/{}' };
  assert.equal((await checkSite(gh, 'torvalds')).state, 'found');
  assert.equal((await checkSite(gh, 'zzq' + Date.now())).state, 'free');
  // soft-404: сайт отдаёт 200 на несуществующий профиль, отличает только маркер в теле
  const tg = { n: 'Telegram', u: 'https://t.me/{}', has: 'tgme_page_title' };
  assert.equal((await checkSite(tg, 'durov')).state, 'found');
  assert.equal((await checkSite(tg, 'zzq' + Date.now())).state, 'free');

  // редирект на «такого нет», но ник уезжает в query — по полному URL это ложный плюс
  const wp = { n: 'WordPress', u: 'https://{}.wordpress.com' };
  assert.equal((await checkSite(wp, 'zzq' + Date.now())).state, 'free');
  const bc = { n: 'Bandcamp', u: 'https://{}.bandcamp.com' };
  assert.equal((await checkSite(bc, 'zzq' + Date.now())).state, 'free');
  assert.equal((await checkSite(bc, 'music')).state, 'found');

  // GitLab уводит несуществующего на /users/sign_in с кодом 403.
  // Если судить по статусу, это «не знаю»; правда в том, что нас увели с профиля.
  const gl = { n: 'GitLab', u: 'https://gitlab.com/{}' };
  assert.equal((await checkSite(gl, 'zzq' + Date.now())).state, 'free');
  assert.equal((await checkSite(gl, 'torvalds')).state, 'found');

  // Gitea.com отвечает честным 404: добавляем только проверенный хост.
  const gt = { n: 'Gitea.com', u: 'https://gitea.com/{}' };
  assert.equal((await checkSite(gt, 'gitea')).state, 'found');
  assert.equal((await checkSite(gt, 'zzq' + Date.now())).state, 'free');

  // API Bluesky отвечает 400 на несуществующий хендл — тело осмысленное,
  // и маркер в нём точнее статуса. Бот-стены (403/429) при этом обязаны остаться unknown.
  const bs = { n: 'Bluesky', u: 'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle={}.bsky.social', has: '"did"' };
  assert.equal((await checkSite(bs, 'zzq' + Date.now())).state, 'free');

  // Mojang: официальный источник, 404 = ника нет
  const mc = { n: 'Minecraft', u: 'https://api.mojang.com/users/profiles/minecraft/{}' };
  assert.equal((await checkSite(mc, 'Notch')).state, 'found');
  assert.equal((await checkSite(mc, 'zzq' + Date.now())).state, 'free');

  // Codeforces отдаёт 400 на отсутствующий handle, поэтому читаем явный статус API.
  const cf = { n: 'Codeforces', u: 'https://codeforces.com/api/user.info?handles={}', has: '"status":"OK"' };
  assert.equal((await checkSite(cf, 'tourist')).state, 'found');
  assert.equal((await checkSite(cf, 'zzq' + Date.now())).state, 'free');
}

console.log('ok');
