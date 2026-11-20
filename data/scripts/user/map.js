const TIER_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

const SEA_LABELS = [
  { key: 'hoangSa',  lat: 16.5, lng: 111.6, cls: 'island' },
  { key: 'truongSa', lat: 8.65, lng: 111.9, cls: 'island' },
  { key: 'bienDong', lat: 13.2, lng: 110.6, cls: 'sea' }
];

const PLANE_SVG = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';

const MapView = {
  map: null,
  markers: {},
  arcs: {},
  arcPoints: {},
  pathLayers: [],
  plane: null,
  planeFrame: null,
  tiers: null,
  showAll: false,
  focusKeys: new Set(),
  overlayLayers: [],
  oldLayers: [],
  onAirportClick: null,

  init(elementId) {
    this.map = L.map(elementId, { zoomControl: true, attributionControl: true })
      .setView([16.0, 106.8], 6);

    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
    this.baseLayers = {
      satellite: L.tileLayer(esri + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri', maxZoom: 10, minZoom: 5, className: 'tiles-satellite'
      }),
      dark: L.tileLayer(esri + 'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri', maxZoom: 10, minZoom: 5
      })
    };
    this.baseLayers.satellite.addTo(this.map);

    this.drawCities();
    this.updateLanguage();

    const ViewAll = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'view-all-btn leaflet-bar');
        btn.type = 'button';
        btn.textContent = '⤢';
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', () => this.fitAll());
        this.viewAllBtn = btn;
        return btn;
      }
    });
    new ViewAll().addTo(this.map);

    this.map.on('zoomend', () => this.updateZoomClass());
    this.map.fitBounds(this.allBounds(), { padding: [30, 30] });
    this.updateZoomClass();
  },

  allBounds() {
    return CITIES.map(c => [c.lat, c.lng]).concat(SEA_LABELS.map(l => [l.lat, l.lng]));
  },

  fitAll() {
    this.map.flyToBounds(this.allBounds(), { padding: [30, 30], duration: 0.8 });
  },

  fitPaths(paths) {
    let points = [];
    for (const path of paths) {
      if (!path || !path.length) continue;
      points = points.concat(path.length > 1 ? this.pathPoints(path) : [[getCity(path[0]).lat, getCity(path[0]).lng]]);
    }
    if (!points.length) return this.fitAll();
    this.map.flyToBounds(points, {
      paddingTopLeft: [60, 60],
      paddingBottomRight: [290, 60],
      maxZoom: 8,
      duration: 0.8
    });
  },

  updateZoomClass() {
    this.map.getContainer().classList.toggle('zoom-low', this.map.getZoom() < 7);
  },

  updateLanguage() {
    this.updateCityLabels();
    if (this.viewAllBtn) this.viewAllBtn.title = t('viewAll');

    if (this.layerControl) this.layerControl.remove();
    const layers = {};
    layers[t('layerSatellite')] = this.baseLayers.satellite;
    layers[t('layerDark')] = this.baseLayers.dark;
    this.layerControl = L.control.layers(layers, null, { position: 'topright' }).addTo(this.map);

    if (this.seaLayer) this.seaLayer.remove();
    this.seaLayer = L.layerGroup(SEA_LABELS.map(l => L.marker([l.lat, l.lng], {
      interactive: false,
      icon: L.divIcon({ className: 'sea-label ' + l.cls, iconSize: [0, 0], html: '<span>' + t(l.key) + '</span>' })
    }))).addTo(this.map);
  },

  drawCities() {
    for (const city of CITIES) {
      const icon = L.divIcon({
        className: 'city-icon',
        iconSize: [0, 0],
        html: '<div class="city-marker lp-' + city.label + '" data-code="' + city.code + '">' +
              '<span class="dot"></span><span class="label"></span><span class="badge"></span></div>'
      });
      const marker = L.marker([city.lat, city.lng], { icon: icon, zIndexOffset: 1000 }).addTo(this.map);
      marker.on('click', () => {
        if (this.onAirportClick) this.onAirportClick(city.code);
      });
      this.markers[city.code] = marker;
    }
    this.updateCityLabels();
  },

  markerEl(code) {
    const el = this.markers[code].getElement();
    return el ? el.querySelector('.city-marker') : null;
  },

  updateCityLabels() {
    for (const city of CITIES) {
      const el = this.markerEl(city.code);
      if (el) {
        el.querySelector('.label').innerHTML =
          '<span class="code">' + city.code + '</span><span class="name"> · ' + city.name[currentLang] + '</span>';
      }
      this.markers[city.code].unbindTooltip().bindTooltip(
        city.name[currentLang] + ' (' + city.code + ') – ' + city.airport,
        { direction: 'top', offset: [0, -8], className: 'arc-tip' }
      );
    }
  },

  showPopup(code, content) {
    const city = getCity(code);
    L.popup({ className: 'airport-popup', offset: [0, -6] })
      .setLatLng([city.lat, city.lng])
      .setContent(content)
      .openOn(this.map);
  },

  closePopup() {
    this.map.closePopup();
  },

  setClosedAirports(codes) {
    for (const code in this.markers) {
      const el = this.markerEl(code);
      if (el) el.classList.toggle('closed', codes.includes(code));
    }
  },

  computeArc(a, b) {
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;
    const bend = 0.15;

    const cx = (a.lng + b.lng) / 2 - dy * bend;
    const cy = (a.lat + b.lat) / 2 + dx * bend;

    const points = [];
    const segments = 40;
    for (let i = 0; i <= segments; i++) {
      const s = i / segments;

      const lng = (1 - s) * (1 - s) * a.lng + 2 * (1 - s) * s * cx + s * s * b.lng;
      const lat = (1 - s) * (1 - s) * a.lat + 2 * (1 - s) * s * cy + s * s * b.lat;
      points.push([lat, lng]);
    }
    return points;
  },

  drawEdges(graph) {
    for (const key in this.arcs) this.arcs[key].remove();
    this.arcs = {};
    this.arcPoints = {};

    const prices = [];
    for (const u of graph.nodes) for (const e of graph.adj[u]) prices.push(e.flight.price);
    this.tiers = computePriceTiers(prices);

    for (const u of graph.nodes) {
      for (const edge of graph.adj[u]) {
        const key = u + '-' + edge.to;
        const points = this.computeArc(getCity(u), getCity(edge.to));
        const color = TIER_COLORS[this.tiers.tierOf(edge.flight.price)];
        const line = L.polyline(points, {
          color: color,
          weight: 2,
          opacity: 0.75,
          className: 'flight-arc'
        }).addTo(this.map);

        line.bindTooltip(
          u + ' → ' + edge.to + ' · ' + edge.flight.id + '<br>' +
          formatMoney(edge.flight.price) + ' · ' + formatDuration(edge.flight.duration),
          { sticky: true, className: 'arc-tip' }
        );
        this.arcs[key] = line;
        this.arcPoints[key] = points;
      }
    }
    this.setShowAll(this.showAll);
    this.renderLegend();
  },

  setShowAll(show) {
    this.showAll = show;
    for (const key in this.arcs) {
      const el = this.arcs[key].getElement();
      if (el) el.classList.toggle('dim', !show && !this.focusKeys.has(key));
    }
  },

  setEndpoints(from, to, stops = []) {
    for (const code in this.markers) {
      const el = this.markerEl(code);
      if (!el) continue;
      el.classList.toggle('start', code === from);
      el.classList.toggle('end', code === to);
      el.classList.toggle('stop', stops.includes(code) && code !== from && code !== to);
    }
  },

  pathPoints(path) {
    let points = [];
    for (let i = 0; i < path.length - 1; i++) {
      points = points.concat(this.computeArc(getCity(path[i]), getCity(path[i + 1])));
    }
    return points;
  },

  drawTrip(paths) {
    this.overlayLayers.forEach(layer => layer.remove());
    this.overlayLayers = paths
      .filter(path => path.length > 1)
      .map(path => L.polyline(this.pathPoints(path), {
        color: '#c084fc', weight: 2.5, opacity: 0.85, dashArray: '2 6', interactive: false
      }).addTo(this.map));
  },

  drawOldPath(path) {
    this.oldLayers.forEach(layer => layer.remove());
    this.oldLayers = [];
    if (!path || path.length < 2) return;
    this.oldLayers.push(L.polyline(this.pathPoints(path), {
      color: '#ef4444', weight: 3, opacity: 0.9, dashArray: '8 8', interactive: false
    }).addTo(this.map));
  },

  setNodeState(code, state) {
    const el = this.markerEl(code);
    if (!el) return;
    el.classList.remove('frontier', 'current', 'visited');
    if (state) el.classList.add(state);
  },

  setNodeBadge(code, text) {
    const el = this.markerEl(code);
    if (!el) return;
    const badge = el.querySelector('.badge');
    badge.textContent = text || '';
    badge.classList.toggle('show', !!text);
  },

  flashEdge(u, v, updated) {
    this.clearFlash();
    const line = this.arcs[u + '-' + v];
    if (!line) return;
    line.bringToFront();
    line.getElement().classList.add(updated ? 'flash-update' : 'flash-keep');
  },

  clearFlash() {
    for (const key in this.arcs) {
      const el = this.arcs[key].getElement();
      if (el) el.classList.remove('flash-update', 'flash-keep');
    }
  },

  clearSimulation() {
    this.clearFlash();
    for (const code in this.markers) {
      this.setNodeState(code, '');
      this.setNodeBadge(code, '');
    }
  },

  drawPath(path) {
    this.clearPath();
    if (!path || path.length < 2) return;

    let allPoints = [];
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i] + '-' + path[i + 1];
      this.focusKeys.add(key);
      const points = this.arcPoints[key];
      if (points) allPoints = allPoints.concat(points);
    }
    this.setShowAll(this.showAll);

    const glow = L.polyline(allPoints, { color: '#38bdf8', weight: 9, opacity: 0.35, className: 'path-glow', interactive: false });
    const line = L.polyline(allPoints, { color: '#e0f2fe', weight: 3, opacity: 1, className: 'path-dash', interactive: false });
    this.pathLayers = [glow.addTo(this.map), line.addTo(this.map)];
    this.animatePlane(allPoints);
  },

  clearPath() {
    this.pathLayers.forEach(layer => layer.remove());
    this.pathLayers = [];
    if (this.planeFrame) cancelAnimationFrame(this.planeFrame);
    this.planeFrame = null;
    if (this.plane) this.plane.remove();
    this.plane = null;
    if (this.focusKeys.size) {
      this.focusKeys.clear();
      this.setShowAll(this.showAll);
    }
  },

  animatePlane(points) {
    const icon = L.divIcon({ className: 'plane-icon', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div>' + PLANE_SVG + '</div>' });
    this.plane = L.marker(points[0], { icon: icon, interactive: false, zIndexOffset: 2000 }).addTo(this.map);

    const duration = 1200 * points.length / 40;
    const start = performance.now();

    const tick = (now) => {
      const progress = (Math.max(0, now - start) % duration) / duration;
      const i = Math.min(points.length - 2, Math.floor(progress * (points.length - 1)));
      this.plane.setLatLng(points[i]);

      const p1 = this.map.latLngToLayerPoint(points[i]);
      const p2 = this.map.latLngToLayerPoint(points[i + 1]);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      const el = this.plane.getElement();

      if (el) el.firstChild.style.transform = 'rotate(' + (angle + 90) + 'deg)';

      this.planeFrame = requestAnimationFrame(tick);
    };
    this.planeFrame = requestAnimationFrame(tick);
  },

  renderLegend() {
    const box = document.getElementById('legend');
    let html = '<h4>' + t('legend') + '</h4>' +
      '<div class="legend-row"><span class="legend-dot" style="background:var(--start)"></span>' + t('legendStart') + '</div>' +
      '<div class="legend-row"><span class="legend-dot" style="background:var(--end)"></span>' + t('legendEnd') + '</div>' +
      '<div class="legend-row"><span class="legend-dot" style="background:var(--accent)"></span>' + t('legendCity') + '</div>' +
      '<div class="legend-row"><span class="legend-dot" style="background:var(--stop)"></span>' + t('legendStop') + '</div>' +
      '<div class="legend-row"><span class="legend-line" style="background:#38bdf8;box-shadow:0 0 6px #38bdf8"></span>' + t('legendOptimal') + '</div>' +
      '<div class="legend-row"><span class="legend-line dashed" style="border-color:#c084fc"></span>' + t('legendOther') + '</div>' +
      '<div class="legend-row"><span class="legend-line dashed" style="border-color:#ef4444"></span>' + t('legendOld') + '</div>' +
      '<div class="legend-sub">' + t('legendPrice') + '</div>';

    if (this.tiers) {
      this.tiers.ranges.forEach((range, tier) => {
        if (!range) return;
        const text = range.min === range.max
          ? formatMoney(range.min)
          : formatMoney(range.min) + ' – ' + formatMoney(range.max);
        html += '<div class="legend-row"><span class="legend-line" style="background:' + TIER_COLORS[tier] + '"></span>' + text + '</div>';
      });
    }
    box.innerHTML = html;
  }
};
