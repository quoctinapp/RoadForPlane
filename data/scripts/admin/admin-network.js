function adminField(label, control, wide) {
  return '<label class="field' + (wide ? ' wide' : '') + '"><span>' + label + '</span>' + control + '</label>';
}

const AdminAirports = {
  editing: null,
  pickMap: null,
  pickMarker: null,

  render(el) {
    this.leave();
    const a = this.editing ? Store.airports.find(x => x.code === this.editing) : null;
    const sides = ['left', 'right', 'top'].map(s => ({ value: s, label: t('side_' + s) }));
    const v = (x) => esc(x == null ? '' : x);

    el.innerHTML =
      '<div class="admin-head"><h2>' + t('tabAirports') + '</h2>' +
        '<button type="button" id="seedBtn" class="ghost-btn small">' + t('seedData') + '</button></div>' +
      Admin.seedWarning() +
      '<div class="admin-split">' +
        '<form id="airportForm" class="admin-form"><fieldset' + (Store.networkSeeded() ? '' : ' disabled') + '>' +
          adminField(t('code'), '<input id="apCode" maxlength="3" value="' + v(a && a.code) + '"' + (a ? ' readonly' : '') + '>') +
          adminField(t('nameVi'), '<input id="apNameVi" value="' + v(a && a.name && a.name.vi) + '">') +
          adminField(t('nameEn'), '<input id="apNameEn" value="' + v(a && a.name && a.name.en) + '">') +
          adminField(t('province'), '<input id="apProvince" value="' + v(a && a.province) + '">') +
          adminField(t('airportName'), '<input id="apAirport" value="' + v(a && a.airport) + '">') +
          adminField(t('labelSide'), '<select id="apLabel">' + Admin.options(sides, a ? a.label : 'right') + '</select>') +
          adminField(t('lat'), '<input id="apLat" type="number" step="0.0001" value="' + v(a && a.lat) + '">') +
          adminField(t('lng'), '<input id="apLng" type="number" step="0.0001" value="' + v(a && a.lng) + '">') +
          '<label class="checkbox"><input type="checkbox" id="apActive"' + (!a || a.active !== false ? ' checked' : '') + '><span>' + t('active') + '</span></label>' +
          '<div class="form-actions"><button type="submit" class="primary-btn small">' + t(a ? 'save' : 'addNew') + '</button>' +
            (a ? '<button type="button" id="apCancel" class="ghost-btn small">' + t('cancelEdit') + '</button>' : '') + '</div>' +
        '</fieldset></form>' +
        '<div><div id="pickMap" class="pick-map"></div><small class="muted">' + t('pickOnMap') + '</small></div>' +
      '</div>' +
      Admin.table(
        [t('code'), t('nameVi'), t('province'), t('airportName'), t('lat') + ' / ' + t('lng'), t('status'), t('actions')],
        Store.airports.slice().sort((x, y) => x.code.localeCompare(y.code)).map(x => [
          '<b>' + esc(x.code) + '</b>',
          esc(x.name ? x.name.vi : ''),
          esc(x.province || ''),
          esc(x.airport || ''),
          Number(x.lat).toFixed(3) + ', ' + Number(x.lng).toFixed(3),
          Admin.status(x.active !== false),
          Store.networkSeeded()
            ? Admin.button('edit', x.code, 'edit') + Admin.button('toggle', x.code, x.active !== false ? 'disable' : 'enable', 'warn')
            : ''
        ])
      );

    document.getElementById('seedBtn').addEventListener('click', () => {
      if (confirm(t('seedConfirm'))) Admin.run(Store.seedDefaults(), 'seedDone');
    });
    document.getElementById('airportForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.save();
    });
    const cancel = document.getElementById('apCancel');
    if (cancel) cancel.addEventListener('click', () => { this.editing = null; this.render(el); });
    Admin.bindActions(el, {
      edit: (code) => { this.editing = code; this.render(el); },
      toggle: (code) => {
        const x = Store.airports.find(item => item.code === code);
        Admin.run(Store.saveDoc('airports', code, { active: x.active === false }), 'saved');
      }
    });
    this.initPickMap(a);
  },

  initPickMap(a) {
    this.pickMap = L.map('pickMap', { attributionControl: false }).setView([16, 107.5], 5);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 10 }).addTo(this.pickMap);
    for (const x of Store.airports) {
      L.circleMarker([x.lat, x.lng], { radius: 4, color: '#3b82f6', weight: 1, fillOpacity: 0.8 })
        .bindTooltip(esc(x.code)).addTo(this.pickMap);
    }
    if (a) this.setPick(a.lat, a.lng);
    this.pickMap.on('click', (e) => {
      if (document.querySelector('#airportForm fieldset').disabled) return;
      const lat = Math.round(e.latlng.lat * 10000) / 10000;
      const lng = Math.round(e.latlng.lng * 10000) / 10000;
      document.getElementById('apLat').value = lat;
      document.getElementById('apLng').value = lng;
      this.setPick(lat, lng);
    });
  },

  setPick(lat, lng) {
    if (this.pickMarker) this.pickMarker.remove();
    this.pickMarker = L.circleMarker([lat, lng], { radius: 8, color: '#ef4444', weight: 3, fillOpacity: 0.4 }).addTo(this.pickMap);
  },

  save() {
    const code = Admin.value('apCode').toUpperCase();
    const data = {
      code: code,
      name: { vi: Admin.value('apNameVi'), en: Admin.value('apNameEn') || Admin.value('apNameVi') },
      province: Admin.value('apProvince'),
      airport: Admin.value('apAirport'),
      label: Admin.value('apLabel'),
      lat: Number(Admin.value('apLat')),
      lng: Number(Admin.value('apLng')),
      active: Admin.value('apActive')
    };
    if (!/^[A-Z]{3}$/.test(code)) return Admin.notify(t('codeInvalid'));
    if (!this.editing && Store.airports.some(x => x.code === code)) return Admin.notify(t('routeExists'));
    if (!data.name.vi || !data.province || !data.airport || !Admin.value('apLat') || !Admin.value('apLng')) return Admin.notify(t('required'));
    if (data.lat < 7 || data.lat > 24 || data.lng < 101 || data.lng > 118) return Admin.notify(t('coordInvalid'));
    Admin.run(Store.saveDoc('airports', code, data), 'saved').then(() => { this.editing = null; });
  },

  onStore(kind) {
    if (kind === 'network') Admin.render();
  },

  leave() {
    if (this.pickMap) this.pickMap.remove();
    this.pickMap = null;
    this.pickMarker = null;
  }
};

const AdminRoutes = {
  editing: null,

  routeInfo(r) {
    const a = Store.airports.find(x => x.code === r.a);
    const b = Store.airports.find(x => x.code === r.b);
    if (!a || !b) return null;
    const live = ROUTES.find(x => x.a === r.a && x.b === r.b);
    if (live) return live;
    const km = distanceKm(a, b);
    return { km: Math.round(km), price: r.priceOverride || null, duration: Math.round((25 + km * 0.075) / 5) * 5 };
  },

  render(el) {
    const r = this.editing ? Store.routes.find(x => x.id === this.editing) : null;
    el.innerHTML =
      '<div class="admin-head"><h2>' + t('tabRoutes') + '</h2></div>' +
      Admin.seedWarning() +
      '<form id="routeForm" class="admin-form compact"><fieldset' + (Store.networkSeeded() ? '' : ' disabled') + '>' +
        adminField(t('routeFrom'), '<select id="rtA"' + (r ? ' disabled' : '') + '>' + Admin.airportOptions(r ? r.a : 'HAN', true) + '</select>') +
        adminField(t('routeTo'), '<select id="rtB"' + (r ? ' disabled' : '') + '>' + Admin.airportOptions(r ? r.b : 'SGN', true) + '</select>') +
        adminField(t('priceOverride'), '<input id="rtPrice" type="number" min="0" step="50000" value="' + (r && r.priceOverride ? r.priceOverride : '') + '">', true) +
        '<label class="checkbox"><input type="checkbox" id="rtActive"' + (!r || r.active !== false ? ' checked' : '') + '><span>' + t('active') + '</span></label>' +
        '<div class="form-actions"><button type="submit" class="primary-btn small">' + t(r ? 'save' : 'addNew') + '</button>' +
          (r ? '<button type="button" id="rtCancel" class="ghost-btn small">' + t('cancelEdit') + '</button>' : '') + '</div>' +
      '</fieldset></form>' +
      Admin.table(
        [t('tabRoutes'), t('distance'), t('basePrice'), t('duration'), t('status'), t('actions')],
        Store.routes.slice().sort((x, y) => (x.a + x.b).localeCompare(y.a + y.b)).map(x => {
          const info = this.routeInfo(x);
          return [
            '<b>' + esc(x.a) + ' ⇄ ' + esc(x.b) + '</b>',
            info ? t('km', { n: info.km }) : '—',
            info && info.price ? formatMoney(info.price) + (x.priceOverride ? ' ✎' : '') : '—',
            info ? formatDuration(info.duration) : '—',
            Admin.status(x.active !== false),
            Store.networkSeeded()
              ? Admin.button('edit', x.id, 'edit') + Admin.button('toggle', x.id, x.active !== false ? 'disable' : 'enable', 'warn') +
                Admin.button('remove', x.id, 'delete', 'danger')
              : ''
          ];
        })
      );

    document.getElementById('routeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.save();
    });
    const cancel = document.getElementById('rtCancel');
    if (cancel) cancel.addEventListener('click', () => { this.editing = null; this.render(el); });
    Admin.bindActions(el, {
      edit: (id) => { this.editing = id; this.render(el); },
      toggle: (id) => {
        const x = Store.routes.find(item => item.id === id);
        Admin.run(Store.saveDoc('routes', id, { active: x.active === false }), 'saved');
      },
      remove: (id) => {
        if (confirm(t('confirmDelete'))) Admin.run(Store.deleteDoc('routes', id), 'deleted');
      }
    });
  },

  save() {
    const a = this.editing ? Store.routes.find(x => x.id === this.editing).a : Admin.value('rtA');
    const b = this.editing ? Store.routes.find(x => x.id === this.editing).b : Admin.value('rtB');
    if (a === b) return Admin.notify(t('routeSame'));
    const id = this.editing || a + '-' + b;
    if (!this.editing && Store.routes.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a))) return Admin.notify(t('routeExists'));
    const price = Number(Admin.value('rtPrice'));
    Admin.run(Store.saveDoc('routes', id, { a: a, b: b, active: Admin.value('rtActive'), priceOverride: price > 0 ? price : null }), 'saved')
      .then(() => { this.editing = null; });
  },

  onStore(kind) {
    if (kind === 'network') Admin.render();
  }
};

const AdminIncidents = {
  draft: { date: toDateString(DATA_YEAR, DATA_MONTH, 1), type: 'cancel', from: 'HAN', to: 'SGN', code: 'DAD' },

  render(el) {
    const d = this.draft;
    const types = ['cancel', 'cancelFlight', 'close', 'delay', 'surge'].map(x => ({ value: x, label: t('incType_' + x) }));
    const dates = Admin.monthDates().map(x => ({ value: x, label: x.slice(8, 10) + '/' + x.slice(5, 7) }));
    el.innerHTML =
      '<div class="admin-head"><h2>' + t('tabIncidents') + '</h2></div>' +
      '<form id="incForm" class="admin-form compact">' +
        adminField(t('incDate'), '<select id="incDate">' + Admin.options(dates, d.date) + '</select>') +
        adminField(t('incType'), '<select id="incType">' + Admin.options(types, d.type) + '</select>') +
        '<span class="inc-leg">' +
          adminField(t('routeFrom'), '<select id="incFrom">' + Admin.airportOptions(d.from) + '</select>') +
          adminField(t('routeTo'), '<select id="incTo">' + Admin.airportOptions(d.to) + '</select>') +
        '</span>' +
        '<span class="inc-close">' + adminField(t('airportName'), '<select id="incCode">' + Admin.airportOptions(d.code) + '</select>') + '</span>' +
        '<span class="inc-flight">' + adminField(t('incFlight'), '<select id="incFlightId"></select>') + '</span>' +
        adminField(t('incNote'), '<input id="incNote" maxlength="120">', true) +
        '<div class="form-actions"><button type="submit" class="primary-btn small">' + t('incCreate') + '</button></div>' +
      '</form>' +
      Admin.table(
        [t('incDate'), t('tabIncidents'), t('actions')],
        Store.incidents.slice().sort((x, y) => x.date.localeCompare(y.date)).map(inc => [
          inc.date.slice(8, 10) + '/' + inc.date.slice(5, 7),
          App.incidentText(inc),
          Admin.button('remove', inc.id, 'delete', 'danger')
        ])
      );

    ['incDate', 'incType', 'incFrom', 'incTo', 'incCode'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.sync());
    });
    document.getElementById('incForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.create();
    });
    Admin.bindActions(el, {
      remove: (id) => {
        if (confirm(t('confirmDelete'))) Admin.run(Store.removeIncident(id), 'deleted');
      }
    });
    this.sync();
  },

  sync() {
    const d = this.draft;
    d.date = Admin.value('incDate');
    d.type = Admin.value('incType');
    d.from = Admin.value('incFrom');
    d.to = Admin.value('incTo');
    d.code = Admin.value('incCode');
    document.querySelector('.inc-leg').hidden = d.type === 'close';
    document.querySelector('.inc-close').hidden = d.type !== 'close';
    document.querySelector('.inc-flight').hidden = d.type !== 'cancelFlight';
    const flights = flightsOn(d.date).filter(f => f.from === d.from && f.to === d.to);
    document.getElementById('incFlightId').innerHTML = flights.length
      ? Admin.options(flights.map(f => ({ value: f.id, label: f.id + ' · ' + f.depart + ' · ' + f.airline })), flights[0].id)
      : '<option value="">' + t('noFlights') + '</option>';
  },

  build() {
    const d = this.draft;
    const note = Admin.value('incNote');
    const base = { date: d.date, note: note };
    if (d.type === 'close') return { ...base, type: 'close', code: d.code };
    if (d.from === d.to) return null;
    if (d.type === 'cancelFlight') {
      const flightId = Admin.value('incFlightId');
      if (!flightId) return null;
      return { ...base, type: 'cancel', from: d.from, to: d.to, flightId: flightId };
    }
    return { ...base, type: d.type, from: d.from, to: d.to };
  },

  async create() {
    const incident = this.build();
    if (!incident) return Admin.notify(t('required'));
    await Admin.run(Store.addIncident(incident));
    let affected = 0;
    if (typeof AdminBookings !== 'undefined') affected = await AdminBookings.applyIncident(incident);
    Admin.notify(t('incCreated', { n: affected }));
  },

  onStore(kind) {
    if (kind === 'incidents' || kind === 'network') Admin.render();
  }
};

Admin.register('airports', AdminAirports);
Admin.register('routes', AdminRoutes);
Admin.register('incidents', AdminIncidents);
