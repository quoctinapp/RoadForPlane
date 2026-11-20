const assert = require('assert');
const data = require('../data/scripts/user/data.js');
const graphLib = require('../data/scripts/user/graph.js');
const { dijkstra } = require('../data/scripts/user/dijkstra.js');
const paths = require('../data/scripts/user/paths.js');
Object.assign(global, graphLib, { dijkstra }, paths);
const trip = require('../data/scripts/user/trip.js');

const { CITIES, DATA_YEAR, DATA_MONTH, toDateString, flightsOn } = data;
const { buildGraph, DELAY_MINUTES, SURGE_FACTOR } = graphLib;
const codes = CITIES.map(c => c.code);
const days = new Date(DATA_YEAR, DATA_MONTH, 0).getDate();

function bellmanFord(graph, source) {
  const dist = {};
  for (const v of graph.nodes) dist[v] = Infinity;
  dist[source] = 0;
  for (let i = 0; i < graph.nodes.length - 1; i++) {
    let changed = false;
    for (const u of graph.nodes) {
      if (dist[u] === Infinity) continue;
      for (const e of graph.adj[u]) {
        if (dist[u] + e.weight < dist[e.to]) {
          dist[e.to] = dist[u] + e.weight;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return dist;
}

let checks = 0;
let reachable = 0;
let connections = 0;

for (let day = 1; day <= days; day++) {
  const date = toDateString(DATA_YEAR, DATA_MONTH, day);
  for (const mode of ['price', 'time']) {
    const graph = buildGraph(codes, flightsOn(date), date, mode);
    for (const from of codes) {
      const expected = bellmanFord(graph, from);
      for (const to of codes) {
        if (from === to) continue;
        const result = dijkstra(graph, from, to);
        assert.strictEqual(result.total, expected[to], `${mode} ${date} ${from}->${to}`);
        checks++;
        if (result.total === Infinity) continue;

        const legSum = result.legs.reduce((s, f) => s + (mode === 'time' ? f.duration : f.price), 0);
        assert.strictEqual(legSum, result.total);
        assert.strictEqual(result.path[0], from);
        assert.strictEqual(result.path[result.path.length - 1], to);

        if (mode === 'price' && day <= 3) {
          const listed = paths.findAllPaths(graph, from, to, 3);
          let best = Infinity;
          for (const r of listed) best = Math.min(best, r.totalPrice);
          assert.ok(best >= result.total);
          if (result.legs.length <= 3) assert.strictEqual(best, result.total);
        }
        if (mode === 'price') {
          reachable++;
          if (result.legs.length > 1) connections++;
        }
      }
    }
  }
}

const date = toDateString(DATA_YEAR, DATA_MONTH, 5);
const base = buildGraph(codes, flightsOn(date), date, 'price');
const edge = base.adj.SGN.find(e => e.to === 'HAN');

const cancelled = buildGraph(codes, flightsOn(date), date, 'price', [{ type: 'cancel', from: 'SGN', to: 'HAN', date }]);
assert.ok(!cancelled.adj.SGN.some(e => e.to === 'HAN'));
assert.ok(cancelled.adj.HAN.some(e => e.to === 'SGN'));

const otherDay = buildGraph(codes, flightsOn(date), date, 'price', [{ type: 'cancel', from: 'SGN', to: 'HAN', date: '2026-12-06' }]);
assert.ok(otherDay.adj.SGN.some(e => e.to === 'HAN'));

const closed = buildGraph(codes, flightsOn(date), date, 'price', [{ type: 'close', code: 'DAD', date }]);
assert.strictEqual(closed.adj.DAD.length, 0);
assert.ok(codes.every(u => !closed.adj[u].some(e => e.to === 'DAD')));

const delayed = buildGraph(codes, flightsOn(date), date, 'time', [{ type: 'delay', from: 'SGN', to: 'HAN', date }]);
const fastest = buildGraph(codes, flightsOn(date), date, 'time').adj.SGN.find(e => e.to === 'HAN');
const delayedEdge = delayed.adj.SGN.find(e => e.to === 'HAN');
assert.strictEqual(delayedEdge.weight, fastest.weight + DELAY_MINUTES);
assert.ok(delayedEdge.flight.delayed);

const surged = buildGraph(codes, flightsOn(date), date, 'price', [{ type: 'surge', from: 'SGN', to: 'HAN', date }]);
const surgedEdge = surged.adj.SGN.find(e => e.to === 'HAN');
assert.strictEqual(surgedEdge.weight, Math.round(edge.weight * SURGE_FACTOR / 50000) * 50000);
assert.ok(surgedEdge.flight.surged);

const segs = trip.buildSegments('SGN', ['DAD'], 'HAN', ['a', 'b', 'c'], true);
assert.deepStrictEqual(segs.map(s => s.from + s.to + s.date + s.kind), ['SGNDADaout', 'DADHANbout', 'HANSGNcreturn']);

let rerouted = 0;
for (let day = 1; day <= days; day++) {
  const d = toDateString(DATA_YEAR, DATA_MONTH, day);
  const g = buildGraph(codes, flightsOn(d), d, 'price');
  for (const from of codes) {
    for (const to of codes) {
      if (from === to) continue;
      const r = dijkstra(g, from, to);
      if (r.legs.length < 2) continue;
      const route = trip.routeFromLegs(from, r.legs);
      const legIndex = 1;
      const leg = route.legs[legIndex];
      const incidents = [{ type: 'cancel', from: leg.from, to: leg.to, date: d }];
      const g2 = buildGraph(codes, flightsOn(d), d, 'price', incidents);
      const out = trip.reroute(route, legIndex, g2, to);
      assert.strictEqual(out.at, leg.from);
      if (!out.newRoute) continue;
      assert.deepStrictEqual(out.newRoute.legs.slice(0, legIndex), route.legs.slice(0, legIndex));
      assert.strictEqual(out.newRoute.path[out.newRoute.path.length - 1], to);
      assert.ok(!out.newRoute.legs.slice(legIndex).some(f => f.from === leg.from && f.to === leg.to));
      assert.ok(out.newRoute.totalPrice >= route.totalPrice);
      rerouted++;
    }
  }
}

console.log(`OK: ${checks} Dijkstra = Bellman-Ford checks (${data.FLIGHTS.length} flights, ${codes.length} airports, ${days} days).`);
console.log(`Cheapest route needs a connection in ${connections}/${reachable} cases (${(100 * connections / reachable).toFixed(1)}%).`);
console.log(`OK: incidents + ${rerouted} reroutes verified.`);
