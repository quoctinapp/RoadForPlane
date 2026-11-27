const assert = require('assert');
const data = require('../data/scripts/user/data.js');
const graphLib = require('../data/scripts/user/graph.js');
const { dijkstra } = require('../data/scripts/user/dijkstra.js');
const pricing = require('../data/scripts/user/pricing.js');

const { flightsOn, rebuildNetwork, DEFAULT_AIRPORTS, defaultRouteDefs } = data;
const { prepareFlights, quote, slotOf, validPassengers, DEFAULT_PRICING } = pricing;
const { buildGraph } = graphLib;
const date = '2026-12-05';
const raw = flightsOn(date);

const first = prepareFlights(raw, { fareClass: 'first' });
assert.ok(first.length > 0);
assert.ok(first.every(f => f.airlineCode === 'VN'));
assert.ok(first.every(f => f.price === Math.round(raw.find(r => r.id === f.id && r.from === f.from && r.to === f.to).price * 4 / 10000) * 10000));

const business = prepareFlights(raw, { fareClass: 'business' });
assert.ok(business.every(f => ['VN', 'VJ', 'QH'].includes(f.airlineCode)));
assert.ok(!business.some(f => f.airlineCode === 'VU'));

const economy = prepareFlights(raw, { fareClass: 'economy' });
assert.strictEqual(economy.length, raw.length);
assert.ok(economy.every((f, i) => f.price === Math.round(raw[i].price / 10000) * 10000));

assert.strictEqual(slotOf('05:00'), 'morning');
assert.strictEqual(slotOf('11:59'), 'morning');
assert.strictEqual(slotOf('12:00'), 'afternoon');
assert.strictEqual(slotOf('18:00'), 'evening');
assert.strictEqual(slotOf('04:30'), 'evening');
const evening = prepareFlights(raw, { slots: ['evening'] });
assert.ok(evening.length > 0 && evening.every(f => slotOf(f.depart) === 'evening'));
const morningAfternoon = prepareFlights(raw, { slots: ['morning', 'afternoon'] });
assert.strictEqual(evening.length + morningAfternoon.length, raw.length);

const promo = { id: 'p1', name: 'Test', percent: 20, route: 'HAN-SGN', dateFrom: '2026-12-01', dateTo: '2026-12-10', fareClass: 'all' };
const promoted = prepareFlights(raw, { promotions: [promo] });
for (const f of promoted) {
  const onRoute = (f.from === 'HAN' && f.to === 'SGN') || (f.from === 'SGN' && f.to === 'HAN');
  if (onRoute) {
    assert.ok(f.promo && f.promo.percent === 20);
    assert.strictEqual(f.price, Math.round(f.listPrice * 0.8 / 10000) * 10000);
  } else {
    assert.strictEqual(f.promo, null);
    assert.strictEqual(f.price, f.listPrice);
  }
}
assert.ok(prepareFlights(flightsOn('2026-12-20'), { promotions: [promo] }).every(f => !f.promo));
assert.ok(prepareFlights(raw, { fareClass: 'business', promotions: [{ ...promo, fareClass: 'first' }] }).every(f => !f.promo));

const codes = data.CITIES.map(c => c.code);
const g = buildGraph(codes, prepareFlights(raw, { promotions: [{ id: 'all', percent: 50, route: 'SGN-HAN' }] }), date, 'price');
const plain = buildGraph(codes, economy, date, 'price');
assert.ok(dijkstra(g, 'SGN', 'HAN').total <= dijkstra(plain, 'SGN', 'HAN').total);

const route = { totalPrice: 1000000, legs: [{ price: 1000000, listPrice: 1000000 }] };
const q = quote([route, route], { adult: 2, child: 1, infant: 1 }, 'gold', DEFAULT_PRICING);
assert.strictEqual(q.base, 2000000);
assert.deepStrictEqual(q.lines.map(l => [l.type, l.count, l.unit, l.amount]), [
  ['adult', 2, 2000000, 4000000],
  ['child', 1, 1500000, 1500000],
  ['infant', 1, 200000, 200000]
]);
assert.strictEqual(q.subtotal, 5700000);
assert.strictEqual(q.tierDiscount, 570000);
assert.strictEqual(q.total, 5130000);

assert.ok(validPassengers({ adult: 1, child: 0, infant: 1 }));
assert.ok(!validPassengers({ adult: 0, child: 1, infant: 0 }));
assert.ok(!validPassengers({ adult: 1, child: 0, infant: 2 }));
assert.ok(!validPassengers({ adult: 5, child: 5, infant: 0 }));

const newAirport = { code: 'GBN', name: { vi: 'Bắc Ninh', en: 'Bac Ninh' }, airport: 'Gia Bình', province: 'Bắc Ninh', lat: 21.06, lng: 106.2, active: true };
rebuildNetwork(DEFAULT_AIRPORTS.concat(newAirport), defaultRouteDefs().concat({ a: 'GBN', b: 'SGN', active: true }));
assert.ok(data.getCity('GBN'));
const codes2 = data.CITIES.map(c => c.code);
const g2 = buildGraph(codes2, flightsOn(date), date, 'price');
const toGbn = dijkstra(g2, 'PQC', 'GBN');
assert.ok(toGbn.total < Infinity);
assert.strictEqual(toGbn.path[toGbn.path.length - 1], 'GBN');

rebuildNetwork(DEFAULT_AIRPORTS.map(a => a.code === 'DAD' ? { ...a, active: false } : a), defaultRouteDefs());
assert.ok(!data.getCity('DAD'));
assert.ok(!flightsOn(date).some(f => f.from === 'DAD' || f.to === 'DAD'));

rebuildNetwork(DEFAULT_AIRPORTS, defaultRouteDefs().map(r => r.a === 'HAN' && r.b === 'SGN' ? { ...r, priceOverride: 900000 } : r));
assert.strictEqual(data.ROUTES.find(r => r.a === 'HAN' && r.b === 'SGN').price, 900000);
rebuildNetwork(DEFAULT_AIRPORTS, defaultRouteDefs());
assert.strictEqual(data.FLIGHTS.length, 6863);

console.log('OK: pricing, fare classes, time slots, promotions, quote, network rebuild.');
