// net_graph in the top bar + a Source-style dev console (open with the ` key).
(function () {
  'use strict';

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // ---------- net_graph ----------
  // fps: counted with requestAnimationFrame. ping: real time-to-first-byte of this page load.
  var graph = document.getElementById('net-graph');
  var fpsEl = graph && graph.querySelector('[data-fps]');
  var pingEl = graph && graph.querySelector('[data-ping]');
  var frames = 0, last = performance.now();

  function tick(now) {
    frames++;
    if (now - last >= 500) {
      if (fpsEl) fpsEl.textContent = Math.round(frames * 1000 / (now - last));
      frames = 0;
      last = now;
    }
    requestAnimationFrame(tick);
  }

  function setNetGraph(on) {
    if (!graph) return;
    graph.hidden = !on;
    store.set('net_graph', on ? '1' : '0');
  }

  if (graph) {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && pingEl) pingEl.textContent = Math.max(1, Math.round(nav.responseStart - nav.requestStart)) + 'ms';
    setNetGraph(store.get('net_graph') !== '0');
    requestAnimationFrame(tick);
  }

  // ---------- console ----------
  var con = document.getElementById('console');
  if (!con) return;
  var log = con.querySelector('[data-console-log]');
  var form = con.querySelector('[data-console-form]');
  var input = con.querySelector('[data-console-input]');
  var data = {};
  try { data = JSON.parse(document.getElementById('site-data').textContent); } catch (e) {}
  var history = [], historyPos = 0, greeted = false;

  function print(text, cls) {
    var p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  function go(url) { if (url) window.location.href = url; }

  var commands = {
    help: function () {
      print('help                this list');
      print('projects            list projects');
      print('connect <name>      open a project (first word is enough)');
      print('github | linkedin | itch');
      print('net_graph 0|1       hide or show the numbers in the corner');
      print('clear               clear the console');
      print('quit                close the console');
    },
    projects: function () {
      (data.projects || []).forEach(function (p) { print(p.slug + '    ' + p.title + ' (' + (p.status || 'no status') + ')'); });
    },
    connect: function (args) {
      var q = (args[0] || '').toLowerCase();
      if (!q) return print('Usage: connect <name>. Type projects to see names.', 'err');
      var hit = (data.projects || []).filter(function (p) {
        return p.slug.toLowerCase() === q || p.title.toLowerCase().indexOf(q) === 0;
      })[0];
      if (!hit) return print('No project called "' + q + '". Type projects to see names.', 'err');
      print('Connecting to ' + hit.title + '...');
      setTimeout(function () { go(hit.url); }, 350);
    },
    github: function () { go(data.links && data.links.github); },
    linkedin: function () { go(data.links && data.links.linkedin); },
    itch: function () { go(data.links && data.links.itch); },
    net_graph: function (args) {
      if (args[0] !== '0' && args[0] !== '1') return print('Usage: net_graph 0 or net_graph 1', 'err');
      setNetGraph(args[0] === '1');
      print('net_graph ' + args[0]);
    },
    sv_cheats: function () {
      print('sv_cheats is a server variable. The server says no.', 'err');
    },
    clear: function () { log.textContent = ''; },
    quit: function () { close(); },
    exit: function () { close(); }
  };

  function run(line) {
    var parts = line.trim().split(/\s+/);
    var name = parts.shift().toLowerCase();
    if (!name) return;
    print('] ' + line, 'cmd');
    history.push(line);
    historyPos = history.length;
    if (Object.prototype.hasOwnProperty.call(commands, name)) commands[name](parts);
    else print('Unknown command "' + name + '". Type help.', 'err');
  }

  function open() {
    con.hidden = false;
    if (!greeted) { print('Console ready. Type help for a list of commands.'); greeted = true; }
    input.focus();
  }
  function close() {
    con.hidden = true;
    input.value = '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && historyPos > 0) { input.value = history[--historyPos]; e.preventDefault(); }
    if (e.key === 'ArrowDown') { historyPos = Math.min(history.length, historyPos + 1); input.value = history[historyPos] || ''; e.preventDefault(); }
  });

  document.addEventListener('keydown', function (e) {
    var typingElsewhere = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target !== input;
    if ((e.key === '`' || e.code === 'Backquote') && !typingElsewhere) {
      e.preventDefault();
      if (con.hidden) open(); else close();
    } else if (e.key === 'Escape' && !con.hidden) {
      close();
    }
  });

  document.querySelectorAll('[data-console-open]').forEach(function (b) {
    b.addEventListener('click', open);
  });
})();
