const AdminPromotions = {
  editing: null,

  render(el) {
    const p = this.editing ? Store.promotions.find(x => x.id === this.editing) : null;
    const routes = [{ value: '', label: t('allRoutes') }].concat(
      ROUTES.map(r => ({ value: r.a + '-' + r.b, label: r.a + ' ⇄ ' + r.b }))
    );
    const classes = [{ value: 'all', label: t('allClasses') }].concat(FARE_CLASSES.map(fc => ({ value: fc, label: t('fc_' + fc) })));
    const first = toDateString(DATA_YEAR, DATA_MONTH, 1);
    const last = toDateString(DATA_YEAR, DATA_MONTH, new Date(DATA_YEAR, DATA_MONTH, 0).getDate());

    el.innerHTML =
      '<div class="admin-head"><h2>' + t('tabPromotions') + '</h2></div>' +
      '<form id="promoForm" class="admin-form compact">' +
        adminField(t('promoName'), '<input id="prName" maxlength="60" value="' + esc(p ? p.name : '') + '">', true) +
        adminField(t('promoPercent'), '<input id="prPercent" type="number" min="1" max="90" value="' + (p ? p.percent : 10) + '">') +
        adminField(t('promoRoute'), '<select id="prRoute">' + Admin.options(routes, p ? p.route || '' : '') + '</select>') +
        adminField(t('dateFrom'), '<input id="prFrom" type="date" min="' + first + '" max="' + last + '" value="' + (p ? p.dateFrom : first) + '">') +
        adminField(t('dateTo'), '<input id="prTo" type="date" min="' + first + '" max="' + last + '" value="' + (p ? p.dateTo : last) + '">') +
        adminField(t('promoClass'), '<select id="prClass">' + Admin.options(classes, p ? p.fareClass || 'all' : 'all') + '</select>') +
        '<label class="checkbox"><input type="checkbox" id="prActive"' + (!p || p.active !== false ? ' checked' : '') + '><span>' + t('active') + '</span></label>' +
        '<div class="form-actions"><button type="submit" class="primary-btn small">' + t(p ? 'save' : 'addNew') + '</button>' +
          (p ? '<button type="button" id="prCancel" class="ghost-btn small">' + t('cancelEdit') + '</button>' : '') + '</div>' +
      '</form>' +
      Admin.table(
        [t('promoName'), t('promoPercent'), t('promoRoute'), t('dateFrom') + ' – ' + t('dateTo'), t('promoClass'), t('status'), t('actions')],
        Store.promotions.map(x => [
          '<b>' + esc(x.name) + '</b>',
          '−' + x.percent + '%',
          x.route ? esc(x.route.replace('-', ' ⇄ ')) : t('allRoutes'),
          esc(x.dateFrom) + ' – ' + esc(x.dateTo),
          x.fareClass && x.fareClass !== 'all' ? t('fc_' + x.fareClass) : t('allClasses'),
          Admin.status(x.active !== false),
          Admin.button('edit', x.id, 'edit') + Admin.button('toggle', x.id, x.active !== false ? 'disable' : 'enable', 'warn') +
            Admin.button('remove', x.id, 'delete', 'danger')
        ])
      );

    document.getElementById('promoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.save();
    });
    const cancel = document.getElementById('prCancel');
    if (cancel) cancel.addEventListener('click', () => { this.editing = null; this.render(el); });
    Admin.bindActions(el, {
      edit: (id) => { this.editing = id; this.render(el); },
      toggle: (id) => {
        const x = Store.promotions.find(item => item.id === id);
        Admin.run(Store.saveDoc('promotions', id, { active: x.active === false }), 'saved');
      },
      remove: (id) => {
        if (confirm(t('confirmDelete'))) Admin.run(Store.deleteDoc('promotions', id), 'deleted');
      }
    });
  },

  save() {
    const percent = Number(Admin.value('prPercent'));
    const data = {
      name: Admin.value('prName'),
      percent: percent,
      route: Admin.value('prRoute') || null,
      dateFrom: Admin.value('prFrom'),
      dateTo: Admin.value('prTo'),
      fareClass: Admin.value('prClass'),
      active: Admin.value('prActive')
    };
    if (!data.name || !data.dateFrom || !data.dateTo || data.dateFrom > data.dateTo) return Admin.notify(t('required'));
    if (!(percent >= 1 && percent <= 90)) return Admin.notify(t('percentInvalid'));
    Admin.run(Store.saveDoc('promotions', this.editing, data), 'saved').then(() => { this.editing = null; });
  },

  onStore(kind) {
    if (kind === 'promotions' || kind === 'network') Admin.render();
  }
};

const AdminCustomers = {
  users: [],
  unsub: null,

  render(el) {
    if (!this.unsub) {
      this.unsub = Store.watchCollection('users', users => {
        this.users = users;
        if (Admin.active && Admin.current === 'customers') this.draw(el);
      });
    }
    this.draw(el);
  },

  draw(el) {
    const tiers = MEMBER_TIERS.map(x => ({ value: x, label: t('tier_' + x) }));
    const roles = ['customer', 'admin'].map(x => ({ value: x, label: t('role_' + x) }));
    el.innerHTML =
      '<div class="admin-head"><h2>' + t('tabCustomers') + '</h2></div>' +
      Admin.table(
        [t('customerName'), t('email'), t('phone'), t('tierLabel'), t('role')],
        this.users.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(u => [
          '<b>' + esc(u.name || '—') + '</b>',
          esc(u.email || ''),
          esc(u.phone || ''),
          '<select class="mini-select" data-field="tier" data-id="' + esc(u.id) + '">' + Admin.options(tiers, u.tier || 'standard') + '</select>',
          '<select class="mini-select" data-field="role" data-id="' + esc(u.id) + '">' + Admin.options(roles, u.role || 'customer') + '</select>'
        ])
      );
    el.querySelectorAll('select[data-field]').forEach(select => {
      select.addEventListener('change', () => {
        const field = select.dataset.field;
        const uid = select.dataset.id;
        if (field === 'role' && uid === Store.user.uid && select.value !== 'admin') {
          select.value = 'admin';
          return Admin.notify(t('cannotSelf'));
        }
        Admin.run(Store.saveDoc('users', uid, { [field]: select.value }), 'saved');
      });
    });
  },

  leave() {
    if (this.unsub) this.unsub();
    this.unsub = null;
  }
};

const AdminPricing = {
  render(el) {
    const p = Store.pricing;
    const input = (id, value, step) => '<input id="' + id + '" type="number" min="0" step="' + step + '" value="' + value + '">';
    el.innerHTML =
      '<div class="admin-head"><h2>' + t('tabPricing') + '</h2></div>' +
      '<form id="pricingForm" class="admin-form pricing-form">' +
        '<h3>' + t('pricingFare') + '</h3><div class="form-row">' +
          FARE_CLASSES.map(fc => adminField(t('fc_' + fc), input('pf_' + fc, p.fareClass[fc], 0.05))).join('') + '</div>' +
        '<h3>' + t('pricingPax') + '</h3><div class="form-row">' +
          PASSENGER_TYPES.map(x => adminField(t('pax_' + x), input('pp_' + x, p.passenger[x], 0.05))).join('') + '</div>' +
        '<h3>' + t('pricingTier') + '</h3><div class="form-row">' +
          MEMBER_TIERS.map(x => adminField(t('tier_' + x), input('pt_' + x, p.tier[x], 1))).join('') + '</div>' +
        '<div class="form-row">' + adminField(t('refundVoluntary'), input('pRefund', p.refundVoluntary, 1)) + '</div>' +
        '<div class="form-actions"><button type="submit" class="primary-btn small">' + t('save') + '</button></div>' +
      '</form>';
    document.getElementById('pricingForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.save();
    });
  },

  save() {
    const num = (id) => Number(Admin.value(id));
    const data = { fareClass: {}, passenger: {}, tier: {}, refundVoluntary: num('pRefund') };
    FARE_CLASSES.forEach(fc => { data.fareClass[fc] = num('pf_' + fc); });
    PASSENGER_TYPES.forEach(x => { data.passenger[x] = num('pp_' + x); });
    MEMBER_TIERS.forEach(x => { data.tier[x] = num('pt_' + x); });
    const values = [data.refundVoluntary].concat(Object.values(data.fareClass), Object.values(data.passenger), Object.values(data.tier));
    if (values.some(v => !Number.isFinite(v) || v < 0) || data.refundVoluntary > 100 || Object.values(data.tier).some(v => v > 90)) {
      return Admin.notify(t('required'));
    }
    Admin.run(Store.saveDoc('settings', 'pricing', data), 'saved');
  },

  onStore(kind) {
    if (kind === 'pricing') Admin.render();
  }
};

Admin.register('promotions', AdminPromotions);
Admin.register('customers', AdminCustomers);
Admin.register('pricing', AdminPricing);
