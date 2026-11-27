const Admin = {
  tabs: {},
  order: ['airports', 'routes', 'incidents', 'promotions', 'customers', 'pricing', 'bookings'],
  current: 'airports',
  active: false,

  register(key, module) {
    this.tabs[key] = module;
  },

  init() {
    const nav = document.getElementById('adminTabs');
    for (const key of this.order) {
      if (!this.tabs[key]) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.tab = key;
      btn.dataset.i18n = 'tab' + key[0].toUpperCase() + key.slice(1);
      btn.addEventListener('click', () => this.open(key));
      nav.appendChild(btn);
    }
    applyLanguage();
    document.getElementById('backToSearch').addEventListener('click', () => { location.hash = ''; });
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('storechange', (e) => this.onStore(e.detail.kind));
    document.addEventListener('languagechange', () => { if (this.active) this.render(); });
    this.route();
  },

  route() {
    const show = location.hash === '#admin';
    this.active = show;
    document.getElementById('adminView').hidden = !show;
    document.querySelector('main.layout').hidden = show;
    if (show) {
      this.render();
    } else {
      this.leave();
      if (MapView.map) setTimeout(() => MapView.map.invalidateSize(), 50);
    }
  },

  allowed() {
    return Store.online && Store.isAdmin();
  },

  onStore(kind) {
    if (!this.active) return;
    if (kind === 'auth') return this.render();
    const tab = this.tabs[this.current];
    if (tab && tab.onStore) tab.onStore(kind);
  },

  open(key) {
    this.leave();
    this.current = key;
    this.render();
  },

  leave() {
    const tab = this.tabs[this.current];
    if (tab && tab.leave) tab.leave();
  },

  render() {
    const gate = document.getElementById('adminGate');
    const content = document.getElementById('adminContent');
    document.querySelectorAll('#adminTabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === this.current));
    if (!this.allowed()) {
      this.leave();
      gate.textContent = Store.online ? t('adminNeedLogin') : t('adminOffline');
      gate.hidden = false;
      content.innerHTML = '';
      return;
    }
    gate.hidden = true;
    this.tabs[this.current].render(content);
  },

  notify(message) {
    App.toast(message);
  },

  run(promise, successKey) {
    return Promise.resolve(promise)
      .then(result => {
        if (successKey) this.notify(t(successKey));
        return result;
      })
      .catch(err => {
        this.notify(err.code || err.message);
        throw err;
      });
  },

  table(headers, rows) {
    if (!rows.length) return '<p class="message">' + t('emptyList') + '</p>';
    return '<div class="table-wrap"><table class="admin-table"><thead><tr>' +
      headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(cells => '<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  },

  options(items, selected) {
    return items.map(item => '<option value="' + esc(item.value) + '"' + (item.value === selected ? ' selected' : '') + '>' +
      esc(item.label) + '</option>').join('');
  },

  airportOptions(selected, includeInactive) {
    const list = includeInactive ? Store.airports : CITIES;
    return this.options(list.map(a => ({ value: a.code, label: a.code + ' · ' + (a.name ? a.name[currentLang] || a.name.vi : a.code) })), selected);
  },

  monthDates() {
    const days = new Date(DATA_YEAR, DATA_MONTH, 0).getDate();
    const list = [];
    for (let d = 1; d <= days; d++) list.push(toDateString(DATA_YEAR, DATA_MONTH, d));
    return list;
  },

  status(active) {
    return '<span class="tag ' + (active ? '' : 'tag-warn') + '">' + t(active ? 'active' : 'inactive') + '</span>';
  },

  button(action, id, key, cls) {
    return '<button type="button" class="mini-btn ' + (cls || '') + '" data-action="' + action + '" data-id="' + esc(id) + '">' + t(key) + '</button>';
  },

  bindActions(container, handlers) {
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const handler = handlers[btn.dataset.action];
        if (handler) handler(btn.dataset.id, btn);
      });
    });
  },

  seedWarning() {
    if (Store.networkSeeded()) return '';
    return '<p class="message warn">' + t('notSeeded') + '</p>';
  },

  value(id) {
    const el = document.getElementById(id);
    return el.type === 'checkbox' ? el.checked : el.value.trim();
  }
};
