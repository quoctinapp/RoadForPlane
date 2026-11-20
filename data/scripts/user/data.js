const DATA_YEAR = 2026;
const DATA_MONTH = 12;

const CITIES = [
  { code: 'HAN', name: { vi: 'Hà Nội',        en: 'Hanoi' },            airport: 'Nội Bài',     lat: 21.2187, lng: 105.8042, label: 'left' },
  { code: 'SGN', name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' }, airport: 'Tân Sơn Nhất', lat: 10.8188, lng: 106.6519, label: 'left' },
  { code: 'HPH', name: { vi: 'Hải Phòng',     en: 'Hai Phong' },        airport: 'Cát Bi',      lat: 20.8194, lng: 106.7250, label: 'right' },
  { code: 'DAD', name: { vi: 'Đà Nẵng',       en: 'Da Nang' },          airport: 'Đà Nẵng',     lat: 16.0439, lng: 108.1994, label: 'right' },
  { code: 'VCA', name: { vi: 'Cần Thơ',       en: 'Can Tho' },          airport: 'Cần Thơ',     lat: 10.0851, lng: 105.7117, label: 'left' },
  { code: 'HUI', name: { vi: 'Huế',           en: 'Hue' },              airport: 'Phú Bài',     lat: 16.4015, lng: 107.7026, label: 'left' },
  { code: 'LTH', name: { vi: 'Đồng Nai',      en: 'Dong Nai' },         airport: 'Long Thành',  lat: 10.7980, lng: 107.0450, label: 'right' },
  { code: 'VDO', name: { vi: 'Quảng Ninh',    en: 'Quang Ninh' },       airport: 'Vân Đồn',     lat: 21.1178, lng: 107.4142, label: 'right' },
  { code: 'GBN', name: { vi: 'Bắc Ninh',      en: 'Bac Ninh' },         airport: 'Gia Bình',    lat: 21.0600, lng: 106.2000, label: 'top' }
];

const AIRLINES = [
  { code: 'VN', name: 'Vietnam Airlines',   factor: 1.15 },
  { code: 'VJ', name: 'Vietjet Air',        factor: 0.85 },
  { code: 'QH', name: 'Bamboo Airways',     factor: 1.00 },
  { code: 'VU', name: 'Vietravel Airlines', factor: 0.92 }
];

const ROUTES = [
  { a: 'HAN', b: 'SGN', price: 2100000, duration: 130 },
  { a: 'HAN', b: 'DAD', price:  900000, duration:  80 },
  { a: 'HAN', b: 'HUI', price:  950000, duration:  75 },
  { a: 'HAN', b: 'VCA', price: 2000000, duration: 130 },
  { a: 'HAN', b: 'LTH', price: 2050000, duration: 125 },
  { a: 'SGN', b: 'DAD', price:  750000, duration:  80 },
  { a: 'SGN', b: 'HPH', price: 2000000, duration: 125 },
  { a: 'SGN', b: 'HUI', price:  850000, duration:  85 },
  { a: 'SGN', b: 'VDO', price: 2200000, duration: 135 },
  { a: 'SGN', b: 'GBN', price: 2150000, duration: 130 },
  { a: 'HPH', b: 'DAD', price:  950000, duration:  85 },
  { a: 'HPH', b: 'VCA', price: 2100000, duration: 135 },
  { a: 'DAD', b: 'VCA', price:  900000, duration:  90 },
  { a: 'DAD', b: 'VDO', price: 1100000, duration:  95 },
  { a: 'DAD', b: 'LTH', price:  800000, duration:  80 },
  { a: 'DAD', b: 'GBN', price: 1000000, duration:  85 },
  { a: 'HUI', b: 'LTH', price:  900000, duration:  85 },
  { a: 'HUI', b: 'VDO', price: 1050000, duration:  90 },
  { a: 'VCA', b: 'VDO', price: 2300000, duration: 140 },
  { a: 'GBN', b: 'LTH', price: 2000000, duration: 125 }
];

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function roundPrice(value) {
  return Math.round(value / 50000) * 50000;
}

function toDateString(year, month, day) {
  return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function minutesToClock(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

function dayFactor(year, month, day) {
  if (month === 12 && (day === 24 || day === 25 || day === 31)) return 1.2;
  const weekday = new Date(year, month - 1, day).getDay();
  return (weekday === 0 || weekday === 6) ? 1.1 : 1.0;
}

function generateFlights(year, month) {
  const flights = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = toDateString(year, month, day);

    for (const route of ROUTES) {
      const directions = [[route.a, route.b], [route.b, route.a]];

      for (const [from, to] of directions) {
        const rand = mulberry32(hashString(from + '-' + to + '-' + date));

        const airlines = AIRLINES.slice();
        for (let i = airlines.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [airlines[i], airlines[j]] = [airlines[j], airlines[i]];
        }
        const count = 1 + Math.floor(rand() * 3);

        for (let i = 0; i < count; i++) {
          const airline = airlines[i];
          const departMin = (6 + Math.floor(rand() * 16)) * 60 + [0, 15, 30, 45][Math.floor(rand() * 4)];
          const duration = route.duration + [0, 5, 10][Math.floor(rand() * 3)];
          const noise = 0.85 + rand() * 0.35;
          const price = roundPrice(route.price * airline.factor * dayFactor(year, month, day) * noise);

          flights.push({
            id: airline.code + (100 + Math.floor(rand() * 900)),
            airline: airline.name,
            airlineCode: airline.code,
            from: from,
            to: to,
            date: date,
            depart: minutesToClock(departMin),
            arrive: minutesToClock(departMin + duration),
            nextDay: departMin + duration >= 1440,
            duration: duration,
            price: price
          });
        }
      }
    }
  }
  return flights;
}

const FLIGHTS = generateFlights(DATA_YEAR, DATA_MONTH);

function getCity(code) {
  return CITIES.find(c => c.code === code);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DATA_YEAR, DATA_MONTH, CITIES, AIRLINES, ROUTES, FLIGHTS, generateFlights, getCity, toDateString };
}
