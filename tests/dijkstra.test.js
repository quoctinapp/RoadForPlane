const assert = require('assert');
const { CITIES, FLIGHTS, DATA_YEAR, DATA_MONTH, toDateString } = require('../data/scripts/user/data.js');
const { buildGraph, computePriceTiers } = require('../data/scripts/user/graph.js');
const { dijkstra } = require('../data/scripts/user/dijkstra.js');
const { findAllPaths } = require('../data/scripts/user/paths.js');

const codes = CITIES.map(c => c.code);
const days = new Date(DATA_YEAR, DATA_MONTH, 0).getDate();
let checks = 0;
let multiLegWins = 0;

for (let day = 1; day <= days; day++) {
  const date = toDateString(DATA_YEAR, DATA_MONTH, day);

  for (const mode of ['price', 'time']) {
    const graph = buildGraph(codes, FLIGHTS, date, mode);
    const key = mode === 'time' ? 'totalTime' : 'totalPrice';

    for (const from of codes) {
      for (const to of codes) {
        if (from === to) continue;
        const result = dijkstra(graph, from, to);

        const all = findAllPaths(graph, from, to, codes.length - 1);
        const best = all.length ? Math.min(...all.map(r => r[key])) : Infinity;

        assert.strictEqual(result.total, best, `${mode} ${date} ${from}->${to}`);

        if (best !== Infinity) {
          const legSum = result.legs.reduce((s, f) => s + (mode === 'time' ? f.duration : f.price), 0);
          assert.strictEqual(legSum, result.total);
          assert.strictEqual(result.path[0], from);
          assert.strictEqual(result.path[result.path.length - 1], to);
          if (mode === 'price' && result.legs.length > 1) multiLegWins++;
        }
        checks++;
      }
    }

    const edgePrices = [];
    for (const u of codes) for (const e of graph.adj[u]) edgePrices.push(e.flight.price);
    const tiers = computePriceTiers(edgePrices);
    for (const p of edgePrices) {
      assert.ok(tiers.tierOf(p) >= 0 && tiers.tierOf(p) <= 3);
      const r = tiers.ranges[tiers.tierOf(p)];
      assert.ok(p >= r.min && p <= r.max);
    }
  }
}

console.log(`OK: ${checks} Dijkstra checks passed (${FLIGHTS.length} flights, ${days} days).`);
console.log(`Cheapest path uses a connection in ${multiLegWins} (price) cases.`);
