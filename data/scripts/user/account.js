const Account = {
  tab: 'login',

  init() {
    document.querySelectorAll('#authTabs button').forEach(btn => {
      btn.addEventListener('click', () => this.setTab(btn.dataset.tab));
    });
    document.getElementById('authForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.closeModal).hidden = true;
      });
    });
    document.addEventListener('storechange', (e) => {
      if (e.detail.kind === 'auth') this.render();
    });
    document.addEventListener('languagechange', () => this.render());
    this.render();
  },

  open(tab) {
    this.setTab(tab || 'login');
    document.getElementById('authError').hidden = true;
    document.getElementById('authModal').hidden = false;
    document.getElementById('authEmail').focus();
  },

  close() {
    document.getElementById('authModal').hidden = true;
  },

  setTab(tab) {
    this.tab = tab;
    document.querySelectorAll('#authTabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('#authForm .reg-only').forEach(el => { el.hidden = tab !== 'register'; });
    document.getElementById('authName').required = tab === 'register';
    document.getElementById('authSubmit').textContent = t(tab === 'register' ? 'register' : 'login');
  },

  errorText(err) {
    const map = {
      'auth/invalid-credential': 'authWrong',
      'auth/wrong-password': 'authWrong',
      'auth/user-not-found': 'authWrong',
      'auth/invalid-login-credentials': 'authWrong',
      'auth/email-already-in-use': 'authEmailUsed',
      'auth/weak-password': 'authWeak',
      'auth/invalid-email': 'authInvalidEmail',
      'auth/operation-not-allowed': 'authNotEnabled'
    };
    return map[err.code] ? t(map[err.code]) : t('authFailed', { code: err.code || err.message });
  },

  async submit() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const error = document.getElementById('authError');
    const button = document.getElementById('authSubmit');
    error.hidden = true;
    button.disabled = true;
    try {
      if (this.tab === 'register') {
        await Store.signUp({
          email: email,
          password: password,
          name: document.getElementById('authName').value.trim(),
          phone: document.getElementById('authPhone').value.trim()
        });
      } else {
        await Store.signIn(email, password);
      }
      document.getElementById('authForm').reset();
      this.close();
    } catch (err) {
      error.textContent = this.errorText(err);
      error.hidden = false;
    } finally {
      button.disabled = false;
    }
  },

  render() {
    const area = document.getElementById('accountArea');
    area.innerHTML = '';
    if (!Store.online) return;

    if (!Store.user) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ghost-btn small';
      btn.id = 'loginBtn';
      btn.textContent = t('login');
      btn.addEventListener('click', () => this.open('login'));
      area.appendChild(btn);
      return;
    }

    const profile = Store.profile || {};
    const tier = Store.tier();
    const chip = document.createElement('span');
    chip.className = 'user-chip';
    chip.innerHTML = '<b>' + esc(profile.name || Store.user.email) + '</b>' +
      '<span class="tier-badge tier-' + tier + '">' + t('tier_' + tier) + '</span>' +
      (Store.isAdmin() ? '<span class="tier-badge tier-admin">' + t('adminRole') + '</span>' : '');
    area.appendChild(chip);

    const buttons = [];
    if (typeof Booking !== 'undefined') buttons.push({ id: 'myTicketsBtn', key: 'myTickets', run: () => Booking.openMyTickets() });
    if (Store.isAdmin()) buttons.push({ id: 'adminBtn', key: 'adminPage', run: () => { location.hash = '#admin'; } });
    buttons.push({ id: 'logoutBtn', key: 'logout', run: () => Store.signOut() });

    for (const b of buttons) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ghost-btn small';
      btn.id = b.id;
      btn.textContent = t(b.key);
      btn.addEventListener('click', b.run);
      area.appendChild(btn);
    }
  }
};
