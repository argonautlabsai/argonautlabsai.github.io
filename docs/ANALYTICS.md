# Website analytics

The website measures consenting visitors with Google Analytics 4. The shared implementation is in `assets/analytics.js`; every public HTML page loads it and offers a Privacy link and Analytics preferences control. The Google measurement ID is public configuration, not an API secret.

## Private reporting

Keep reports accessible only to the website owner's Google account. Before enabling live collection, verify both account-level and property-level access, including inherited permissions. Do not place this property in an account shared with unrelated users. Do not enable public dashboards, publish report exports, or add visitor-level records to this public repository. Any later sharing requires the owner's explicit instruction.

The public Google measurement ID permits the site to send events; it does not grant permission to read analytics reports. Google processes the collected analytics as the service provider. Owner-only reporting does not mean that Google has no access to the data it processes.

## What to read

| Question | Report / metric |
| --- | --- |
| How many visitors came each day? | A daily report with **Total users**. A visitor is a browser-based analytics identity, not a verified person. Do not sum daily unique counts to claim a multi-day unique total. |
| Where did they come from? | **Traffic acquisition**, using **Session source / medium** and **Session default channel group**. Country reporting is approximate. |
| Which articles attract readers? | **Pages and screens**, using page path, views and total users. |
| How many click through to GitHub? | Event name **github_click**, metric **Event count**; use **Total users** for distinct analytics users who clicked. |
| Which repository and link worked? | Break down `github_click` by the event-scoped dimensions below. |
| Is collection working now? | **Realtime**. A deliberate verification visit and click will appear in the launch-day totals; do not represent these as organic traffic. |

Use the same date range and reporting timezone when comparing reports. Set the Argonaut Labs property timezone to **Europe/London**. Search Console reports search exposure/clicks, not all site visitors, and its dates can use a different timezone.

## Event schema

`page_view` is sent once per full page load after opt-in. Enhanced measurement must be disabled on the web stream so it cannot add duplicate page views or collect unsanitised automatic outbound/form events.

`github_click` measures outbound clicks to these repositories, and to the Argonaut Labs organisation profile:

- `argodrive-ds4-kimi-k3.1`
- `ds4-argodrive`
- `deltafin`
- `argodrive`

Create event-scoped custom dimensions in GA4 for:

| Display name | Event parameter | Values |
| --- | --- | --- |
| GitHub repository | `repository` | Repository name, or `organisation` |
| GitHub destination type | `link_kind` | `repository`, `source`, `release`, `download`, `community`, `organisation` |
| Website link placement | `placement` | `hero`, `projects`, `navigation`, `content`, `footer` |
| Source page | `source_page` | Canonical page path without query or fragment |

`link_url` is limited to the repository root, even when the actual link opens a source file or download. Outbound links to upstream projects do not count as Argonaut repository conversions. Clicking a download link is **not** proof of a successful download. None of these events measures subsequent GitHub stars, clones, installations or inference runs.

For a repository report, filter event name to `github_click`, put GitHub repository in rows, and show Event count and Total users. Optionally mark `github_click` as a key event, counting once per event. Keep ordinary click counts separate from the percentage of sessions that include a click.

## Collection boundaries

- Basic consent: no Google tag or measurement requests until affirmative opt-in; analytics and advertising are separate, and advertising remains disabled.
- No Google Signals or advertising personalisation. Disable enhanced measurement and user-provided data collection in the property/stream too.
- Keep optional account data-sharing off. Granular city/device collection is disabled; country and region reporting remains available.
- Choice is stored locally for 180 days. Analytics cookies expire after 180 days without automatic expiry refresh.
- Global Privacy Control and Do Not Track keep measurement off. A withdrawal removes analytics cookies and reloads to unload the Google code; it also propagates to other open tabs.
- Send canonical page URLs, not incoming query strings or fragments. Referrers are reduced to origins. Campaign query values are not added by our code.
- No form data, prompts, personal email fields, login IDs or local computer paths are collected by our events.
- Only the production `argonautlabs.ai` hostname can load Google Analytics. Local preview visits cannot pollute the property.
- Counts exclude people who decline or block tracking, and cannot reconstruct visits from before installation.

## Verification

Run `node tests/analytics.test.cjs`. The checks cover no transmission before consent, one page view, URL sanitisation, repository allowlisting, modified-click navigation, withdrawal, privacy signals, expired preferences, unavailable storage and local-preview isolation.

Before release, also check the preference panel on desktop/mobile, confirm existing benchmark tables and research JSON are unchanged, verify the production measurement ID and web-stream settings, and confirm a real page view plus a `github_click` in GA4 Realtime. Standard reports and custom dimensions may take time to populate after collection starts.
