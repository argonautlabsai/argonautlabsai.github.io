/* Argonaut Labs: opt-in, advertising-free Google Analytics measurement. */
(function () {
  'use strict';

  const MEASUREMENT_ID = 'G-DTKC9N2LV7'; // Public stream identifier; grants no access to reports.
  const SITE = 'https://argonautlabs.ai';
  const KEY = 'argonaut.analytics-choice.v1';
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const REPOS = new Set(['argodrive', 'argodrive-ds4-kimi-k3.1', 'ds4-argodrive', 'deltafin']);
  const production = location.hostname === 'argonautlabs.ai';
  const browserOptOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  let enabled = false;
  let initialized = false;
  let ready = false;
  let returnFocus;

  function storedChoice() {
    try {
      const record = JSON.parse(localStorage.getItem(KEY));
      if (record && typeof record.allowed === 'boolean' && Number.isFinite(record.at) &&
          record.at <= Date.now() && Date.now() - record.at < MAX_AGE) return record.allowed;
    } catch (_) { /* Storage may be unavailable; keep analytics off until a choice. */ }
    return null;
  }

  function pageURL() {
    const canonical = document.querySelector('link[rel="canonical"]');
    try {
      const url = new URL(canonical ? canonical.href : '/', SITE);
      return SITE + (url.origin === SITE ? url.pathname : '/');
    } catch (_) { return SITE + '/'; }
  }

  function referrerOrigin() {
    try {
      const url = new URL(document.referrer);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin + '/' : '';
    } catch (_) { return ''; }
  }

  function removeAnalyticsCookies() {
    document.cookie.split(';').forEach(function (part) {
      const name = part.trim().split('=')[0];
      if (name !== '_ga' && !name.startsWith('_ga_')) return;
      ['', '; Domain=argonautlabs.ai', '; Domain=.argonautlabs.ai'].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; Path=/' + domain + '; SameSite=Lax; Secure';
      });
    });
  }

  function start() {
    if (initialized || browserOptOut || !production || !/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)) return;
    enabled = true;
    initialized = true;
    window['ga-disable-' + MEASUREMENT_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
      page_location: pageURL(),
      page_referrer: referrerOrigin(),
      page_title: document.title,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: 'argonautlabs.ai',
      cookie_expires: MAX_AGE / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure'
    });
    window.gtag('event', 'page_view', { send_to: MEASUREMENT_ID });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    tag.onload = function () { ready = true; };
    document.head.appendChild(tag);
  }

  function stop() {
    enabled = false;
    window['ga-disable-' + MEASUREMENT_ID] = true;
    removeAnalyticsCookies();
    if (initialized) {
      // Discard queued events and unload Google code. No denied-consent pings.
      if (window.dataLayer) window.dataLayer.length = 0;
      location.reload();
    }
  }

  const panel = document.createElement('section');
  panel.className = 'al-analytics-choice';
  panel.setAttribute('aria-label', 'Analytics preferences');
  panel.hidden = true;
  panel.innerHTML = '<div><strong id="al-analytics-heading" tabindex="-1">Help us improve the lab.</strong>' +
    '<p>Allow Google Analytics to measure visits, referral sources and clicks to our GitHub projects? ' +
    'Analytics is optional. No advertising features.</p>' +
    '<a href="/privacy.html">How we use analytics</a></div>' +
    '<div class="al-analytics-actions"><button type="button" data-choice="no">Decline analytics</button>' +
    '<button type="button" data-choice="yes">Allow analytics</button></div>';
  document.body.appendChild(panel);
  const allow = panel.querySelector('[data-choice="yes"]');
  if (browserOptOut) {
    allow.disabled = true;
    panel.querySelector('p').textContent = 'Your browser requests privacy protection. Analytics stays off. No analytics data is sent to Google.';
  }

  function showPreferences() {
    returnFocus = document.activeElement;
    panel.hidden = false;
    panel.querySelector('strong').focus();
  }

  function choose(allowed) {
    allowed = allowed && !browserOptOut;
    try { localStorage.setItem(KEY, JSON.stringify({ allowed: allowed, at: Date.now() })); } catch (_) {}
    panel.hidden = true;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    if (allowed) start(); else stop();
  }

  panel.querySelector('[data-choice="no"]').addEventListener('click', function () { choose(false); });
  allow.addEventListener('click', function () { choose(true); });
  document.querySelectorAll('[data-analytics-settings]').forEach(function (button) {
    button.addEventListener('click', showPreferences);
  });

  function destination(anchor) {
    try {
      const url = new URL(anchor.href, SITE);
      const parts = url.pathname.split('/').filter(Boolean);
      if (url.protocol !== 'https:' || url.hostname !== 'github.com' ||
          parts[0] !== 'argonautlabsai' || (parts[1] && !REPOS.has(parts[1]))) return null;
      let kind = 'repository';
      if (!parts[1]) kind = 'organisation';
      else if (parts[2] === 'releases') kind = parts[3] === 'download' ? 'download' : 'release';
      else if (['issues', 'discussions', 'pulls'].includes(parts[2])) kind = 'community';
      else if (['blob', 'tree'].includes(parts[2])) kind = 'source';
      return { repository: parts[1] || 'organisation', link_kind: kind,
        link_url: 'https://github.com/argonautlabsai' + (parts[1] ? '/' + parts[1] : '') };
    } catch (_) { return null; }
  }

  function trackClick(event) {
    if (!enabled || event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const anchor = event.target.closest && event.target.closest('a[href]');
    const info = anchor && destination(anchor);
    if (!info) return;
    info.send_to = MEASUREMENT_ID;
    info.source_page = new URL(pageURL()).pathname;
    info.placement = anchor.closest('footer') ? 'footer' : anchor.closest('#overview') ? 'hero' :
      anchor.closest('#projects') ? 'projects' : anchor.closest('nav,header') ? 'navigation' : 'content';
    // Preserve modified clicks, new tabs and downloads. Bound any same-tab delay.
    if (ready && event.type === 'click' && event.button === 0 && !event.metaKey && !event.ctrlKey &&
        !event.shiftKey && !event.altKey && !anchor.hasAttribute('download') &&
        (!anchor.target || anchor.target === '_self')) {
      event.preventDefault();
      let followed = false;
      const follow = function () { if (!followed) { followed = true; location.assign(anchor.href); } };
      info.event_callback = follow;
      info.event_timeout = 180;
      setTimeout(follow, 200);
    }
    window.gtag('event', 'github_click', info);
  }
  document.addEventListener('click', trackClick);
  document.addEventListener('auxclick', trackClick);
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY) return;
    if (storedChoice() === true && !browserOptOut) { panel.hidden = true; start(); }
    else { panel.hidden = storedChoice() === false || browserOptOut; stop(); }
  });

  const choice = storedChoice();
  if (browserOptOut || choice === false) stop();
  else if (choice === true) start();
  else panel.hidden = false;
}());
