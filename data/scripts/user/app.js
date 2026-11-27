const MAX_LEGS = 3;
const MAX_STOPS = 3;
const DAYS_IN_MONTH = new Date(DATA_YEAR, DATA_MONTH, 0).getDate();

const App = {
  codes: CITIES.map(c => c.code),
  state: {
    from: 'SGN',
    to: 'HAN',
    stops: [],
    roundTrip: false,
    dates: [toDateString(DATA_YEAR, DATA_MONTH, 1)],
    mode: 'price',
    incidents: [],
    fareClass: 'economy',
    slots: [],
    passengers: { adult: 1, child: 0, infant: 0 },
    tier: 'standard',
    promotions: [],
    pricing: DEFAULT_PRICING
  },
  segments: [],
  active: 0,

  init() {
    this.applyTheme(localStorage.getItem('theme') || 'dark');
    MapView.init('map');
    MapView.setTheme(this.theme);
    MapView.onAirportClick = (code) => this.openAirportPopup(code);
    applyLanguage();
    this.fillSelects();
    this.fillTripOptions();
    this.renderStops();
    this.bindEvents();
    this.updateToggles();
    Simulator.onReset = () => this.drawMap();
    this.search();
  },

  cityOptions() {
    return this.codes
      .map(code => '<option value="' + code + '">' + cityName(code) + ' (' + code + ')</option>')
      .join('');
  },

  fillSelects() {
    for (const id of ['fromSelect', 'toSelect']) {
      document.getElementById(id).innerHTML = this.cityOptions();
    }
    document.getElementById('fromSelect').value = this.state.from;
    document.getElementById('toSelect').value = this.state.to;
    document.getElementById('roundTripChk').checked = this.state.roundTrip;
  },

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    document.getElementById('themeBtn').textContent = theme === 'dark' ? '☀' : '🌙';
  },

  fillTripOptions() {
    const select = document.getElementById('fareClassSelect');
    select.innerHTML = FARE_CLASSES.map(fc => '<option value="' + fc + '">' + t('fc_' + fc) + '</option>').join('');
    select.value = this.state.fareClass;
    document.querySelectorAll('#slotChips .chip').forEach(chip => {
      const slot = chip.dataset.slot;
      chip.innerHTML = t('slot_' + slot) + '<small>' + t('slotHint_' + slot) + '</small>';
      chip.classList.toggle('active', this.state.slots.includes(slot));
    });
  },

  readPassengers() {
    const value = (id) => Math.max(0, Math.floor(Number(document.getElementById(id).value) || 0));
    const passengers = { adult: value('paxAdult'), child: value('paxChild'), infant: value('paxInfant') };
    const ok = validPassengers(passengers);
    document.getElementById('paxError').hidden = ok;
    if (ok) this.state.passengers = passengers;
    return ok;
  },

  flightsFor(date) {
    const { fareClass, slots, promotions, pricing } = this.state;
    return prepareFlights(flightsOn(date), { fareClass, slots, promotions, pricing });
  },

  renderStops() {
    const box = document.getElementById('stopsList');
    box.innerHTML = '';
    this.state.stops.forEach((code, i) => {
      const row = document.createElement('div');
      row.className = 'stop-row';
      row.innerHTML = '<span class="stop-index">' + (i + 1) + '</span><select>' + this.cityOptions() + '</select>' +
        '<button type="button" class="stop-remove" title="✕">✕</button>';
      const select = row.querySelector('select');
      select.value = code;
      select.addEventListener('change', () => { this.state.stops[i] = select.value; });
      row.querySelector('.stop-remove').addEventListener('click', () => {
        this.state.stops.splice(i, 1);
        this.renderStops();
      });
      box.appendChild(row);
    });
    document.getElementById('addStopBtn').disabled = this.state.stops.length >= MAX_STOPS;
  },

  bindEvents() {
    document.getElementById('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.state.from = document.getElementById('fromSelect').value;
      this.state.to = document.getElementById('toSelect').value;
      this.state.roundTrip = document.getElementById('roundTripChk').checked;
      this.state.incidents = [];
      this.active = 0;
      this.search();
    });

    document.getElementById('swapBtn').addEventListener('click', () => {
      [this.state.from, this.state.to] = [this.state.to, this.state.from];
      this.state.stops.reverse();
      this.state.incidents = [];
      this.fillSelects();
      this.renderStops();
      this.search();
    });

    document.getElementById('addStopBtn').addEventListener('click', () => {
      if (this.state.stops.length >= MAX_STOPS) return;
      const used = [this.state.from, this.state.to].concat(this.state.stops);
      this.state.stops.push(this.codes.find(code => !used.includes(code)));
      this.renderStops();
    });

    document.getElementById('themeBtn').addEventListener('click', () => {
      this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
      MapView.setTheme(this.theme);
    });

    document.getElementById('fareClassSelect').addEventListener('change', (e) => {
      this.state.fareClass = e.target.value;
      this.refresh();
    });

    document.querySelectorAll('#slotChips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const slot = chip.dataset.slot;
        const slots = this.state.slots;
        this.state.slots = slots.includes(slot) ? slots.filter(s => s !== slot) : slots.concat(slot);
        this.fillTripOptions();
        this.refresh();
      });
    });

    ['paxAdult', 'paxChild', 'paxInfant'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        if (this.readPassengers()) this.renderSummary();
      });
    });

    document.querySelectorAll('#modeToggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.mode = btn.dataset.mode;
        this.updateToggles();
        this.refresh();
      });
    });

    document.getElementById('showAllChk').addEventListener('change', (e) => {
      MapView.setShowAll(e.target.checked);
      this.drawMap();
    });

    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    document.addEventListener('languagechange', () => {
      this.updateToggles();
      this.fillSelects();
      this.fillTripOptions();
      this.renderStops();
      MapView.updateLanguage();
      this.render(true);
      Simulator.render();
      Simulator.updatePlayButton();
    });

    document.getElementById('details').addEventListener('click', (e) => {
      const toggle = e.target.closest('.incident-toggle');
      if (toggle) {
        const menu = toggle.nextElementSibling;
        menu.hidden = !menu.hidden;
        return;
      }
      const action = e.target.closest('[data-inc]');
      if (action) this.addLegIncident(action.dataset.inc, Number(action.dataset.leg));
    });

    document.getElementById('clearIncidentsBtn').addEventListener('click', () => {
      this.state.incidents = [];
      this.segments.forEach(seg => { seg.rerouteSpec = null; });
      this.refresh();
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

  shiftDate(date, days) {
    const day = Math.min(DAYS_IN_MONTH, Math.max(1, Number(date.slice(8, 10)) + days));
    return toDateString(DATA_YEAR, DATA_MONTH, day);
  },

  shortDate(date) {
    return date.slice(8, 10) + '/' + date.slice(5, 7);
  },

  syncDates() {
    const count = this.state.stops.length + 1 + (this.state.roundTrip ? 1 : 0);
    const dates = this.state.dates.slice(0, count);
    while (dates.length < count) {
      const isReturn = this.state.roundTrip && dates.length === count - 1;
      dates.push(this.shiftDate(dates[dates.length - 1], isReturn ? 3 : 1));
    }
    this.state.dates = dates;
  },

  search() {
    this.syncDates();
    const { from, stops, to, dates, roundTrip } = this.state;
    this.segments = buildSegments(from, stops, to, dates, roundTrip)
      .map(seg => ({ ...seg, rerouteSpec: null }));
    this.active = Math.min(this.active, this.segments.length - 1);
    this.refresh();
  },

  refresh() {
    for (const seg of this.segments) this.solve(seg);
    this.render(false);
  },

  solve(seg) {
    const { mode, incidents } = this.state;
    Object.assign(seg, solveSegment(this.codes, this.flightsFor(seg.date), seg, mode, incidents, MAX_LEGS));
    seg.reroute = null;
    if (seg.rerouteSpec) {
      const spec = seg.rerouteSpec;
      const out = reroute(spec.baseRoute, spec.legIndex, seg.graph, seg.to);
      seg.reroute = { ...out, oldRoute: spec.baseRoute, incident: spec.incident };
    }

    const newRoute = seg.reroute && seg.reroute.newRoute;
    seg.list = newRoute
      ? [newRoute].concat(seg.routes.filter(r => !samePath(r.path, newRoute.path)))
      : seg.routes;
    seg.selected = newRoute ? 0 : Math.max(0, this.optimalIndex(seg));
  },

  optimalIndex(seg) {
    if (!seg.result || !seg.result.path.length) return -1;
    return seg.list.findIndex(r => samePath(r.path, seg.result.path));
  },

  activeSegment() {
    return this.segments[this.active];
  },

  selectedRoute(seg) {
    return seg && seg.list ? seg.list[seg.selected] : null;
  },

  segmentLabel(seg, index) {
    const name = seg.kind === 'return' ? t('segmentReturn') : t('segmentOut', { i: index + 1 });
    return name + ': ' + seg.from + ' → ' + seg.to;
  },

  render(keepSimulation) {
    const seg = this.activeSegment();
    MapView.setEndpoints(this.state.from, this.state.to, this.state.stops);
    MapView.setClosedAirports(this.state.incidents
      .filter(inc => inc.type === 'close' && inc.date === seg.date)
      .map(inc => inc.code));
    MapView.drawEdges(seg.graph);

    this.renderDateStrip();
    this.renderSummary();
    this.renderTabs();
    this.renderRoutes();
    this.renderDetails();
    this.renderReroute();
    this.renderIncidents();
    this.drawMap();
    if (!keepSimulation) this.loadSimulation();
  },

  loadSimulation() {
    const seg = this.activeSegment();
    const date = this.shortDate(seg.date);
    if (seg.reroute && seg.reroute.result) {
      Simulator.load(seg.reroute.result, this.codes, this.state.mode,
        { key: 'simInfoReroute', params: { from: seg.reroute.at, to: seg.to, date: date } });
    } else if (seg.result) {
      Simulator.load(seg.result, this.codes, this.state.mode,
        { key: 'simInfo', params: { from: seg.from, to: seg.to, date: date } });
    } else {
      Simulator.load({ steps: [] }, this.codes, this.state.mode, null);
    }
  },

  drawMap() {
    const seg = this.activeSegment();
    const route = this.selectedRoute(seg);
    if (route) MapView.drawPath(route.path); else MapView.clearPath();

    const others = this.segments
      .filter((s, i) => i !== this.active)
      .map(s => this.selectedRoute(s))
      .filter(r => r)
      .map(r => r.path);
    MapView.drawTrip(others);

    const rr = seg.reroute;
    const changed = rr && (!rr.newRoute || !samePath(rr.newRoute.path, rr.oldRoute.path));
    MapView.drawOldPath(changed ? rr.oldRoute.path : null);

    if (document.getElementById('showAllChk').checked) MapView.fitAll();
    else MapView.fitPaths([route ? route.path : [seg.from, seg.to], changed ? rr.oldRoute.path : null]);
  },

  renderDateStrip() {
    const seg = this.activeSegment();
    const { mode, incidents } = this.state;
    document.getElementById('dateLabel').textContent = t('dateFor', { seg: this.segmentLabel(seg, this.active) });

    const values = [];
    for (let day = 1; day <= DAYS_IN_MONTH; day++) {
      const date = toDateString(DATA_YEAR, DATA_MONTH, day);
      let total = Infinity;
      if (seg.from !== seg.to) {
        const graph = buildGraph(this.codes, this.flightsFor(date), date, mode, incidents);
        total = dijkstra(graph, seg.from, seg.to).total;
      }
      values.push({ day: day, date: date, total: total });
    }
    const lowest = Math.min(...values.map(v => v.total));

    const strip = document.getElementById('dateStrip');
    strip.innerHTML = '';
    for (const v of values) {
      const weekday = I18N[currentLang].weekdays[new Date(DATA_YEAR, DATA_MONTH - 1, v.day).getDay()];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-btn' + (v.date === seg.date ? ' active' : '') +
                      (v.total === lowest && lowest !== Infinity ? ' lowest' : '');
      btn.innerHTML = '<small>' + weekday + '</small>' + this.shortDate(v.date) +
        '<span class="day-price">' + (v.total === Infinity ? '—' : formatWeight(v.total, mode)) + '</span>';
      btn.addEventListener('click', () => {
        this.state.dates[this.active] = v.date;
        seg.date = v.date;
        seg.rerouteSpec = null;
        this.setShowAll(false);
        this.solve(seg);
        this.render(false);
      });
      strip.appendChild(btn);
    }
    const active = strip.querySelector('.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  },

  renderSummary() {
    const box = document.getElementById('summary');
    const mode = this.state.mode;
    let totalPrice = 0;
    let totalTime = 0;
    let complete = true;
    let rows = '';

    this.segments.forEach((seg, i) => {
      const route = this.selectedRoute(seg);
      let detail;
      if (seg.from === seg.to) {
        detail = '<span class="warn">' + t('sameCity') + '</span>';
        complete = false;
      } else if (!route) {
        detail = '<span class="warn">' + t('segmentNoRoute') + '</span>';
        complete = false;
      } else {
        totalPrice += route.totalPrice;
        totalTime += route.totalTime;
        detail = route.path.join(' → ') + '<small>' + formatMoney(route.totalPrice) + ' · ' + formatDuration(route.totalTime) + '</small>';
      }
      rows += '<li class="trip-seg' + (i === this.active ? ' active' : '') + '" data-seg="' + i + '">' +
        '<div class="trip-seg-head"><b>' + this.segmentLabel(seg, i) + '</b><span>' + this.shortDate(seg.date) + '</span></div>' +
        '<div class="trip-seg-body">' + detail + '</div></li>';
    });

    const ordered = this.segments.every((seg, i) => i === 0 || this.segments[i - 1].date <= seg.date);
    const main = mode === 'time' ? formatDuration(totalTime) : formatMoney(totalPrice);

    box.innerHTML =
      '<span class="tag">' + t(mode === 'time' ? 'fastest' : 'cheapest') + ' · Dijkstra</span> ' +
      '<span class="tag">' + t('fc_' + this.state.fareClass) + '</span>' +
      '<div class="summary-total">' + (complete ? main : '—') + '</div>' +
      '<div class="summary-row"><span>' + t('fareNote', { fc: t('fc_' + this.state.fareClass) }) + '</span><b>' + formatMoney(totalPrice) + '</b></div>' +
      '<div class="summary-row"><span>' + t('totalTime') + '</span><b>' + formatDuration(totalTime) + '</b></div>' +
      (ordered ? '' : '<p class="message warn">' + t('dateOrderWarn') + '</p>') +
      '<ol class="trip-list">' + rows + '</ol>' +
      (complete ? this.quoteHtml() : '');

    box.querySelectorAll('.trip-seg').forEach(li => {
      li.addEventListener('click', () => this.setActive(Number(li.dataset.seg)));
    });
  },

  currentQuote() {
    const routes = this.segments.map(seg => this.selectedRoute(seg));
    if (routes.some(r => !r)) return null;
    return quote(routes, this.state.passengers, this.state.tier, this.state.pricing);
  },

  quoteHtml() {
    const q = this.currentQuote();
    if (!q) return '';
    let html = '<div class="quote"><h3>' + t('priceBreakdown') + '</h3>';
    for (const line of q.lines) {
      html += '<div class="summary-row"><span>' + t('pax_' + line.type) + ' × ' + line.count + '</span><b>' + formatMoney(line.amount) + '</b></div>';
    }
    if (q.promoSaving > 0) {
      html += '<div class="summary-row promo"><span>' + t('promoSaving') + '</span><b>−' + formatMoney(q.promoSaving) + '</b></div>';
    }
    if (q.tierDiscount > 0) {
      html += '<div class="summary-row promo"><span>' + t('memberDiscount', { tier: t('tier_' + q.tier), p: q.tierPercent }) + '</span><b>−' + formatMoney(q.tierDiscount) + '</b></div>';
    }
    html += '<div class="summary-row grand"><span>' + t('grandTotal') + '</span><b>' + formatMoney(q.total) + '</b></div></div>';
    return html;
  },

  setActive(index) {
    if (index === this.active) return;
    this.active = index;
    this.render(false);
  },

  renderTabs() {
    const box = document.getElementById('segmentTabs');
    box.innerHTML = '';
    if (this.segments.length < 2) return;
    this.segments.forEach((seg, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segment-tab' + (i === this.active ? ' active' : '') + (seg.kind === 'return' ? ' return' : '');
      btn.textContent = this.segmentLabel(seg, i) + ' · ' + this.shortDate(seg.date);
      btn.addEventListener('click', () => this.setActive(i));
      box.appendChild(btn);
    });
  },

  renderRoutes() {
    const seg = this.activeSegment();
    const list = document.getElementById('routesList');
    document.getElementById('routesTitle').textContent = t('routesTitle', { n: seg.list.length });
    list.innerHTML = '';
    const optimal = this.optimalIndex(seg);
    const newRoute = seg.reroute && seg.reroute.newRoute;

    seg.list.forEach((route, i) => {
      const li = document.createElement('li');
      li.className = 'route-item' + (i === seg.selected ? ' selected' : '');
      const stops = route.legs.length - 1;
      li.innerHTML =
        '<div class="route-head"><span class="route-path">' + route.path.join(' → ') + '</span>' +
        '<span class="route-price">' + formatMoney(route.totalPrice) + '</span></div>' +
        '<div class="route-meta"><span>⏱ ' + formatDuration(route.totalTime) + '</span>' +
        '<span>' + (stops === 0 ? t('direct') : t('stops', { n: stops })) + '</span></div>' +
        (route === newRoute ? '<span class="tag tag-warn">' + t('afterIncidentTag') + '</span> ' : '') +
        (i === optimal ? '<span class="tag">' + t('dijkstraTag') + '</span>' : '');

      li.addEventListener('click', () => {
        seg.selected = i;
        Simulator.pause();
        this.setShowAll(false);
        this.renderRoutes();
        this.renderDetails();
        this.renderSummary();
        this.drawMap();
      });
      list.appendChild(li);
    });
  },

  renderDetails() {
    const box = document.getElementById('details');
    const seg = this.activeSegment();
    const route = this.selectedRoute(seg);
    if (!route) {
      box.innerHTML = '<p class="message">' + t(seg.from === seg.to ? 'sameCity' : 'pickHint') + '</p>';
      return;
    }
    const fixed = [this.state.from, this.state.to].concat(this.state.stops);
    let html = '';
    route.legs.forEach((leg, i) => {
      const canClose = leg.to !== seg.to && !fixed.includes(leg.to);
      html +=
        '<div class="leg' + (leg.delayed || leg.surged ? ' leg-affected' : '') + '">' +
          '<div class="leg-head"><span class="leg-airline">' + leg.airline + '</span><span>' + leg.id + ' · ' + this.shortDate(leg.date) + '</span></div>' +
          '<div class="leg-body">' +
            '<div class="leg-time">' + leg.depart + '<small>' + leg.from + ' · ' + cityName(leg.from) + '</small></div>' +
            '<div class="leg-arrow">✈ ' + formatDuration(leg.duration) + '</div>' +
            '<div class="leg-time" style="text-align:right">' + leg.arrive +
              (leg.nextDay ? ' <small style="display:inline">' + t('nextDay') + '</small>' : '') +
              '<small>' + leg.to + ' · ' + cityName(leg.to) + '</small></div>' +
          '</div>' +
          '<div class="leg-foot">' +
            '<span>' +
              (leg.delayed ? '<span class="tag tag-warn">' + t('delayedTag') + '</span> ' : '') +
              (leg.surged ? '<span class="tag tag-warn">' + t('surgedTag') + '</span> ' : '') +
              (leg.promo ? '<span class="tag tag-promo">' + t('promoTag', { p: leg.promo.percent }) + '</span> ' : '') +
              '<span class="tag">' + t('fc_' + (leg.fareClass || 'economy')) + '</span>' +
            '</span>' +
            '<span class="leg-price">' + (leg.promo ? '<s>' + formatMoney(leg.listPrice) + '</s> ' : '') + formatMoney(leg.price) + '</span>' +
          '</div>' +
          '<div class="leg-actions">' +
            '<button type="button" class="incident-toggle">' + t('incidentBtn') + '</button>' +
            '<div class="incident-menu" hidden>' +
              '<button type="button" data-inc="cancel" data-leg="' + i + '">' + t('incCancel') + '</button>' +
              '<button type="button" data-inc="delay" data-leg="' + i + '">' + t('incDelay') + '</button>' +
              '<button type="button" data-inc="surge" data-leg="' + i + '">' + t('incSurge') + '</button>' +
              (canClose ? '<button type="button" data-inc="close" data-leg="' + i + '">' + t('incClose', { code: leg.to }) + '</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
    });
    html += '<div class="details-total"><span>' + t('totalPrice') + '</span><span>' + formatMoney(route.totalPrice) + '</span></div>';
    box.innerHTML = html;
  },

  sameIncident(a, b) {
    return a.type === b.type && a.date === b.date && a.code === b.code && a.from === b.from && a.to === b.to;
  },

  addIncident(incident, spec) {
    if (this.state.incidents.some(inc => this.sameIncident(inc, incident))) return;
    this.state.incidents.push(incident);
    if (spec) this.activeSegment().rerouteSpec = spec;
    this.setShowAll(false);
    this.refresh();
  },

  addLegIncident(type, legIndex) {
    const seg = this.activeSegment();
    const route = this.selectedRoute(seg);
    const leg = route.legs[legIndex];
    const incident = type === 'close'
      ? { type: type, code: leg.to, date: seg.date }
      : { type: type, from: leg.from, to: leg.to, date: seg.date };
    this.addIncident(incident, { baseRoute: route, legIndex: legIndex, incident: incident });
  },

  removeIncident(index) {
    const incident = this.state.incidents[index];
    this.state.incidents.splice(index, 1);
    for (const seg of this.segments) {
      if (seg.rerouteSpec && seg.rerouteSpec.incident === incident) seg.rerouteSpec = null;
    }
    this.refresh();
  },

  incidentText(inc) {
    const params = { from: inc.from, to: inc.to, code: inc.code, date: this.shortDate(inc.date) };
    const key = { cancel: 'descCancel', delay: 'descDelay', surge: 'descSurge', close: 'descClose' }[inc.type];
    return t(key, params);
  },

  renderIncidents() {
    const card = document.getElementById('incidentsCard');
    const list = document.getElementById('incidentsList');
    card.hidden = this.state.incidents.length === 0;
    list.innerHTML = '';
    this.state.incidents.forEach((inc, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span>⚠ ' + this.incidentText(inc) + '</span><button type="button" title="✕">✕</button>';
      li.querySelector('button').addEventListener('click', () => this.removeIncident(i));
      list.appendChild(li);
    });
  },

  signed(value, formatter) {
    if (value === 0) return formatter(0);
    return (value > 0 ? '+' : '−') + formatter(Math.abs(value));
  },

  renderReroute() {
    const card = document.getElementById('rerouteCard');
    const box = document.getElementById('reroute');
    const seg = this.activeSegment();
    const rr = seg.reroute;
    card.hidden = !rr;
    if (!rr) return;

    const old = rr.oldRoute;
    const line = (label, route, cls) =>
      '<div class="rr-line ' + cls + '"><span class="rr-label">' + label + '</span>' +
      '<span class="rr-path">' + route.path.join(' → ') + '</span>' +
      '<span class="rr-cost">' + formatMoney(route.totalPrice) + ' · ' + formatDuration(route.totalTime) + '</span></div>';

    let html = '<p class="message">' + t('rerouteAt', { incident: this.incidentText(rr.incident), city: rr.at + ' · ' + cityName(rr.at) }) + '</p>' +
      line(t('oldRoute'), old, 'rr-old');

    if (!rr.newRoute) {
      html += '<p class="message warn">' + t('noAlternative', { from: rr.at, to: seg.to }) + '</p>';
    } else {
      html += line(t('newRoute'), rr.newRoute, 'rr-new');
      if (samePath(rr.newRoute.path, old.path)) html += '<p class="message">' + t('noChange') + '</p>';
      html += '<div class="summary-row"><span>' + t('difference') + '</span><b>' +
        this.signed(rr.newRoute.totalPrice - old.totalPrice, formatMoney) + ' · ' +
        this.signed(rr.newRoute.totalTime - old.totalTime, formatDuration) + '</b></div>';
    }
    box.innerHTML = html;
  },

  openAirportPopup(code) {
    const seg = this.activeSegment();
    const city = getCity(code);
    const index = this.state.incidents.findIndex(inc => inc.type === 'close' && inc.code === code && inc.date === seg.date);
    const fixed = [this.state.from, this.state.to].concat(this.state.stops);

    const box = document.createElement('div');
    box.innerHTML = '<b>' + city.name[currentLang] + ' (' + code + ')</b><br><small>' + city.airport + '</small>';
    if (!fixed.includes(code)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'popup-btn';
      btn.textContent = index >= 0 ? t('reopenAirport') : t('closeAirport', { date: this.shortDate(seg.date) });
      btn.addEventListener('click', () => {
        MapView.closePopup();
        if (index >= 0) {
          this.removeIncident(index);
          return;
        }
        const incident = { type: 'close', code: code, date: seg.date };
        const route = this.selectedRoute(seg);
        const at = route ? route.path.indexOf(code) : -1;
        const spec = at > 0 ? { baseRoute: route, legIndex: at - 1, incident: incident } : null;
        this.addIncident(incident, spec);
      });
      box.appendChild(btn);
    }
    MapView.showPopup(code, box);
  }
};

App.init();
