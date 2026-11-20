const MAX_LEGS = 3;

const App = {
  codes: CITIES.map(c => c.code),
  state: {
    from: 'SGN',
    to: 'HAN',
    date: toDateString(DATA_YEAR, DATA_MONTH, 1),
    mode: 'price'
  },
  graph: null,
  result: null,
  routes: [],
  selected: 0,

  init() {
    MapView.init('map');
    applyLanguage();
    this.fillSelects();
    this.bindEvents();
    this.updateToggles();

    Simulator.onReset = () => this.drawSelectedRoute();
    this.search();
  },

  fillSelects() {
    for (const id of ['fromSelect', 'toSelect']) {
      const select = document.getElementById(id);
      select.innerHTML = this.codes
        .map(code => '<option value="' + code + '">' + cityName(code) + ' (' + code + ')</option>')
        .join('');
    }
    document.getElementById('fromSelect').value = this.state.from;
    document.getElementById('toSelect').value = this.state.to;
  },

  bindEvents() {
    document.getElementById('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.state.from = document.getElementById('fromSelect').value;
      this.state.to = document.getElementById('toSelect').value;
      this.search();
    });

    document.getElementById('swapBtn').addEventListener('click', () => {
      [this.state.from, this.state.to] = [this.state.to, this.state.from];
      this.fillSelects();
      this.search();
    });

    document.querySelectorAll('#modeToggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.mode = btn.dataset.mode;
        this.updateToggles();
        this.search();
      });
    });

    document.getElementById('showAllChk').addEventListener('change', (e) => {
      this.setShowAll(e.target.checked);
    });

    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    document.addEventListener('languagechange', () => {
      this.updateToggles();
      this.fillSelects();
      MapView.updateLanguage();
      if (this.graph) MapView.drawEdges(this.graph);
      this.drawSelectedRoute();
      this.renderDateStrip();
      this.renderResults();
      Simulator.render();
      Simulator.updatePlayButton();
    });

    document.getElementById('playBtn').addEventListener('click', () => Simulator.togglePlay());
    document.getElementById('stepBtn').addEventListener('click', () => Simulator.stepOnce());
    document.getElementById('resetBtn').addEventListener('click', () => Simulator.reset());
  },

  setShowAll(show) {
    document.getElementById('showAllChk').checked = show;
    MapView.setShowAll(show);
  },

  updateToggles() {
    document.querySelectorAll('.lang-toggle button').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === currentLang));
    document.querySelectorAll('#modeToggle button').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === this.state.mode));
  },

  search() {
    const { from, to, date, mode } = this.state;

    this.graph = buildGraph(this.codes, FLIGHTS, date, mode);
    MapView.drawEdges(this.graph);
    MapView.setEndpoints(from, to);

    if (from === to) {
      this.result = null;
      this.routes = [];
    } else {
      this.result = dijkstra(this.graph, from, to);

      this.routes = sortRoutes(findAllPaths(this.graph, from, to, MAX_LEGS), mode);

      if (this.result.path.length && this.optimalIndex() === -1) {
        const legs = this.result.legs;
        this.routes.unshift({
          path: this.result.path,
          legs: legs,
          totalPrice: legs.reduce((s, f) => s + f.price, 0),
          totalTime: legs.reduce((s, f) => s + f.duration, 0)
        });
      }
    }

    this.selected = Math.max(0, this.optimalIndex());
    this.renderDateStrip();
    this.renderResults();
    this.drawSelectedRoute();
    if (this.result) Simulator.load(this.result, this.codes, mode);
    else Simulator.load({ steps: [] }, this.codes, mode);
  },

  optimalIndex() {
    if (!this.result || !this.result.path.length) return -1;
    const key = this.result.path.join('-');
    return this.routes.findIndex(r => r.path.join('-') === key);
  },

  drawSelectedRoute() {
    const route = this.routes[this.selected];
    if (route) MapView.drawPath(route.path); else MapView.clearPath();
  },

  renderDateStrip() {
    const strip = document.getElementById('dateStrip');
    const { from, to, mode } = this.state;
    const days = new Date(DATA_YEAR, DATA_MONTH, 0).getDate();

    const values = [];
    for (let day = 1; day <= days; day++) {
      const date = toDateString(DATA_YEAR, DATA_MONTH, day);
      let total = Infinity;
      if (from !== to) total = dijkstra(buildGraph(this.codes, FLIGHTS, date, mode), from, to).total;
      values.push({ day: day, date: date, total: total });
    }
    const lowest = Math.min(...values.map(v => v.total));

    strip.innerHTML = '';
    for (const v of values) {
      const weekday = I18N[currentLang].weekdays[new Date(DATA_YEAR, DATA_MONTH - 1, v.day).getDay()];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-btn' + (v.date === this.state.date ? ' active' : '') +
                      (v.total === lowest && lowest !== Infinity ? ' lowest' : '');
      btn.innerHTML = '<small>' + weekday + '</small>' +
        String(v.day).padStart(2, '0') + '/' + String(DATA_MONTH).padStart(2, '0') +
        '<span class="day-price" style="display:block">' + (v.total === Infinity ? '—' : formatWeight(v.total, mode)) + '</span>';
      btn.addEventListener('click', () => {
        this.state.date = v.date;
        this.setShowAll(false);
        this.search();
      });
      strip.appendChild(btn);
    }
    const active = strip.querySelector('.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  },

  renderResults() {
    this.renderSummary();
    this.renderRoutes();
    this.renderDetails();
  },

  renderSummary() {
    const box = document.getElementById('summary');
    if (this.state.from === this.state.to) {
      box.innerHTML = '<p class="message warn">' + t('sameCity') + '</p>';
      return;
    }
    const optimal = this.routes[this.optimalIndex()];
    if (!optimal) {
      box.innerHTML = '<p class="message warn">' + t('noRoute') + '</p>';
      return;
    }
    const mainValue = this.state.mode === 'time' ? formatDuration(optimal.totalTime) : formatMoney(optimal.totalPrice);

    let html =
      '<span class="tag">' + t(this.state.mode === 'time' ? 'fastest' : 'cheapest') + ' · Dijkstra</span>' +
      '<div class="summary-total">' + mainValue + '</div>' +
      '<div class="summary-row"><span>' + t('totalPrice') + '</span><b>' + formatMoney(optimal.totalPrice) + '</b></div>' +
      '<div class="summary-row"><span>' + t('totalTime') + '</span><b>' + formatDuration(optimal.totalTime) + '</b></div>' +
      '<div class="summary-row"><span>' + t('legsCount') + '</span><b>' + optimal.legs.length + '</b></div>' +
      '<ol class="timeline">';

    optimal.path.forEach((code, i) => {
      const leg = optimal.legs[i];
      html += '<li data-index="' + (i + 1) + '">' + cityName(code) + ' (' + code + ')' +
        (leg ? '<small>' + leg.id + ' · ' + leg.depart + ' · ' + formatMoney(leg.price) + ' · ' + formatDuration(leg.duration) + '</small>' : '') +
        '</li>';
    });
    box.innerHTML = html + '</ol>';
  },

  renderRoutes() {
    document.getElementById('routesTitle').textContent = t('routesTitle', { n: this.routes.length });
    const list = document.getElementById('routesList');
    list.innerHTML = '';
    const optimal = this.optimalIndex();

    this.routes.forEach((route, i) => {
      const li = document.createElement('li');
      li.className = 'route-item' + (i === this.selected ? ' selected' : '');
      const stops = route.legs.length - 1;
      li.innerHTML =
        '<div class="route-head"><span class="route-path">' + route.path.join(' → ') + '</span>' +
        '<span class="route-price">' + formatMoney(route.totalPrice) + '</span></div>' +
        '<div class="route-meta"><span>⏱ ' + formatDuration(route.totalTime) + '</span>' +
        '<span>' + (stops === 0 ? t('direct') : t('stops', { n: stops })) + '</span></div>' +
        (i === optimal ? '<span class="tag">' + t('dijkstraTag') + '</span>' : '');

      li.addEventListener('click', () => {
        this.selected = i;
        Simulator.pause();
        this.setShowAll(false);
        this.renderRoutes();
        this.renderDetails();
        this.drawSelectedRoute();
      });
      list.appendChild(li);
    });
  },

  renderDetails() {
    const box = document.getElementById('details');
    const route = this.routes[this.selected];
    if (!route) {
      box.innerHTML = '<p class="message">' + t('pickHint') + '</p>';
      return;
    }
    let html = '';
    for (const leg of route.legs) {
      const day = leg.date.slice(8, 10) + '/' + leg.date.slice(5, 7);
      html +=
        '<div class="leg">' +
          '<div class="leg-head"><span class="leg-airline">' + leg.airline + '</span><span>' + leg.id + ' · ' + day + '</span></div>' +
          '<div class="leg-body">' +
            '<div class="leg-time">' + leg.depart + '<small>' + leg.from + ' · ' + cityName(leg.from) + '</small></div>' +
            '<div class="leg-arrow">✈ ' + formatDuration(leg.duration) + '</div>' +
            '<div class="leg-time" style="text-align:right">' + leg.arrive +
              (leg.nextDay ? ' <small style="display:inline">' + t('nextDay') + '</small>' : '') +
              '<small>' + leg.to + ' · ' + cityName(leg.to) + '</small></div>' +
          '</div>' +
          '<div class="leg-price">' + formatMoney(leg.price) + '</div>' +
        '</div>';
    }
    html += '<div class="details-total"><span>' + t('totalPrice') + '</span><span>' + formatMoney(route.totalPrice) + '</span></div>';
    box.innerHTML = html;
  }
};

App.init();
