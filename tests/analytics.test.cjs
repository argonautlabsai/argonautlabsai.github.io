'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/analytics.js'), 'utf8')
  .replace(/const MEASUREMENT_ID = '[^']*';/, "const MEASUREMENT_ID = 'G-TEST123';");
const KEY = 'argonaut.analytics-choice.v1';
const results = [];

function boot(options = {}) {
  const handlers = {}, windowHandlers = {}, scripts = [], navigations = [], timers = [], cookieWrites = [];
  const stored = new Map();
  if ('choice' in options) stored.set(KEY, JSON.stringify({ allowed: options.choice, at: options.at || Date.now() }));
  const control = () => ({ handlers: {}, isConnected: true, focus() {}, addEventListener(k, f) { this.handlers[k] = f; } });
  const yes = control(), no = control(), settings = control(), heading = control(), paragraph = {};
  const panel = { setAttribute() {}, querySelector(s) {
    return { '[data-choice="yes"]': yes, '[data-choice="no"]': no, strong: heading, p: paragraph }[s];
  } };
  const document = {
    title: 'Run Kimi K3.1 Pro on one GPU — Argonaut Labs',
    referrer: options.referrer || '', activeElement: settings,
    querySelector() { return { href: 'https://argonautlabs.ai/research/kimi-k31-single-gpu.html?private=value#fragment' }; },
    querySelectorAll() { return [settings]; },
    createElement(tag) { return tag === 'section' ? panel : {}; },
    head: { appendChild(s) { scripts.push(s); } }, body: { appendChild() {} },
    addEventListener(k, f) { handlers[k] = f; }
  };
  Object.defineProperty(document, 'cookie', { get: () => '_ga=123; _ga_TEST123=456; unrelated=keep', set: v => cookieWrites.push(v) });
  const location = { hostname: options.hostname || 'argonautlabs.ai', assign(url) { navigations.push(url); }, reload() { navigations.push('RELOAD'); } };
  const window = { addEventListener(k, f) { windowHandlers[k] = f; } };
  const localStorage = { getItem(k) { if (options.blockStorage) throw Error('blocked'); return stored.get(k) || null; },
    setItem(k, v) { if (options.blockStorage) throw Error('blocked'); stored.set(k, v); } };
  vm.runInNewContext(source, { document, location, window, localStorage, navigator: options.navigator || {},
    URL, Date, Set, JSON, Number, setTimeout(f) { timers.push(f); } });
  return { document, window, panel, scripts, navigations, timers, cookieWrites, stored, windowHandlers,
    choose(allow) { (allow ? yes : no).handlers.click(); },
    preferences() { settings.handlers.click(); },
    events(name) { return (window.dataLayer || []).map(x => Array.from(x)).filter(x => x[0] === 'event' && (!name || x[1] === name)); },
    click(url, opts = {}) {
      const anchor = { href: url, target: opts.target || '', hasAttribute: k => k === 'download' && opts.download,
        closest: s => s === '#overview' && opts.hero ? {} : null };
      const event = { type: opts.type || 'click', button: opts.button || 0, ...opts,
        target: { closest: () => anchor }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      handlers[event.type](event); return event;
    }
  };
}
function test(name, fn) { fn(); results.push(name); }

test('No Google script or events before consent; decline persists and leaves other cookies alone', () => {
  const x = boot(); assert.equal(x.panel.hidden, false); assert.equal(x.scripts.length, 0);
  x.click('https://github.com/argonautlabsai/deltafin'); assert.equal(x.events().length, 0);
  x.choose(false); assert.equal(x.panel.hidden, true); assert.equal(x.scripts.length, 0);
  assert.equal(JSON.parse(x.stored.get(KEY)).allowed, false);
  assert.ok(x.cookieWrites.every(v => !v.startsWith('unrelated=')));
});
test('Opt-in loads once and records one page view without ads', () => {
  const x = boot(); x.choose(true); x.choose(true);
  assert.equal(x.scripts.length, 1); assert.equal(x.events('page_view').length, 1);
  const config = x.window.dataLayer.find(v => v[0] === 'config')[2];
  assert.equal(config.send_page_view, false); assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  const consent = x.window.dataLayer.find(v => v[0] === 'consent' && v[1] === 'default')[2];
  assert.equal(consent.ad_storage, 'denied'); assert.equal(consent.ad_user_data, 'denied');
});
test('Page addresses and referral URLs exclude sensitive query, fragment, path and userinfo', () => {
  const x = boot({ choice: true, referrer: 'https://user:password@example.org/private/path?email=secret#token' });
  const config = x.window.dataLayer.find(v => v[0] === 'config')[2];
  assert.equal(config.page_location, 'https://argonautlabs.ai/research/kimi-k31-single-gpu.html');
  assert.equal(config.page_referrer, 'https://example.org/');
});
test('Private file referrers are discarded', () => {
  const x = boot({ choice: true, referrer: 'file:///Users/private/name/report.html' });
  assert.equal(x.window.dataLayer.find(v => v[0] === 'config')[2].page_referrer, '');
});
test('GitHub clicks identify repository, page and placement without leaking full destination', () => {
  const x = boot({ choice: true });
  x.click('https://github.com/argonautlabsai/argodrive/releases/download/v1/a.zip?private=value#secret', { hero: true });
  const e = x.events('github_click')[0][2];
  assert.equal(e.repository, 'argodrive'); assert.equal(e.link_kind, 'download'); assert.equal(e.placement, 'hero');
  assert.equal(e.link_url, 'https://github.com/argonautlabsai/argodrive');
  assert.equal(e.source_page, '/research/kimi-k31-single-gpu.html');
});
test('Upstream, unrelated and lookalike links never count as our GitHub conversions', () => {
  const x = boot({ choice: true });
  ['https://github.com/antirez/ds4', 'https://github.com.evil.test/argonautlabsai/deltafin',
    'https://github.com/argonautlabsai/unlisted', 'http://github.com/argonautlabsai/deltafin'].forEach(u => x.click(u));
  assert.equal(x.events('github_click').length, 0);
});
test('All four product repositories are tracked', () => {
  const x = boot({ choice: true });
  ['argodrive', 'argodrive-ds4-kimi-k3.1', 'ds4-argodrive', 'deltafin'].forEach(r => x.click('https://github.com/argonautlabsai/' + r));
  assert.equal(x.events('github_click').length, 4);
});
test('Same-tab navigation has a bounded fallback and cannot fire twice', () => {
  const x = boot({ choice: true }); x.scripts[0].onload();
  const e = x.click('https://github.com/argonautlabsai/deltafin'); assert.equal(e.defaultPrevented, true);
  const payload = x.events('github_click')[0][2];
  assert.equal(payload.event_timeout, 180); x.timers[0](); payload.event_callback();
  assert.equal(x.navigations.length, 1);
});
test('Middle, modified, download and new-tab clicks keep native navigation', () => {
  const x = boot({ choice: true }); x.scripts[0].onload();
  [{ type: 'auxclick', button: 1 }, { ctrlKey: true }, { metaKey: true }, { target: '_blank' }, { download: true }]
    .forEach(o => assert.equal(x.click('https://github.com/argonautlabsai/deltafin', o).defaultPrevented, false));
  assert.equal(x.events('github_click').length, 5); assert.equal(x.timers.length, 0);
});
test('Revoking consent disables tracking, expires analytics cookies and unloads the tag', () => {
  const x = boot({ choice: true }); x.choose(false);
  assert.equal(x.window['ga-disable-G-TEST123'], true); assert.equal(x.navigations[0], 'RELOAD');
  x.click('https://github.com/argonautlabsai/deltafin'); assert.equal(x.events().length, 0);
  assert.ok(x.cookieWrites.some(v => v.startsWith('_ga=; Max-Age=0')));
});
test('Global Privacy Control and Do Not Track override a stored opt-in', () => {
  [{ globalPrivacyControl: true }, { doNotTrack: '1' }].forEach(n => {
    const x = boot({ choice: true, navigator: n }); assert.equal(x.scripts.length, 0); assert.equal(x.panel.hidden, true);
  });
});
test('Expired consent prompts again without loading Google', () => {
  const x = boot({ choice: true, at: Date.now() - 181 * 86400000 });
  assert.equal(x.panel.hidden, false); assert.equal(x.scripts.length, 0);
});
test('Unavailable storage does not break the page or silently opt in', () => {
  const x = boot({ blockStorage: true }); assert.equal(x.scripts.length, 0); x.choose(false); assert.equal(x.panel.hidden, true);
});
test('Local previews never send Google measurements, even after accepting', () => {
  const x = boot({ hostname: '127.0.0.1' }); x.choose(true); assert.equal(x.scripts.length, 0);
});
test('Withdrawal propagates to another open tab', () => {
  const x = boot({ choice: true }); x.stored.set(KEY, JSON.stringify({ allowed: false, at: Date.now() }));
  x.windowHandlers.storage({ key: KEY }); assert.equal(x.navigations[0], 'RELOAD');
});

module.exports = results;
if (require.main === module) console.log('PASS: ' + results.length + ' analytics checks\n' + results.join('\n'));
