const AdminBookings = {
  bookings: [],
  unsub: null,
  filter: 'all',

  async applyIncident(incident) {
    const snap = await Store.db.collection('bookings').where('status', 'in', ['confirmed', 'changed']).get();
    const incidents = Store.incidents.filter(inc => inc.id !== incident.id).concat(incident);
    const codes = CITIES.map(c => c.code);
    let count = 0;

    for (const doc of snap.docs) {
      const b = { id: doc.id, ...doc.data() };
      const index = b.segments.findIndex(seg => affectedLegIndex(routeFromLegs(seg.from, seg.legs), incident) >= 0);
      if (index < 0) continue;

      const seg = b.segments[index];
      const route = routeFromLegs(seg.from, seg.legs);
      const legIndex = affectedLegIndex(route, incident);
      const flights = prepareFlights(flightsOn(seg.date), { fareClass: b.fareClass, promotions: Store.promotions, pricing: Store.pricing });
      const graph = buildGraph(codes, flights, seg.date, 'price', incidents);
      const out = reroute(route, legIndex, graph, seg.to);

      let suggestion = { segments: null, total: b.total };
      if (out.newRoute) {
        suggestion = {
          segments: b.segments.map((s, i) => i === index ? { ...s, legs: out.newRoute.legs.map(leg => App.legRecord(leg)) } : s),
          total: b.total,
          cost: out.newRoute.totalPrice
        };
      }
      await Store.updateBooking(b.id, {
        status: 'affected',
        affected: { incidentId: incident.id || null, text: App.incidentText(incident), segmentIndex: index, at: Store.now() },
        suggestion: suggestion,
        history: (b.history || []).concat({ at: Store.now(), action: 'affected', by: 'admin', note: App.incidentText(incident) })
      });
      count++;
    }
    return count;
  },

  render(el) {
    if (!this.unsub) {
      this.unsub = Store.watchCollection('bookings', list => {
        this.bookings = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (Admin.active && Admin.current === 'bookings') this.draw(el);
      });
    }
    this.draw(el);
  },

  draw(el) {
    const statuses = ['confirmed', 'affected', 'changed', 'refund_requested', 'refunded', 'cancelled'];
    const options = [{ value: 'all', label: t('allStatuses') }].concat(statuses.map(s => ({ value: s, label: t('status_' + s) })));
    const list = this.bookings.filter(b => this.filter === 'all' || b.status === this.filter);

    el.innerHTML =
      '<div class="admin-head"><h2>' + t('tabBookings') + '</h2>' +
        '<label class="field inline"><span>' + t('filterStatus') + '</span><select id="bkFilter">' + Admin.options(options, this.filter) + '</select></label></div>' +
      Admin.table(
        [t('bookCode'), t('customerName'), t('tabRoutes'), t('fareClassLabel'), t('grandTotal'), t('status'), t('actions')],
        list.map(b => [
          '<b>' + esc(b.code) + '</b><br><small class="muted">' + new Date(b.createdAt).toLocaleString(currentLang === 'vi' ? 'vi-VN' : 'en-US') + '</small>',
          esc(b.contact ? b.contact.name : '') + '<br><small class="muted">' + esc(b.contact ? b.contact.email : '') + '</small>',
          b.segments.map(s => esc([s.from].concat(s.legs.map(l => l.to)).join('→')) + ' <small class="muted">' + s.date.slice(8, 10) + '/' + s.date.slice(5, 7) + '</small>').join('<br>'),
          t('fc_' + b.fareClass) + '<br><small class="muted">' + t('passengersCount', { n: (b.passengers.adult || 0) + (b.passengers.child || 0) + (b.passengers.infant || 0) }) + '</small>',
          formatMoney(b.total) + (b.refund ? '<br><small class="muted">' + t('refundAmount', { amount: formatMoney(b.refund.amount) }) + '</small>' : ''),
          Booking.statusBadge(b.status) + (b.affected ? '<br><small class="muted">' + esc(b.affected.text) + '</small>' : ''),
          this.actions(b)
        ])
      );

    document.getElementById('bkFilter').addEventListener('change', (e) => {
      this.filter = e.target.value;
      this.draw(el);
    });
    Admin.bindActions(el, {
      approve: (id) => this.update(id, 'refunded', (b) => ({ refund: { ...b.refund, approvedAt: Store.now() } })),
      reject: (id) => this.update(id, null, (b) => ({ status: b.refund && b.refund.from ? b.refund.from : 'confirmed', refund: null }), 'rejected'),
      cancel: (id) => {
        if (confirm(t('confirmDelete'))) this.update(id, 'cancelled', () => ({}));
      }
    });
  },

  actions(b) {
    if (b.status === 'refund_requested') {
      return Admin.button('approve', b.id, 'approveRefund') + Admin.button('reject', b.id, 'rejectRefund', 'warn');
    }
    if (['confirmed', 'changed', 'affected'].includes(b.status)) return Admin.button('cancel', b.id, 'cancelTicket', 'danger');
    return '';
  },

  update(id, status, extra, action) {
    const b = this.bookings.find(x => x.id === id);
    const fields = extra(b);
    if (status) fields.status = status;
    fields.history = (b.history || []).concat({ at: Store.now(), action: action || status, by: 'admin' });
    Admin.run(Store.updateBooking(id, fields), 'saved');
  },

  leave() {
    if (this.unsub) this.unsub();
    this.unsub = null;
  }
};

Admin.register('bookings', AdminBookings);
