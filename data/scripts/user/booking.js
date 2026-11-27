const Booking = {
  mine: [],
  unsub: null,
  draft: null,
  notifiedAffected: new Set(),

  init() {
    document.getElementById('bookConfirmBtn').addEventListener('click', () => this.confirm());
    document.getElementById('ticketsList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ticket-action]');
      if (btn) this.act(btn.dataset.ticketAction, btn.dataset.id);
    });
    document.addEventListener('storechange', (e) => {
      if (e.detail.kind === 'auth') this.watch();
    });
    document.addEventListener('languagechange', () => {
      if (!document.getElementById('ticketsModal').hidden) this.renderTickets();
      if (!document.getElementById('bookModal').hidden && this.draft) this.renderDraft();
    });
  },

  watch() {
    const uid = Store.user ? Store.user.uid : null;
    if (this.unsubUid === uid) return;
    if (this.unsub) this.unsub();
    this.unsub = null;
    this.unsubUid = uid;
    this.mine = [];
    if (!uid) return;
    this.unsub = Store.watchMyBookings(list => {
      this.mine = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const fresh = this.mine.filter(b => b.status === 'affected' && !this.notifiedAffected.has(b.id));
      fresh.forEach(b => this.notifiedAffected.add(b.id));
      if (fresh.length) App.toast(t('affectedTickets', { n: fresh.length }));
      if (!document.getElementById('ticketsModal').hidden) this.renderTickets();
      Account.render();
    });
  },

  affectedCount() {
    return this.mine.filter(b => b.status === 'affected').length;
  },

  statusBadge(status) {
    return '<span class="status-badge status-' + status + '">' + t('status_' + status) + '</span>';
  },

  segmentLine(seg, index) {
    const label = seg.kind === 'return' ? t('segmentReturn') : t('segmentOut', { i: index + 1 });
    const path = [seg.from].concat(seg.legs.map(l => l.to)).join(' → ');
    const legs = seg.legs.map(l => esc(l.id) + ' ' + l.depart + '–' + l.arrive).join(', ');
    return '<div class="ticket-seg"><b>' + label + '</b> · ' + seg.date.slice(8, 10) + '/' + seg.date.slice(5, 7) +
      '<div>' + esc(path) + '</div><small>' + legs + '</small></div>';
  },

  openBook() {
    if (!Store.online) return App.toast(t('bookOffline'));
    if (!Store.user) {
      App.toast(t('bookNeedLogin'));
      return Account.open('login');
    }
    this.draft = App.bookingDraft();
    if (!this.draft) return;
    this.renderDraft();
    document.getElementById('bookModal').hidden = false;
  },

  renderDraft() {
    const d = this.draft;
    const profile = Store.profile || {};
    const q = d.quote;
    let html = '<div class="book-meta"><span class="tag">' + t('fc_' + d.fareClass) + '</span> ' +
      '<span class="tag">' + t('tier_' + d.tier) + '</span></div>' +
      d.segments.map((seg, i) => this.segmentLine(seg, i)).join('') +
      '<div class="quote">';
    for (const line of q.lines) {
      html += '<div class="summary-row"><span>' + t('pax_' + line.type) + ' × ' + line.count + '</span><b>' + formatMoney(line.amount) + '</b></div>';
    }
    if (q.promoSaving > 0) html += '<div class="summary-row promo"><span>' + t('promoSaving') + '</span><b>−' + formatMoney(q.promoSaving) + '</b></div>';
    if (q.tierDiscount > 0) html += '<div class="summary-row promo"><span>' + t('memberDiscount', { tier: t('tier_' + d.tier), p: q.tierPercent }) + '</span><b>−' + formatMoney(q.tierDiscount) + '</b></div>';
    html += '<div class="summary-row grand"><span>' + t('grandTotal') + '</span><b>' + formatMoney(d.total) + '</b></div></div>' +
      '<p class="message">' + t('contact') + ': ' + esc(profile.name || '') + ' · ' + esc(Store.user.email) + ' · ' + esc(profile.phone || '') + '</p>';
    document.getElementById('bookBody').innerHTML = html;
  },

  async confirm() {
    const btn = document.getElementById('bookConfirmBtn');
    btn.disabled = true;
    try {
      const profile = Store.profile || {};
      const code = await Store.createBooking({
        ...this.draft,
        contact: { name: profile.name || '', email: Store.user.email, phone: profile.phone || '' },
        history: [{ at: Store.now(), action: 'created', by: 'customer' }]
      });
      document.getElementById('bookModal').hidden = true;
      App.toast(t('bookDone', { code: code }));
    } catch (err) {
      App.toast(err.code || err.message);
    } finally {
      btn.disabled = false;
    }
  },

  openMyTickets() {
    this.renderTickets();
    document.getElementById('ticketsModal').hidden = false;
  },

  renderTickets() {
    const box = document.getElementById('ticketsList');
    if (!this.mine.length) {
      box.innerHTML = '<p class="message">' + t('noTickets') + '</p>';
      return;
    }
    box.innerHTML = this.mine.map(b => this.ticketHtml(b)).join('');
  },

  ticketHtml(b) {
    const pax = (b.passengers.adult || 0) + (b.passengers.child || 0) + (b.passengers.infant || 0);
    let html = '<div class="ticket status-' + b.status + '">' +
      '<div class="ticket-head"><b>' + t('bookCode') + ': ' + esc(b.code) + '</b>' + this.statusBadge(b.status) + '</div>' +
      '<div class="ticket-meta">' + t('fc_' + b.fareClass) + ' · ' + t('passengersCount', { n: pax }) + ' · ' +
        t('bookedAt') + ' ' + new Date(b.createdAt).toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US') + '</div>' +
      b.segments.map((seg, i) => this.segmentLine(seg, i)).join('') +
      '<div class="summary-row grand"><span>' + t('grandTotal') + '</span><b>' + formatMoney(b.total) + '</b></div>';

    if (b.status === 'affected' && b.affected) {
      html += '<div class="ticket-alert"><p>' + t('affectedBy', { incident: esc(b.affected.text) }) + '</p>';
      if (b.suggestion && b.suggestion.segments) {
        const seg = b.suggestion.segments[b.affected.segmentIndex];
        html += '<p><b>' + t('suggestionTitle') + '</b></p>' + this.segmentLine(seg, b.affected.segmentIndex);
        html += '<button type="button" class="primary-btn small" data-ticket-action="change" data-id="' + b.id + '">' + t('acceptChange') + '</button> ';
      } else {
        html += '<p class="warn">' + t('noSuggestion') + '</p>';
      }
      html += '<button type="button" class="ghost-btn small" data-ticket-action="refund" data-id="' + b.id + '">' + t('refundFull') + '</button></div>';
    }
    if (b.status === 'confirmed' || b.status === 'changed') {
      html += '<div class="ticket-actions"><button type="button" class="ghost-btn small" data-ticket-action="refund" data-id="' + b.id + '">' +
        t('requestRefund', { p: Store.pricing.refundVoluntary }) + '</button></div>';
    }
    if (b.refund) {
      html += '<p class="message">' + t('refundAmount', { amount: formatMoney(b.refund.amount) }) + ' (' + b.refund.percent + '%)</p>';
    }
    html += '<details class="ticket-history"><summary>' + t('history') + '</summary><ul>' +
      (b.history || []).map(h => '<li>' + new Date(h.at).toLocaleString(currentLang === 'vi' ? 'vi-VN' : 'en-US') + ' – ' + t('h_' + h.action) +
        (h.note ? ': ' + esc(h.note) : '') + '</li>').join('') + '</ul></details></div>';
    return html;
  },

  async act(action, id) {
    const b = this.mine.find(x => x.id === id);
    if (!b) return;
    const history = (b.history || []).concat({ at: Store.now(), action: action === 'change' ? 'changed' : 'refund_requested', by: 'customer' });
    try {
      if (action === 'change') {
        await Store.updateBooking(id, { status: 'changed', segments: b.suggestion.segments, total: b.suggestion.total, history: history });
        App.toast(t('changeDone'));
      } else {
        const percent = b.status === 'affected' ? 100 : Store.pricing.refundVoluntary;
        const amount = Math.round(b.total * percent / 100 / 1000) * 1000;
        if (!confirm(t('refundConfirm', { amount: formatMoney(amount) }))) return;
        await Store.updateBooking(id, {
          status: 'refund_requested',
          refund: { percent: percent, amount: amount, reason: b.status === 'affected' ? 'incident' : 'voluntary', from: b.status, requestedAt: Store.now() },
          history: history
        });
        App.toast(t('refundRequested'));
      }
    } catch (err) {
      App.toast(err.code || err.message);
    }
  }
};
