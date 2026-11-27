const DELAY_MINUTES = 180;
const SURGE_FACTOR = 1.5;

function buildGraph(cityCodes, flights, date, mode, incidents = []) {
  const adj = {};
  for (const code of cityCodes) adj[code] = [];

  const todays = incidents.filter(inc => inc.date === date);
  const weightOf = (f) => (mode === 'time' ? f.duration : f.price);

  for (const original of flights) {
    if (original.date !== date) continue;
    const f = applyIncidents(original, todays);
    if (!f) continue;

    const list = adj[f.from];
    const existing = list.find(e => e.to === f.to);

    if (!existing) {
      list.push({ to: f.to, weight: weightOf(f), flight: f });
    } else if (isBetter(f, existing.flight, mode)) {
      existing.weight = weightOf(f);
      existing.flight = f;
    }
  }
  return { nodes: cityCodes.slice(), adj: adj };
}

function applyIncidents(flight, incidents) {
  let f = flight;
  for (const inc of incidents) {
    if (inc.type === 'close' && (f.from === inc.code || f.to === inc.code)) return null;
    const onLeg = f.from === inc.from && f.to === inc.to && (!inc.flightId || inc.flightId === f.id);
    if (!onLeg) continue;
    if (inc.type === 'cancel') return null;
    if (inc.type === 'delay') {
      const [h, m] = f.depart.split(':').map(Number);
      const duration = f.duration + DELAY_MINUTES;
      f = { ...f, duration: duration, arrive: shiftClock(f.depart, duration), nextDay: h * 60 + m + duration >= 1440, delayed: true };
    }
    if (inc.type === 'surge') {
      f = { ...f, price: Math.round(f.price * SURGE_FACTOR / 50000) * 50000, surged: true };
    }
  }
  return f;
}

function shiftClock(clock, minutes) {
  const [h, m] = clock.split(':').map(Number);
  const total = (h * 60 + m + minutes) % 1440;
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

function isBetter(a, b, mode) {
  if (mode === 'time') {
    return a.duration < b.duration || (a.duration === b.duration && a.price < b.price);
  }
  return a.price < b.price || (a.price === b.price && a.duration < b.duration);
}

function computePriceTiers(prices) {
  const distinct = Array.from(new Set(prices)).sort((a, b) => a - b);
  const n = distinct.length;
  const tierByPrice = new Map();
  const ranges = [null, null, null, null];

  distinct.forEach((price, index) => {
    const tier = Math.min(3, Math.floor((index * 4) / n));
    tierByPrice.set(price, tier);

    if (!ranges[tier]) ranges[tier] = { min: price, max: price };
    else ranges[tier].max = price;
  });

  return {
    tierOf: (price) => tierByPrice.get(price),
    ranges: ranges
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildGraph, computePriceTiers, applyIncidents, DELAY_MINUTES, SURGE_FACTOR };
}
