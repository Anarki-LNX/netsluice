/* NetSluice website demo: answers every request of the device interface in the browser.
 *
 * A port of scripts/demo.py from the NetSluice repository. Everything shown is
 * invented: the household, its devices and where they talk to. Switches answer
 * but change nothing. This file is loaded before app.js and replaces fetch for
 * /api/*, /control/* and /auth/*, so the interface never sends a request for
 * them: not to this website, not to a device, not anywhere.
 *
 * Where demo.py pretends an action outside the interface worked (password,
 * wiping the log, test message, backup/install/restore, power off, system and
 * NetSluice updates, device name), the demo answers "not available in the demo".
 */
(function () {
  'use strict';
  // filled in by sync-demo.mjs with the product's VERSION
  const DEMO_VERSION = '__NETSLUICE_VERSION__';

  // ---------------------------------------------------------------- language
  var DEMO_TEXT = {
    en: {
      banner: 'Demo · invented data — nothing here is a real network',
      back: 'Back to the website',
      na: 'Not available in the demo',
      link: 'Downloads are not available in the demo.',
    },
    de: {
      banner: 'Demo · erfundene Daten – nichts hier ist ein echtes Netzwerk',
      back: 'Zurück zur Website',
      na: 'In der Demo nicht verfügbar',
      link: 'Downloads sind in der Demo nicht verfügbar.',
    },
  };
  function startLang() {
    var q = null;
    try {
      q = new URLSearchParams(location.search).get('lang');
    } catch (e) {
      /* old browser */
    }
    if (q === 'en' || q === 'de') return q;
    try {
      var s = localStorage.getItem('netsluice.lang');
      if (s === 'en' || s === 'de') return s;
    } catch (e) {
      /* private mode */
    }
    return (navigator.language || 'en').toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }
  // The interface writes its language to <html lang> (applyLang); before that, use the same rule it uses.
  function lang() {
    var l = document.documentElement.getAttribute('lang');
    return l === 'de' || l === 'en' ? (document.documentElement.dataset.demoReady ? l : startLang()) : startLang();
  }
  function txt(key) {
    return DEMO_TEXT[lang()][key];
  }

  // ---------------------------------------------------------------- invented household (same as demo.py)
  var T0 = Date.now() / 1000;
  var DEVICES = [
    // ip, name, kind, vendor, model, firmware, mac, weight
    ['192.168.0.21', 'living-room-tv', 'tv', 'LG Electronics', 'OLED55C3', '23.20.56', '02:00:5e:10:00:21', 30],
    ['192.168.0.34', 'annas-laptop', 'computer', 'Intel Corporate', null, null, '02:00:5e:10:00:34', 24],
    ['192.168.0.40', 'Pixel-8', 'phone', null, null, null, '02:00:5e:10:00:40', 17],
    ['192.168.0.52', 'office-printer', 'printer', 'Brother Industries', 'MFC-L3750CDW', '1.42', '02:00:5e:10:00:52', 3],
    ['192.168.0.60', 'robot-vacuum', 'iot', 'Espressif Inc.', null, null, '02:00:5e:10:00:60', 9],
    ['192.168.0.61', 'heat-pump-sensor', 'iot', 'Shelly', 'S1PMG4', '2.1.0', '02:00:5e:10:00:61', 5],
    ['192.168.0.70', 'kitchen-speaker', 'speaker', 'Amazon Technologies Inc.', null, null, '02:00:5e:10:00:70', 8],
    ['192.168.0.81', 'toms-tablet', 'tablet', null, null, null, '02:00:5e:10:00:81', 4],
  ];
  var COUNTRIES = [
    ['US', 38, 0.22],
    ['DE', 30, 0.04],
    ['IE', 12, 0.02],
    ['NL', 9, 0.03],
    ['KR', 6, 0.7],
    ['SG', 4, 0.8],
    ['JP', 5, 0.05],
    ['GB', 6, 0.1],
    ['BR', 2, 0.9],
    ['CA', 4, 0],
    ['FR', 5, 0.05],
    ['CN', 3, 0.6],
  ];
  var BLOCKED = [
    'telemetry.smart-tv.example',
    'ads.video-network.example',
    'metrics.app-analytics.example',
    'tracker.shop-widgets.example',
    'logs.robot-cloud.example',
    'pixel.social-button.example',
  ];
  var LISTS = [
    ['AdGuard DNS filter', 'https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt', 191933],
    ['HaGeZi Pro', 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.txt', 243739],
    [
      'HaGeZi Threat Intelligence (medium)',
      'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.medium.txt',
      384158,
    ],
    ['Smart-TV blocklist', 'https://raw.githubusercontent.com/Perflyst/PiHoleBlocklist/master/SmartTV-AGH.txt', 163],
  ];
  var HOURS = [30, 34, 38, 40, 46, 58, 74, 92, 100, 88, 60, 36, 18, 10, 8, 7, 9, 16, 30, 44, 40, 36, 34, 32];
  var OKHOSTS = [
    'www.example.org',
    'api.weather.example',
    'time.device.example',
    'cdn.video.example',
    'mail.example.net',
    'updates.vendor.example',
    'img.shop.example',
  ];

  function wall() {
    return Date.now() / 1000;
  }
  function now() {
    return wall() - T0;
  }
  function int(x) {
    return Math.trunc(x);
  }
  function sum(a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return s;
  }

  // A small seeded generator standing in for Python's random.Random(seed).
  function seeded(seed) {
    var h = 2166136261 >>> 0,
      s = String(seed);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    var a = h || 1;
    var r = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      random: r,
      choice: function (arr) {
        return arr[Math.floor(r() * arr.length)];
      },
    };
  }
  function weighted(list, w) {
    var p = [];
    list.forEach(function (x) {
      for (var i = 0; i < x[w]; i++) p.push(x);
    });
    return p;
  }
  var DEVICE_POOL = weighted(DEVICES, 7);
  var COUNTRY_POOL = weighted(COUNTRIES, 1);
  function isoSec(t) {
    return new Date(t * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  function param(query, name) {
    try {
      return new URLSearchParams(query).get(name);
    } catch (e) {
      return null;
    }
  }
  function sinceOf(query) {
    var s = param(query, 'since');
    return s && /^\d+$/.test(s) ? parseInt(s, 10) : 0;
  }

  function stats() {
    var q = 18400 + int(now() * 7.5),
      b = 3100 + int(now() * 1.4);
    var tot = sum(
      DEVICES.map(function (d) {
        return d[7];
      }),
    );
    return {
      time_units: 'hours',
      num_dns_queries: q,
      num_blocked_filtering: b,
      avg_processing_time: 0.012,
      dns_queries: HOURS.map(function (h) {
        return h * 9;
      }),
      blocked_filtering: HOURS.map(function (h, i) {
        return int(h * 9 * (0.12 + (i % 5) * 0.02));
      }),
      top_clients: DEVICES.slice()
        .sort(function (a, b) {
          return b[7] - a[7];
        })
        .map(function (d) {
          var o = {};
          o[d[0]] = int((q * d[7]) / tot);
          return o;
        }),
      top_blocked_domains: BLOCKED.map(function (h, i) {
        var o = {};
        o[h] = 420 - i * 55;
        return o;
      }),
      top_queried_domains: [],
    };
  }

  function geo(since) {
    var seq = int(now() * 3.2),
      ev = [];
    for (var n = Math.max(since + 1, seq - 40); n <= seq; n++) {
      var c = seeded(n).choice(COUNTRY_POOL);
      ev.push({ seq: n, cc: c[0], blocked: seeded(n * 7).random() < c[2], host: '', client: '' });
    }
    var countries = {};
    COUNTRIES.forEach(function (c) {
      countries[c[0]] = [int(c[1] * 40 * (1 - c[2])), int(c[1] * 40 * c[2])];
    });
    return { home: { cc: 'DE' }, seq: seq, events: ev, countries: countries };
  }

  var REFRESH = { before: wall() - 90000, at: wall() - 3600 }; // when the lists were last refreshed
  var HTTPS = { on: false, until: 0 };
  var OFF = { until: 0 }; // the filter switch in the top bar: off until this time
  var FINGERPRINT = 'A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90';

  function deviceDay(ip) {
    var d =
      DEVICES.filter(function (x) {
        return x[0] === ip;
      })[0] || DEVICES[0];
    var r = seeded(ip),
      share = ['tv', 'speaker', 'iot'].indexOf(d[2]) >= 0 ? 0.45 : 0.12;
    var hours = HOURS.map(function (h) {
      return [int(h * d[7] * 0.5 * (1 - share)), int(h * d[7] * 0.5 * share)];
    });
    var total = sum(
        hours.map(function (x) {
          return x[0] + x[1];
        }),
      ),
      no = sum(
        hours.map(function (x) {
          return x[1];
        }),
      );
    var t = int(wall()),
      recent = [];
    for (var i = 0; i < 240; i++) {
      recent.push({
        t: t - i * 23,
        host: i % 4 === 0 ? r.choice(BLOCKED) : r.choice(OKHOSTS),
        type: ['A', 'AAAA', 'HTTPS'][i % 3],
        blocked: i % 4 === 0,
        by: i % 4 === 0 ? LISTS[i % 2][0] : '',
      });
    }
    var wb = [0.34, 0.22, 0.16, 0.12, 0.09, 0.07],
      wo = [0.3, 0.2, 0.15, 0.12, 0.1, 0.08, 0.05];
    return {
      ip: ip,
      total: total,
      blocked: no,
      hosts: 41,
      cached: int(total * 0.31),
      avg_ms: 18.4,
      first_hour: Math.floor(wall() / 3600) - 23,
      hours: hours,
      top_blocked: BLOCKED.map(function (h, i) {
        return [h, int(no * wb[i])];
      }),
      top_passed: OKHOSTS.map(function (h, i) {
        return [h, int((total - no) * wo[i])];
      }),
      lists: [
        [LISTS[0][0], int(no * 0.7)],
        [LISTS[1][0], int(no * 0.25)],
        ['', int(no * 0.05)],
      ],
      types: [
        ['A', int(total * 0.5)],
        ['AAAA', int(total * 0.3)],
        ['HTTPS', int(total * 0.2)],
      ],
      complete: true,
      since: int(wall()) - 86000,
      recent: recent,
    };
  }

  function flow(since) {
    var seq = int(now() * 3.4),
      ev = [];
    for (var n = Math.max(since + 1, seq - 30); n <= seq; n++) {
      var r = seeded(n),
        d = r.choice(DEVICE_POOL),
        bad = r.random() < (['tv', 'speaker', 'iot'].indexOf(d[2]) >= 0 ? 0.45 : 0.12);
      ev.push({ seq: n, client: d[0], blocked: bad, host: bad ? r.choice(BLOCKED) : '' });
    }
    return { seq: seq, events: ev };
  }

  var SETTINGS = {
    led: { mode: 'night', flash: true, night_from: '22:00', night_to: '07:00' },
    button: true,
    notify: { kind: 'ntfy', url: 'https://ntfy.sh/your-topic', newdev: true, malware: true, down: true },
    hardware: { leds: true, button: true },
    ok: true,
  };

  function storageState() {
    return {
      where: 'card',
      running: false,
      job: null,
      free: 52 * Math.pow(2, 30),
      room: true,
      fits: true,
      internal: { size: 7818182656, holds: 'original' },
      backup: {
        created: int(wall()) - 900,
        size: 7818182656,
        packed: 6442450944,
        holds: 'original',
        sha256: '3f1c9a7e52b08d44aa10c7e9b6f2d8315c0e4b7a9d2f6c1e8b3a5d7f0c2e4a6b',
      },
    };
  }

  function systemState() {
    return {
      net: { hostname: 'netsluice', fixed: ['192.168.0.2/24'], dhcp: ['192.168.0.117'], trial: null },
      updates: {
        pending: [],
        held: ['linux-image-current-rockchip64'],
        auto: true,
        checked: int(wall()) - 3600,
        running: false,
      },
      app: {
        version: DEMO_VERSION,
        latest: { tag: 'v' + DEMO_VERSION, version: DEMO_VERSION },
        checked: int(wall()) - 600,
        available: false,
        running: false,
        auto: true,
        last: { result: 'ok', from: '0.1.0', to: '0.1.1', done: int(wall()) - 86400 },
      },
    };
  }

  // The answer for a GET (and for a POST/PUT once its side effect, if any, is done), like reply_for in demo.py.
  function replyFor(path, query) {
    if (path === '/auth/state') return { configured: true, authenticated: true };
    if (path === '/control/stats') return stats();
    if (path === '/control/status') {
      var off = OFF.until;
      return {
        version: 'v1.0.0',
        dns_port: 53,
        protection_enabled: wall() >= off,
        protection_disabled_duration: off < 9e12 ? int(Math.max(0, off - wall()) * 1000) : 0,
        dns_addresses: ['192.168.0.2'],
        start_time: (T0 - 86400 * 12) * 1000,
      };
    }
    if (path === '/control/clients') return { clients: null, auto_clients: [] };
    if (path === '/control/querylog') {
      var t = wall(),
        data = [];
      // like the real log: one lookup shows up as three requests (A, AAAA, HTTPS)
      for (var i = 0; i < 8; i++) {
        ['A', 'AAAA', 'HTTPS'].forEach(function (kind) {
          data.push({
            question: { name: BLOCKED[(i + int(now() / 4)) % BLOCKED.length], type: kind },
            client: DEVICES[(i * 3 + int(now() / 4)) % DEVICES.length][0],
            time: new Date((t - i * 37) * 1000).toISOString(),
          });
        });
      }
      return { data: data };
    }
    if (path === '/control/filtering/status') {
      return {
        enabled: true,
        filters: LISTS.map(function (l, i) {
          var at = REFRESH.at + i * 0.8;
          return {
            id: i + 1,
            name: l[0],
            url: l[1],
            rules_count: l[2],
            enabled: true,
            last_updated: isoSec(wall() >= at ? at : REFRESH.before + i),
          };
        }),
      };
    }
    if (path === '/control/dns_info')
      return { upstream_dns: ['https://dns.quad9.net/dns-query'], bootstrap_dns: ['9.9.9.9'], dnssec_enabled: true };
    if (path === '/control/querylog/config')
      return { enabled: true, interval: 604800000, anonymize_client_ip: false, ignored: [], ignored_enabled: false };
    if (path === '/api/system/https')
      return {
        on: HTTPS.on,
        busy: wall() < HTTPS.until,
        error: null,
        ca: HTTPS.on,
        fingerprint: HTTPS.on ? FINGERPRINT : null,
      };
    // the website shows the current release as installed and up to date (demo.py still says 0.1.7 → 0.1.8)
    if (path === '/api/system/app/hint') return { version: DEMO_VERSION, latest: null };
    if (path === '/api/devices') {
      var devices = {},
        blocked = {};
      DEVICES.forEach(function (d, k) {
        devices[d[0]] = {
          name: d[1],
          kind: d[2],
          vendor: d[3],
          model: d[4],
          firmware: d[5],
          mac: d[6],
          private: d[3] === null,
          source: 'router',
          services: [],
        };
        blocked[d[0]] = (k * 137 + int(now() / 3) * (k % 3)) % 900;
      });
      return { devices: devices, blocked: blocked };
    }
    if (path === '/api/device') return deviceDay(param(query, 'ip') || '');
    if (path === '/api/flow') return flow(sinceOf(query));
    if (path === '/api/geo') return geo(sinceOf(query));
    if (path.indexOf('/api/kids') === 0) {
      var hour = new Date().getHours();
      return {
        rules: {
          '02:00:5e:10:00:81': {
            name: 'toms-tablet',
            mode: 'schedule',
            days: [0, 1, 2, 3, 4],
            from: '15:00',
            to: '19:00',
            until: 0,
            blocked: !(hour >= 15 && hour < 19),
          },
          '02:00:5e:10:00:40': {
            name: 'Pixel-8',
            mode: 'on',
            days: [0, 1, 2, 3, 4, 5, 6],
            from: '15:00',
            to: '19:00',
            until: 0,
            blocked: false,
          },
        },
      };
    }
    if (path.indexOf('/api/settings') === 0) return JSON.parse(JSON.stringify(SETTINGS));
    if (path.indexOf('/api/storage/progress') === 0) return {};
    if (path.indexOf('/api/storage') === 0) return storageState();
    if (path.indexOf('/api/system') === 0) return systemState();
    if (path.indexOf('/control/') === 0 || path.indexOf('/auth/') === 0) return { ok: true };
    return null;
  }

  // ---------------------------------------------------------------- answers
  function respond(body, status, type) {
    var text = typeof body === 'string' ? body : JSON.stringify(body);
    return new Response(text, {
      status: status || 200,
      headers: {
        'Content-Type': type || (typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json'),
        'Cache-Control': 'no-store',
      },
    });
  }
  function wait(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }
  function notAvailable(json) {
    return json ? respond({ ok: false, error: txt('na') }, 403) : respond(txt('na'), 403);
  }
  // After the interface wrote its own (wrong) message, show the demo's instead.
  function sayLater(id) {
    setTimeout(function () {
      var n = document.getElementById(id);
      if (n) {
        n.className = 'note bad';
        n.textContent = txt('na');
      }
    }, 60);
  }

  // Actions that would leave the interface: answered with "not available" instead of demo.py's "ok".
  var UNAVAILABLE_JSON = {
    '/api/storage/backup': 1,
    '/api/storage/backup/delete': 1,
    '/api/storage/install': 1,
    '/api/storage/restore': 1,
    '/api/storage/poweroff': 1,
    '/api/system/hostname': 1,
    '/api/system/updates/run': 1,
    '/api/system/app/run': 1,
  };
  var UNAVAILABLE_TEXT = { '/control/querylog_clear': 1, '/control/stats_reset': 1 };

  async function handle(method, path, query, bodyText) {
    var body = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch (e) {
      body = {};
    }
    await wait(25 + Math.random() * 60); // a little like a real network
    if (method === 'GET' || method === 'HEAD') {
      if (path === '/api/system/updates/progress' || path === '/api/system/app/progress') {
        return respond({ phase: 'failed', error: txt('na'), at: wall() });
      }
      var g = replyFor(path, query);
      return g === null ? respond({ error: txt('na') }, 404) : respond(g);
    }
    // POST and PUT, like do_POST in demo.py
    if (UNAVAILABLE_JSON[path]) return notAvailable(true);
    if (UNAVAILABLE_TEXT[path]) return notAvailable(false);
    if (path === '/auth/password') {
      sayLater('pwNote');
      return respond({ ok: false, error: 'demo' }, 403);
    }
    if (path === '/api/notify/test') return respond({ ok: false, error: txt('na') });
    if (path === '/control/test_upstream_dns') {
      var res = {};
      (body.upstream_dns || []).forEach(function (u) {
        res[String(u)] = 'OK';
      });
      return respond(res);
    }
    if (path === '/control/filtering/refresh') {
      // like the real filter: one list after the other
      REFRESH.before = REFRESH.at;
      REFRESH.at = wall();
      await wait((LISTS.length * 0.8 + 0.5) * 1000);
    }
    if (path === '/api/system/https') {
      HTTPS.on = !!body.on;
      HTTPS.until = wall() + 4;
    }
    if (path === '/control/protection') {
      if (body.enabled && body.duration) return new Response(null, { status: 400 });
      OFF.until = body.enabled ? 0 : body.duration ? wall() + body.duration / 1000 : 9e12 + 1;
    }
    var p = replyFor(path, query);
    return p === null ? respond({ error: txt('na') }, 404) : respond(p);
  }

  function mocked(url) {
    return url.origin === location.origin && /^\/(api|control|auth)\//.test(url.pathname);
  }

  // ---------------------------------------------------------------- fetch and friends
  var realFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    var req = input instanceof Request ? input : null;
    var url = new URL(req ? req.url : String(input), location.href);
    if (!mocked(url)) return realFetch(input, init);
    var method = ((init && init.method) || (req && req.method) || 'GET').toUpperCase();
    var bodyText = init && typeof init.body === 'string' ? init.body : req ? await req.clone().text() : '';
    return handle(method, url.pathname, url.search.replace(/^\?/, ''), bodyText);
  };
  // The interface does not use these; they are closed for the demo paths anyway.
  if (window.XMLHttpRequest) {
    var open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u) {
      if (mocked(new URL(String(u), location.href))) throw new Error('NetSluice demo: use fetch');
      return open.apply(this, arguments);
    };
  }
  if (navigator.sendBeacon)
    navigator.sendBeacon = function () {
      return false;
    };
  if (window.EventSource) {
    var ES = window.EventSource;
    window.EventSource = function (u, o) {
      if (mocked(new URL(String(u), location.href))) throw new Error('NetSluice demo: no live stream');
      return new ES(u, o);
    };
  }

  // ---------------------------------------------------------------- banner and links
  function toast(text) {
    var n = document.getElementById('demoToast');
    if (!n) return;
    n.textContent = text;
    n.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      n.hidden = true;
    }, 4000);
  }
  // Links to device files (backup download, root certificate) would leave the demo.
  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var u;
      try {
        u = new URL(a.getAttribute('href'), location.href);
      } catch (err) {
        return;
      }
      if (mocked(u)) {
        e.preventDefault();
        e.stopPropagation();
        toast(txt('link'));
      }
    },
    true,
  );

  function paintBanner() {
    var l = lang(),
      b = document.getElementById('demoBanner');
    if (!b) return;
    b.querySelector('.demo-text').textContent = DEMO_TEXT[l].banner;
    var back = b.querySelector('.demo-back');
    back.textContent = DEMO_TEXT[l].back;
    back.setAttribute('href', '/' + l + '/demo/');
  }
  document.addEventListener('DOMContentLoaded', function () {
    paintBanner();
    // the interface sets <html lang> when it starts and when its language button is pressed
    new MutationObserver(function () {
      document.documentElement.dataset.demoReady = '1';
      paintBanner();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  });
})();
