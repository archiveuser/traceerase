// node test.js — каталог, классификация и критические live-контракты.
import assert from 'node:assert/strict';
import { kindOf, checkSite, gravatar, breaches, md5, sites, scanSites, manualSites } from './scan.js';

assert.equal(kindOf('durov'), 'username');
assert.equal(kindOf('john.doe-91'), 'username');
assert.equal(kindOf('john.smith'), 'username');       // неоднозначную точку не выдаём за редкий TLD
assert.equal(kindOf('me@example.com'), 'email');
assert.equal(kindOf('a@b.co.uk'), 'email');
assert.equal(kindOf('example.com'), 'domain');
assert.equal(kindOf('sub.example.co.uk'), 'domain');
assert.equal(kindOf('пример.рф'), null);              // Unicode-домены вводятся в punycode
assert.equal(kindOf('a'), null);
assert.equal(kindOf('drop table users'), null);
assert.equal(kindOf('x'.repeat(50)), null);
assert.equal(md5('Me@Example.COM '), md5('me@example.com'));

assert.ok(sites.length > 200, `ожидалось >200 источников, получено ${sites.length}`);
assert.equal(scanSites.length, 20);
assert.equal(manualSites.length, sites.length - scanSites.length);
assert.equal(new Set(sites.map(site => site.id)).size, sites.length);
assert.ok(sites.every(site => site.home.startsWith('https://')));
assert.equal(sites.find(site => site.n === 'MAX')?.mode, 'manual');
assert.equal(sites.find(site => site.n === 'VK')?.mode, 'manual');
assert.deepEqual(new Set(scanSites.map(site => site.n)), new Set([
  'GitHub', 'GitLab', 'Gitea.com', 'Telegram', 'Bluesky', 'Minecraft', 'Codeforces', 'Chess.com', 'Lichess', 'Steam',
  'Docker Hub', 'crates.io', 'RubyGems', 'Scratch', 'Codeberg', 'Codewars', 'Mastodon', 'Keybase', 'Hacker News', 'Roblox'
]));

// Контракт классификатора проверяется без сети: любые бот-стены/5xx обязаны быть unknown.
const realFetch = globalThis.fetch;
const response = ({ status = 200, url = 'https://example.com/user/demo', body = '' } = {}) => ({
  status, url, ok: status >= 200 && status < 300,
  text: async () => body,
  json: async () => JSON.parse(body || 'null')
});
try {
  globalThis.fetch = async () => response({ status: 503 });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/user/{}' }, 'demo')).state, 'unknown');

  globalThis.fetch = async () => response({ body: '<i>profile-marker</i>' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/user/{}', has: 'profile-marker' }, 'demo')).state, 'found');
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/user/{}', has: 'missing-marker' }, 'demo')).state, 'free');

  globalThis.fetch = async () => response({ body: '[{"username":"Demo"}]' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users?q={}', method: 'json-array' }, 'demo')).state, 'found');
  globalThis.fetch = async () => response({ body: '[]' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users?q={}', method: 'json-array' }, 'demo')).state, 'free');

  globalThis.fetch = async () => response({ body: '{"them":[{"basics":{"username":"Demo"}}]}' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users?q={}', method: 'keybase-user' }, 'demo')).state, 'found');
  globalThis.fetch = async () => response({ body: '{"them":[]}' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users?q={}', method: 'keybase-user' }, 'demo')).state, 'free');

  globalThis.fetch = async () => response({ body: '{"id":"Demo"}' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users/{}.json', method: 'json-user' }, 'demo')).state, 'found');
  globalThis.fetch = async () => response({ body: 'null' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users/{}.json', method: 'json-user' }, 'demo')).state, 'free');

  globalThis.fetch = async () => response({ body: '{"data":[{"requestedUsername":"Demo"}]}' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users/{}', method: 'roblox-user' }, 'demo')).state, 'found');
  globalThis.fetch = async () => response({ body: '{"data":[]}' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/users/{}', method: 'roblox-user' }, 'demo')).state, 'free');

  globalThis.fetch = async () => response({ url: 'https://example.com/something' });
  assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/{}' }, 'me')).state, 'free');

  // Разделители внутри ника — часть имени, а не границы слов.
  for (const nickname of ['john-doe', 'john_doe', 'john.doe']) {
    globalThis.fetch = async () => response({ url: `https://example.com/user/${nickname}` });
    assert.equal((await checkSite({ n: 'Mock', u: 'https://example.com/user/{}' }, nickname)).state, 'found');
  }

  const bluesky = sites.find(site => site.n === 'Bluesky');
  let requestedUrl = '';
  globalThis.fetch = async url => {
    requestedUrl = String(url);
    return response({ url: requestedUrl, body: '{"did":"did:plc:test"}' });
  };
  const shortHandle = await checkSite(bluesky, 'alice');
  assert.match(requestedUrl, /handle=alice\.bsky\.social$/);
  assert.equal(shortHandle.url, 'https://bsky.app/profile/alice.bsky.social');
  const customHandle = await checkSite(bluesky, 'alice.example.com');
  assert.match(requestedUrl, /handle=alice\.example\.com$/);
  assert.equal(customHandle.url, 'https://bsky.app/profile/alice.example.com');

  globalThis.fetch = async () => { throw new Error('offline'); };
  const unavailableGravatar = await gravatar('person@example.com');
  assert.equal(unavailableGravatar.avatar, null);
  assert.equal(unavailableGravatar.profileState, null);

  globalThis.fetch = async () => response({ status: 404 });
  const missingGravatar = await gravatar('nobody@example.com');
  assert.equal(missingGravatar.avatar, false);
  assert.equal(missingGravatar.profileState, false);

  globalThis.fetch = async url => String(url).includes('/avatar/')
    ? response({ status: 404 })
    : response({ body: '{"entry":[{"displayName":"Public person"}]}' });
  const publicGravatar = await gravatar('public@example.com');
  assert.equal(publicGravatar.avatar, false);
  assert.equal(publicGravatar.profileState, true);
  assert.equal(publicGravatar.profile.displayName, 'Public person');

  globalThis.fetch = async () => response({ body: '{}' });
  const malformedGravatar = await gravatar('malformed@example.com');
  assert.equal(malformedGravatar.avatar, true);
  assert.equal(malformedGravatar.profileState, null);

  const originalHibpKey = process.env.HIBP_KEY;
  try {
    delete process.env.HIBP_KEY;
    assert.equal((await breaches('person@example.com')).status, 'disabled');
    process.env.HIBP_KEY = 'contract-test-key';
    globalThis.fetch = async () => response({ status: 503 });
    assert.equal((await breaches('person@example.com')).status, 'unavailable');
    globalThis.fetch = async () => response({ status: 404 });
    assert.deepEqual(await breaches('person@example.com'), { status: 'ok', records: [] });
    globalThis.fetch = async () => response({ body: '[{}]' });
    assert.equal((await breaches('person@example.com')).status, 'unavailable');
    globalThis.fetch = async () => response({ body: '[{"Name":"Example","BreachDate":"2020-01-01","PwnCount":7,"DataClasses":["Emails"]}]' });
    const breachResult = await breaches('person@example.com');
    assert.equal(breachResult.status, 'ok');
    assert.equal(breachResult.records[0].name, 'Example');
  } finally {
    if (originalHibpKey === undefined) delete process.env.HIBP_KEY;
    else process.env.HIBP_KEY = originalHibpKey;
  }
} finally {
  globalThis.fetch = realFetch;
}

const byName = name => sites.find(site => site.n === name);
const uniqueMissing = () => `zzq${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
const liveContracts = [
  {
    name: 'GitHub', health: 'https://api.github.com/users/torvalds',
    verify: async () => {
      assert.equal((await checkSite(byName('GitHub'), 'torvalds')).state, 'found');
      assert.equal((await checkSite(byName('GitHub'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'GitLab', health: 'https://gitlab.com/api/v4/users?username=root',
    verify: async () => assert.equal((await checkSite(byName('GitLab'), uniqueMissing())).state, 'free')
  },
  {
    name: 'Gitea.com', health: 'https://gitea.com/api/v1/users/gitea',
    verify: async () => {
      assert.equal((await checkSite(byName('Gitea.com'), 'gitea')).state, 'found');
      assert.equal((await checkSite(byName('Gitea.com'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Telegram', health: 'https://t.me/durov',
    verify: async () => {
      assert.equal((await checkSite(byName('Telegram'), 'durov')).state, 'found');
      assert.equal((await checkSite(byName('Telegram'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Bluesky', health: 'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=bsky.app',
    verify: async () => {
      assert.equal((await checkSite(byName('Bluesky'), 'bsky.app')).state, 'found');
      assert.equal((await checkSite(byName('Bluesky'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Minecraft', health: 'https://api.mojang.com/users/profiles/minecraft/Notch',
    verify: async () => {
      assert.equal((await checkSite(byName('Minecraft'), 'Notch')).state, 'found');
      assert.equal((await checkSite(byName('Minecraft'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Codeforces', health: 'https://codeforces.com/api/user.info?handles=tourist',
    verify: async () => {
      assert.equal((await checkSite(byName('Codeforces'), 'tourist')).state, 'found');
      assert.equal((await checkSite(byName('Codeforces'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Chess.com', health: 'https://api.chess.com/pub/player/hikaru',
    verify: async () => {
      assert.equal((await checkSite(byName('Chess.com'), 'hikaru')).state, 'found');
      assert.equal((await checkSite(byName('Chess.com'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Lichess', health: 'https://lichess.org/api/user/DrNykterstein',
    verify: async () => {
      assert.equal((await checkSite(byName('Lichess'), 'DrNykterstein')).state, 'found');
      assert.equal((await checkSite(byName('Lichess'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Steam', health: 'https://steamcommunity.com/id/gaben',
    verify: async () => {
      assert.equal((await checkSite(byName('Steam'), 'gaben')).state, 'found');
      assert.equal((await checkSite(byName('Steam'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Docker Hub', health: 'https://hub.docker.com/v2/users/docker',
    verify: async () => {
      assert.equal((await checkSite(byName('Docker Hub'), 'docker')).state, 'found');
      assert.equal((await checkSite(byName('Docker Hub'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'crates.io', health: 'https://crates.io/api/v1/users/dtolnay',
    verify: async () => {
      assert.equal((await checkSite(byName('crates.io'), 'dtolnay')).state, 'found');
      assert.equal((await checkSite(byName('crates.io'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'RubyGems', health: 'https://rubygems.org/api/v1/profiles/ryanb.json',
    verify: async () => {
      assert.equal((await checkSite(byName('RubyGems'), 'ryanb')).state, 'found');
      assert.equal((await checkSite(byName('RubyGems'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Scratch', health: 'https://api.scratch.mit.edu/users/griffpatch',
    verify: async () => {
      assert.equal((await checkSite(byName('Scratch'), 'griffpatch')).state, 'found');
      assert.equal((await checkSite(byName('Scratch'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Codeberg',
    health: () => fetch('https://codeberg.org/api/v1/users/forgejo', { headers: { accept: 'application/json', 'user-agent': 'TraceErase public profile checker' }, signal: AbortSignal.timeout(2500) }),
    verify: async () => {
      assert.equal((await checkSite(byName('Codeberg'), 'forgejo')).state, 'found');
      assert.equal((await checkSite(byName('Codeberg'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Codewars', health: 'https://www.codewars.com/users/jhoffner',
    verify: async () => {
      assert.equal((await checkSite(byName('Codewars'), 'jhoffner')).state, 'found');
      assert.equal((await checkSite(byName('Codewars'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Mastodon', health: 'https://mastodon.social/api/v1/accounts/lookup?acct=Gargron',
    verify: async () => {
      assert.equal((await checkSite(byName('Mastodon'), 'Gargron')).state, 'found');
      assert.equal((await checkSite(byName('Mastodon'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Keybase', health: 'https://keybase.io/_/api/1.0/user/lookup.json?usernames=max',
    verify: async () => {
      assert.equal((await checkSite(byName('Keybase'), 'max')).state, 'found');
      assert.equal((await checkSite(byName('Keybase'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Hacker News', health: 'https://hacker-news.firebaseio.com/v0/user/pg.json',
    verify: async () => {
      assert.equal((await checkSite(byName('Hacker News'), 'pg')).state, 'found');
      assert.equal((await checkSite(byName('Hacker News'), uniqueMissing())).state, 'free');
    }
  },
  {
    name: 'Roblox',
    health: () => fetch('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usernames: ['Roblox'], excludeBannedUsers: false }), signal: AbortSignal.timeout(2500) }),
    verify: async () => {
      assert.equal((await checkSite(byName('Roblox'), 'Roblox')).state, 'found');
      assert.equal((await checkSite(byName('Roblox'), uniqueMissing())).state, 'free');
    }
  }
];

// Доступность проверяется для каждого провайдера отдельно: падение GitHub больше
// не скрывает регрессии во всех остальных контрактах.
const availability = await Promise.all(liveContracts.map(contract =>
  (typeof contract.health === 'function' ? contract.health() : fetch(contract.health, { signal: AbortSignal.timeout(2500) }))
    .then(r => r.ok).catch(() => false)
));
let liveCount = 0;
for (let i = 0; i < liveContracts.length; i++) {
  if (!availability[i]) continue;
  await liveContracts[i].verify();
  liveCount++;
}
console.log(liveCount
  ? `live · ${liveCount}/${liveContracts.length} automatic contracts`
  : '⚠ сеть недоступна — live-контракты пропущены; локальные контракты выполнены');

console.log(`ok · ${sites.length} sources · ${scanSites.length} automatic · ${manualSites.length} manual`);
