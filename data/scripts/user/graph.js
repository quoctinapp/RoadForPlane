function buildGraph(cityCodes, flights, date, mode) {
  const adj = {};
  for (const code of cityCodes) adj[code] = [];

  const weightOf = (f) => (mode === 'time' ? f.duration : f.price);

  for (const f of flights) {
    if (f.date !== date) continue;

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
  module.exports = { buildGraph, computePriceTiers };
}
