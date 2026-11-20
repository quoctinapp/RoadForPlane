const Simulator = {
  steps: [],
  index: -1,
  timer: null,
  nodes: [],
  mode: 'price',
  onReset: null,

  load(result, nodes, mode) {
    this.pause();
    this.steps = result.steps;
    this.nodes = nodes;
    this.mode = mode;
    this.index = -1;
    this.render();
  },

  delay() {
    const speed = Number(document.getElementById('speedRange').value);
    return 2400 / speed;
  },

  play() {
    if (this.timer) return;

    if (this.index >= this.steps.length - 1) this.index = -1;
    this.timer = true;
    this.updatePlayButton();

    const tick = () => {
      if (!this.next()) { this.pause(); return; }
      this.timer = setTimeout(tick, this.delay());
    };
    tick();
  },

  pause() {
    if (this.timer && this.timer !== true) clearTimeout(this.timer);
    this.timer = null;
    this.updatePlayButton();
  },

  togglePlay() {
    if (this.timer) this.pause(); else this.play();
  },

  next() {
    if (this.index >= this.steps.length - 1) return false;
    this.index++;
    this.render();
    return true;
  },

  stepOnce() {
    this.pause();
    if (this.index >= this.steps.length - 1) this.index = -1;
    this.next();
  },

  reset() {
    this.pause();
    this.index = -1;
    this.render();
    if (this.onReset) this.onReset();
  },

  updatePlayButton() {
    const btn = document.getElementById('playBtn');
    btn.innerHTML = this.timer ? '⏸ ' + t('pause') : '▶ ' + t('play');
  },

  render() {
    const step = this.index >= 0 ? this.steps[this.index] : null;
    MapView.clearSimulation();

    document.getElementById('stepCounter').textContent =
      this.steps.length ? t('stepOf', { i: this.index + 1, n: this.steps.length }) : '';

    if (step) {
      for (const v of this.nodes) {
        const d = step.dist[v];
        let state = '';
        if (step.visited[v]) state = 'visited';
        else if (d !== Infinity) state = 'frontier';
        MapView.setNodeState(v, state);
        MapView.setNodeBadge(v, d !== Infinity ? 'd=' + formatWeight(d, this.mode) : '');
      }

      if (step.type === 'select') MapView.setNodeState(step.u, 'current');
      if (step.type === 'relax' || step.type === 'skip') {
        MapView.setNodeState(step.u, 'current');
        MapView.flashEdge(step.u, step.v, step.type === 'relax' && step.updated);
      }

      if (step.type === 'path') MapView.drawPath(step.path);
      else MapView.clearPath();
    }

    this.renderTable(step);
    this.renderLog();
  },

  renderTable(step) {
    const body = document.getElementById('distTableBody');
    body.innerHTML = '';
    for (const v of this.nodes) {
      const tr = document.createElement('tr');
      if (step) {
        if ((step.type === 'select' && step.u === v)) tr.className = 'row-current';
        if (step.type === 'relax' && step.v === v) tr.className = step.updated ? 'row-updated' : 'row-checked';
        if (step.type === 'skip' && step.v === v) tr.className = 'row-checked';
        if (step.type === 'path' && step.path.includes(v)) tr.className = 'row-path';
      }
      const d = step ? step.dist[v] : null;
      const cells = [
        v + ' · ' + cityName(v),
        step ? formatWeight(d, this.mode) : '—',
        step && step.prev[v] ? step.prev[v] : '—',
        step && step.visited[v] ? '✓' : ''
      ];
      for (const text of cells) {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
  },

  renderLog() {
    const list = document.getElementById('simLog');
    list.innerHTML = '';
    for (let i = 0; i <= this.index; i++) {
      const step = this.steps[i];
      const li = document.createElement('li');
      li.textContent = this.describe(step);
      if (step.type === 'select') li.classList.add('log-select');
      if (step.type === 'relax' && step.updated) li.classList.add('log-update');
      if (step.type === 'path') li.classList.add('log-path');
      if (i === this.index) li.classList.add('last');
      list.appendChild(li);
    }
    list.scrollTop = list.scrollHeight;
  },

  describe(step) {
    const w = (x) => formatWeight(x, this.mode);
    switch (step.type) {
      case 'init':
        return t('logInit', { s: step.source });
      case 'select':
        return t('logSelect', { u: step.u, d: w(step.d) });
      case 'relax':
        return t(step.updated ? 'logRelaxUpdate' : 'logRelaxKeep', {
          u: step.u, v: step.v, w: w(step.w), old: w(step.oldDist), nw: w(step.newDist)
        });
      case 'skip':
        return t('logSkip', { u: step.u, v: step.v });
      case 'path':
        return t('logPath', { path: step.path.join(' → '), total: w(step.total) });
      default:
        return t('logUnreachable');
    }
  }
};
