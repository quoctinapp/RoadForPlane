const FARE_CLASSES = ['economy', 'premium', 'business', 'first'];
const TIME_SLOTS = ['morning', 'afternoon', 'evening'];
const PASSENGER_TYPES = ['adult', 'child', 'infant'];
const MEMBER_TIERS = ['standard', 'silver', 'gold', 'platinum'];

const DEFAULT_PRICING = {
  fareClass: { economy: 1, premium: 1.5, business: 2.5, first: 4 },
  passenger: { adult: 1, child: 0.75, infant: 0.1 },
  tier: { standard: 0, silver: 5, gold: 10, platinum: 15 },
  refundVoluntary: 70
};

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

function slotOf(clock) {
  const [h, m] = clock.split(':').map(Number);
  const minutes = h * 60 + m;
  if (minutes >= 300 && minutes < 720) return 'morning';
  if (minutes >= 720 && minutes < 1080) return 'afternoon';
  return 'evening';
}

function promoApplies(promo, flight, fareClass) {
  if (promo.active === false) return false;
  if (promo.route) {
    const [a, b] = promo.route.split('-');
    const match = (flight.from === a && flight.to === b) || (flight.from === b && flight.to === a);
    if (!match) return false;
  }
  if (promo.dateFrom && flight.date < promo.dateFrom) return false;
  if (promo.dateTo && flight.date > promo.dateTo) return false;
  if (promo.fareClass && promo.fareClass !== 'all' && promo.fareClass !== fareClass) return false;
  return true;
}

function bestPromo(promotions, flight, fareClass) {
  let best = null;
  for (const promo of promotions) {
    if (promoApplies(promo, flight, fareClass) && (!best || promo.percent > best.percent)) best = promo;
  }
  return best;
}

function prepareFlights(flights, options = {}) {
  const fareClass = options.fareClass || 'economy';
  const slots = options.slots && options.slots.length ? options.slots : null;
  const promotions = options.promotions || [];
  const pricing = options.pricing || DEFAULT_PRICING;
  const factor = pricing.fareClass[fareClass] || 1;

  const result = [];
  for (const f of flights) {
    if (f.classes && !f.classes.includes(fareClass)) continue;
    if (slots && !slots.includes(slotOf(f.depart))) continue;

    const listPrice = roundTo(f.price * factor, 10000);
    const promo = bestPromo(promotions, f, fareClass);
    const price = promo ? roundTo(listPrice * (1 - promo.percent / 100), 10000) : listPrice;
    result.push({
      ...f,
      fareClass: fareClass,
      listPrice: listPrice,
      price: price,
      promo: promo ? { id: promo.id || null, name: promo.name || '', percent: promo.percent } : null
    });
  }
  return result;
}

function quote(routes, passengers, tier, pricing = DEFAULT_PRICING) {
  const base = routes.reduce((sum, r) => sum + r.totalPrice, 0);
  const listBase = routes.reduce((sum, r) => sum + r.legs.reduce((s, f) => s + (f.listPrice || f.price), 0), 0);
  const lines = PASSENGER_TYPES
    .filter(type => (passengers[type] || 0) > 0)
    .map(type => {
      const unit = roundTo(base * pricing.passenger[type], 1000);
      return { type: type, count: passengers[type], unit: unit, amount: unit * passengers[type] };
    });
  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const tierPercent = pricing.tier[tier] || 0;
  const tierDiscount = roundTo(subtotal * tierPercent / 100, 1000);
  const weight = PASSENGER_TYPES.reduce((sum, type) => sum + (passengers[type] || 0) * pricing.passenger[type], 0);

  return {
    base: base,
    lines: lines,
    subtotal: subtotal,
    tier: tier,
    tierPercent: tierPercent,
    tierDiscount: tierDiscount,
    promoSaving: roundTo((listBase - base) * weight, 1000),
    total: subtotal - tierDiscount
  };
}

function validPassengers(passengers) {
  const { adult = 0, child = 0, infant = 0 } = passengers;
  return adult >= 1 && adult + child <= 9 && infant <= adult && child >= 0 && infant >= 0;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FARE_CLASSES, TIME_SLOTS, PASSENGER_TYPES, MEMBER_TIERS, DEFAULT_PRICING,
    slotOf, promoApplies, prepareFlights, quote, validPassengers
  };
}
