const DATA_YEAR = 2026;
const DATA_MONTH = 12;

const DEFAULT_AIRPORTS = [
  { code: 'HAN', name: { vi: 'Hà Nội', en: 'Hanoi' }, airport: 'Nội Bài', province: 'Hà Nội', lat: 21.2187, lng: 105.8042, label: 'left' },
  { code: 'HPH', name: { vi: 'Hải Phòng', en: 'Hai Phong' }, airport: 'Cát Bi', province: 'Hải Phòng', lat: 20.8194, lng: 106.7250, label: 'right' },
  { code: 'VDO', name: { vi: 'Quảng Ninh', en: 'Quang Ninh' }, airport: 'Vân Đồn', province: 'Quảng Ninh', lat: 21.1178, lng: 107.4142, label: 'right' },
  { code: 'DIN', name: { vi: 'Điện Biên', en: 'Dien Bien' }, airport: 'Điện Biên Phủ', province: 'Điện Biên', lat: 21.3975, lng: 103.0078, label: 'right' },
  { code: 'THD', name: { vi: 'Thanh Hóa', en: 'Thanh Hoa' }, airport: 'Thọ Xuân', province: 'Thanh Hóa', lat: 19.9017, lng: 105.4678, label: 'left' },
  { code: 'VII', name: { vi: 'Vinh', en: 'Vinh' }, airport: 'Vinh', province: 'Nghệ An', lat: 18.7376, lng: 105.6708, label: 'left' },
  { code: 'VDH', name: { vi: 'Đồng Hới', en: 'Dong Hoi' }, airport: 'Đồng Hới', province: 'Quảng Trị', lat: 17.5150, lng: 106.5906, label: 'left' },
  { code: 'HUI', name: { vi: 'Huế', en: 'Hue' }, airport: 'Phú Bài', province: 'Huế', lat: 16.4015, lng: 107.7026, label: 'left' },
  { code: 'DAD', name: { vi: 'Đà Nẵng', en: 'Da Nang' }, airport: 'Đà Nẵng', province: 'Đà Nẵng', lat: 16.0439, lng: 108.1994, label: 'right' },
  { code: 'VCL', name: { vi: 'Chu Lai', en: 'Chu Lai' }, airport: 'Chu Lai', province: 'Đà Nẵng', lat: 15.4033, lng: 108.7061, label: 'right' },
  { code: 'UIH', name: { vi: 'Quy Nhơn', en: 'Quy Nhon' }, airport: 'Phù Cát', province: 'Gia Lai', lat: 13.9550, lng: 109.0422, label: 'right' },
  { code: 'PXU', name: { vi: 'Pleiku', en: 'Pleiku' }, airport: 'Pleiku', province: 'Gia Lai', lat: 14.0045, lng: 108.0172, label: 'left' },
  { code: 'TBB', name: { vi: 'Tuy Hòa', en: 'Tuy Hoa' }, airport: 'Tuy Hòa', province: 'Đắk Lắk', lat: 13.0496, lng: 109.3337, label: 'right' },
  { code: 'BMV', name: { vi: 'Buôn Ma Thuột', en: 'Buon Ma Thuot' }, airport: 'Buôn Ma Thuột', province: 'Đắk Lắk', lat: 12.6683, lng: 108.1203, label: 'left' },
  { code: 'CXR', name: { vi: 'Nha Trang', en: 'Nha Trang' }, airport: 'Cam Ranh', province: 'Khánh Hòa', lat: 11.9982, lng: 109.2194, label: 'right' },
  { code: 'DLI', name: { vi: 'Đà Lạt', en: 'Da Lat' }, airport: 'Liên Khương', province: 'Lâm Đồng', lat: 11.7500, lng: 108.3667, label: 'left' },
  { code: 'SGN', name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' }, airport: 'Tân Sơn Nhất', province: 'TP. Hồ Chí Minh', lat: 10.8188, lng: 106.6519, label: 'right' },
  { code: 'VCS', name: { vi: 'Côn Đảo', en: 'Con Dao' }, airport: 'Côn Đảo', province: 'TP. Hồ Chí Minh', lat: 8.7318, lng: 106.6330, label: 'right' },
  { code: 'VCA', name: { vi: 'Cần Thơ', en: 'Can Tho' }, airport: 'Cần Thơ', province: 'Cần Thơ', lat: 10.0851, lng: 105.7117, label: 'right' },
  { code: 'VKG', name: { vi: 'Rạch Giá', en: 'Rach Gia' }, airport: 'Rạch Giá', province: 'An Giang', lat: 9.9580, lng: 105.1324, label: 'left' },
  { code: 'PQC', name: { vi: 'Phú Quốc', en: 'Phu Quoc' }, airport: 'Phú Quốc', province: 'An Giang', lat: 10.1698, lng: 103.9931, label: 'left' },
  { code: 'CAH', name: { vi: 'Cà Mau', en: 'Ca Mau' }, airport: 'Cà Mau', province: 'Cà Mau', lat: 9.1777, lng: 105.1777, label: 'left' }
];

const AIRLINES = [
  { code: 'VN', name: 'Vietnam Airlines', factor: 1.15, classes: ['economy', 'premium', 'business', 'first'] },
  { code: 'VJ', name: 'Vietjet Air', factor: 0.85, classes: ['economy', 'business'] },
  { code: 'QH', name: 'Bamboo Airways', factor: 1.00, classes: ['economy', 'premium', 'business'] },
  { code: 'VU', name: 'Vietravel Airlines', factor: 0.92, classes: ['economy'] }
];

const DEFAULT_ROUTE_PAIRS = [
  'HAN-SGN', 'HAN-DAD', 'HAN-HUI', 'HAN-DIN', 'HAN-VCL', 'HAN-UIH', 'HAN-PXU', 'HAN-TBB',
  'HAN-BMV', 'HAN-CXR', 'HAN-DLI', 'HAN-VCA', 'HAN-PQC', 'HAN-VCS',
  'SGN-HPH', 'SGN-VDO', 'SGN-THD', 'SGN-VII', 'SGN-VDH', 'SGN-HUI', 'SGN-DAD', 'SGN-VCL',
  'SGN-UIH', 'SGN-PXU', 'SGN-TBB', 'SGN-BMV', 'SGN-CXR', 'SGN-DLI', 'SGN-VCS', 'SGN-VKG',
  'SGN-PQC', 'SGN-CAH',
  'DAD-HPH', 'DAD-VCA', 'DAD-DLI', 'DAD-CXR', 'DAD-PQC',
  'HPH-CXR', 'HPH-PQC', 'HPH-BMV', 'HPH-DLI', 'HPH-VCA', 'HPH-UIH', 'HPH-PXU',
  'VII-DLI', 'VII-BMV', 'VII-PXU', 'VII-CXR', 'VII-PQC',
  'THD-DLI', 'THD-CXR', 'THD-BMV', 'THD-PQC',
  'VCA-PQC', 'VCA-VCS'
];

const PRICE_BASE = 300000;
const PRICE_PER_KM = 1150;

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

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function buildRoutes(routeDefs) {
  return routeDefs.map(def => {
    const a = def.a;
    const b = def.b;
    const pair = a + '-' + b;
    const km = distanceKm(getCity(a), getCity(b));
    const factor = 0.7 + mulberry32(hashString(pair))() * 0.7;
    return {
      a: a,
      b: b,
      km: Math.round(km),
      price: def.priceOverride ? roundPrice(def.priceOverride) : roundPrice((PRICE_BASE + km * PRICE_PER_KM) * factor),
      duration: Math.round((25 + km * 0.075) / 5) * 5
    };
  });
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
            price: price,
            classes: airline.classes
          });
        }
      }
    }
  }
  return flights;
}

const CITIES = [];
let ROUTES = [];
let FLIGHTS = [];
let FLIGHTS_BY_DATE = {};

function getCity(code) {
  return CITIES.find(c => c.code === code);
}

function defaultRouteDefs() {
  return DEFAULT_ROUTE_PAIRS.map(pair => {
    const [a, b] = pair.split('-');
    return { a: a, b: b, active: true };
  });
}

function rebuildNetwork(airports, routeDefs) {
  const valid = (a) => a.active !== false && typeof a.code === 'string' && a.code.length > 0 &&
    Number.isFinite(Number(a.lat)) && Number.isFinite(Number(a.lng));
  CITIES.length = 0;
  for (const airport of airports.filter(valid)) {
    const clean = (text) => String(text == null ? '' : text).replace(/[<>"'&]/g, '');
    const name = airport.name && airport.name.vi ? airport.name : { vi: airport.code, en: airport.code };
    CITIES.push({
      label: 'right',
      ...airport,
      code: clean(airport.code),
      airport: clean(airport.airport || airport.code),
      province: clean(airport.province),
      name: { vi: clean(name.vi), en: clean(name.en || name.vi) },
      lat: Number(airport.lat),
      lng: Number(airport.lng)
    });
  }

  const codes = new Set(CITIES.map(c => c.code));
  ROUTES = buildRoutes(routeDefs.filter(r => r.active !== false && codes.has(r.a) && codes.has(r.b) && r.a !== r.b));
  FLIGHTS = generateFlights(DATA_YEAR, DATA_MONTH);
  FLIGHTS_BY_DATE = {};
  for (const f of FLIGHTS) {
    if (!FLIGHTS_BY_DATE[f.date]) FLIGHTS_BY_DATE[f.date] = [];
    FLIGHTS_BY_DATE[f.date].push(f);
  }
}

function flightsOn(date) {
  return FLIGHTS_BY_DATE[date] || [];
}

rebuildNetwork(DEFAULT_AIRPORTS, defaultRouteDefs());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DATA_YEAR, DATA_MONTH, CITIES, AIRLINES, DEFAULT_AIRPORTS, DEFAULT_ROUTE_PAIRS,
    get ROUTES() { return ROUTES; },
    get FLIGHTS() { return FLIGHTS; },
    generateFlights, getCity, toDateString, flightsOn, roundPrice, minutesToClock,
    rebuildNetwork, defaultRouteDefs, distanceKm, buildRoutes
  };
}
