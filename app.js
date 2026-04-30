(function () {
  'use strict';

  var STORAGE_KEY = 'todo-editorial.v1';

  var state = {
    tasks: load(),
    expanded: false,
    dragId: null
  };

  var els = {
    form: document.getElementById('entry-form'),
    input: document.getElementById('entry-input'),
    add: document.getElementById('entry-add'),
    active: document.getElementById('active'),
    doneBlock: document.getElementById('done-block'),
    doneList: document.getElementById('done'),
    doneToggle: document.getElementById('done-toggle'),
    doneCount: document.getElementById('done-count'),
    count: document.getElementById('count')
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks)); } catch (e) {}
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function addTask(text) {
    var t = (text || '').trim();
    if (!t) return;
    state.tasks.push({ id: newId(), text: t, done: false });
    save();
    render();
  }

  function toggleTask(id) {
    var t = state.tasks.find(function (x) { return x.id === id; });
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : undefined;
    save();
    render();
  }

  function reorder(fromId, toId) {
    var arr = state.tasks;
    var fi = arr.findIndex(function (x) { return x.id === fromId; });
    var ti = arr.findIndex(function (x) { return x.id === toId; });
    if (fi < 0 || ti < 0 || fi === ti) return;
    var item = arr.splice(fi, 1)[0];
    arr.splice(ti, 0, item);
    save();
    render();
  }

  function checkSvg() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', '11');
    s.setAttribute('height', '11');
    s.setAttribute('viewBox', '0 0 12 12');
    s.setAttribute('fill', 'none');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M2 6.5L4.8 9L10 3.5');
    p.setAttribute('stroke', '#FBF8F1');
    p.setAttribute('stroke-width', '2');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    s.appendChild(p);
    return s;
  }

  function dragHandleSvg() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'drag');
    s.setAttribute('width', '10');
    s.setAttribute('height', '16');
    s.setAttribute('viewBox', '0 0 10 16');
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 2; c++) {
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', String(2 + c * 6));
        dot.setAttribute('cy', String(3 + r * 5));
        dot.setAttribute('r', '1.1');
        dot.setAttribute('fill', 'currentColor');
        s.appendChild(dot);
      }
    }
    return s;
  }

  function makeRow(t, opts) {
    var li = document.createElement('li');
    li.className = 'row ' + (opts.done ? 'done-row' : 'active-row');
    li.dataset.id = t.id;

    if (!opts.done) {
      li.draggable = true;
      li.addEventListener('dragstart', function () {
        state.dragId = t.id;
        li.classList.add('dragging');
      });
      li.addEventListener('dragover', function (e) {
        e.preventDefault();
      });
      li.addEventListener('drop', function (e) {
        e.preventDefault();
        if (state.dragId && state.dragId !== t.id) reorder(state.dragId, t.id);
        state.dragId = null;
      });
      li.addEventListener('dragend', function () {
        state.dragId = null;
        li.classList.remove('dragging');
      });
    }

    var check = document.createElement('button');
    check.type = 'button';
    check.className = 'check' + (t.done ? ' is-done' : '');
    check.setAttribute('aria-label', t.done ? 'Mark incomplete' : 'Mark complete');
    if (t.done) check.appendChild(checkSvg());
    check.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleTask(t.id);
    });

    var span = document.createElement('span');
    span.className = 'row-text';
    span.textContent = t.text;

    li.appendChild(check);
    li.appendChild(span);

    if (!opts.done) li.appendChild(dragHandleSvg());

    return li;
  }

  function render() {
    var active = state.tasks.filter(function (t) { return !t.done; });
    var done = state.tasks.filter(function (t) { return t.done; });

    els.count.textContent = active.length + (active.length === 1 ? ' thing to do' : ' things to do');

    els.active.innerHTML = '';
    active.forEach(function (t) { els.active.appendChild(makeRow(t, { done: false })); });

    if (done.length === 0) {
      els.doneBlock.hidden = true;
      els.doneList.innerHTML = '';
      return;
    }

    els.doneBlock.hidden = false;
    els.doneCount.textContent = String(done.length);
    els.doneToggle.setAttribute('aria-expanded', state.expanded ? 'true' : 'false');

    var visible = state.expanded ? done : done.slice(-3);
    els.doneList.innerHTML = '';
    visible.forEach(function (t) { els.doneList.appendChild(makeRow(t, { done: true })); });
  }

  function syncAddDisabled() {
    els.add.disabled = !els.input.value.trim();
  }

  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    addTask(els.input.value);
    els.input.value = '';
    syncAddDisabled();
    els.input.focus();
  });

  els.input.addEventListener('input', syncAddDisabled);

  els.doneToggle.addEventListener('click', function () {
    state.expanded = !state.expanded;
    render();
  });

  syncAddDisabled();
  render();
})();
