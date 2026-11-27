const Store = {
  online: false,
  db: null,
  auth: null,
  user: null,
  profile: null,
  airports: DEFAULT_AIRPORTS.map(a => ({ ...a, active: true })),
  routes: defaultRouteDefs(),
  seeded: false,
  routesSeeded: false,
  incidents: [],
  promotions: [],
  pricing: DEFAULT_PRICING,
  profileUnsub: null,

  configured() {
    return typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined' && !!FIREBASE_CONFIG.apiKey &&
      location.protocol.startsWith('http');
  },

  init() {
    if (!this.configured()) return;
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      this.db = firebase.firestore();
      this.auth = firebase.auth();
      if (new URLSearchParams(location.search).get('emulator') === '1') {
        this.db.useEmulator('localhost', 8080);
        this.auth.useEmulator('http://localhost:9099', { disableWarnings: true });
      }
      this.online = true;
    } catch (err) {
      console.warn('Firebase disabled:', err.message);
      return;
    }

    this.watch('airports', docs => {
      this.seeded = docs.length > 0;
      this.airports = docs.length ? docs : DEFAULT_AIRPORTS.map(a => ({ ...a, active: true }));
      this.rebuild();
    });
    this.watch('routes', docs => {
      this.routesSeeded = docs.length > 0;
      this.routes = docs.length ? docs : defaultRouteDefs();
      this.rebuild();
    });
    this.watch('incidents', docs => {
      this.incidents = docs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      this.emit('incidents');
    });
    this.watch('promotions', docs => {
      this.promotions = docs;
      this.emit('promotions');
    });
    this.db.collection('settings').doc('pricing').onSnapshot(snap => {
      const data = snap.exists ? snap.data() : {};
      this.pricing = {
        fareClass: { ...DEFAULT_PRICING.fareClass, ...(data.fareClass || {}) },
        passenger: { ...DEFAULT_PRICING.passenger, ...(data.passenger || {}) },
        tier: { ...DEFAULT_PRICING.tier, ...(data.tier || {}) },
        refundVoluntary: data.refundVoluntary != null ? data.refundVoluntary : DEFAULT_PRICING.refundVoluntary
      };
      this.emit('pricing');
    }, err => this.fail(err));

    this.auth.onAuthStateChanged(user => this.onAuth(user));
  },

  watch(name, callback) {
    this.db.collection(name).onSnapshot(
      snap => callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      err => this.fail(err)
    );
  },

  watchCollection(name, callback) {
    return this.db.collection(name).onSnapshot(
      snap => callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      err => this.fail(err)
    );
  },

  networkSeeded() {
    return this.seeded && this.routesSeeded;
  },

  fail(err) {
    console.warn('Firestore:', err.code || err.message);
  },

  rebuild() {
    rebuildNetwork(this.airports, this.routes);
    this.emit('network');
  },

  emit(kind) {
    document.dispatchEvent(new CustomEvent('storechange', { detail: { kind: kind } }));
  },

  onAuth(user) {
    this.user = user;
    if (this.profileUnsub) this.profileUnsub();
    this.profileUnsub = null;
    this.profile = null;
    if (!user) {
      this.emit('auth');
      return;
    }
    this.profileUnsub = this.db.collection('users').doc(user.uid).onSnapshot(snap => {
      this.profile = snap.exists ? { uid: user.uid, ...snap.data() } : null;
      this.emit('auth');
    }, err => this.fail(err));
  },

  isAdmin() {
    return !!(this.profile && this.profile.role === 'admin');
  },

  tier() {
    return this.profile && this.profile.tier ? this.profile.tier : 'standard';
  },

  now() {
    return Date.now();
  },

  async signUp(info) {
    const cred = await this.auth.createUserWithEmailAndPassword(info.email, info.password);
    await this.db.collection('users').doc(cred.user.uid).set({
      name: info.name,
      email: info.email,
      phone: info.phone || '',
      role: 'customer',
      tier: 'standard',
      createdAt: this.now()
    });
  },

  signIn(email, password) {
    return this.auth.signInWithEmailAndPassword(email, password);
  },

  signOut() {
    return this.auth.signOut();
  },

  addIncident(incident) {
    return this.db.collection('incidents').add({ ...incident, createdAt: this.now(), createdBy: this.user ? this.user.uid : null });
  },

  removeIncident(id) {
    return this.db.collection('incidents').doc(id).delete();
  },

  saveDoc(collection, id, data) {
    const ref = id ? this.db.collection(collection).doc(id) : this.db.collection(collection).doc();
    return ref.set({ ...data, updatedAt: this.now() }, { merge: true }).then(() => ref.id);
  },

  deleteDoc(collection, id) {
    return this.db.collection(collection).doc(id).delete();
  },

  async seedDefaults() {
    const batch = this.db.batch();
    for (const a of DEFAULT_AIRPORTS) {
      batch.set(this.db.collection('airports').doc(a.code), { ...a, active: true, updatedAt: this.now() });
    }
    for (const r of defaultRouteDefs()) {
      batch.set(this.db.collection('routes').doc(r.a + '-' + r.b), { ...r, updatedAt: this.now() });
    }
    batch.set(this.db.collection('settings').doc('pricing'), { ...DEFAULT_PRICING, updatedAt: this.now() });
    await batch.commit();
  }
};
