const I18N = {
  vi: {
    appSubtitle: 'Tìm chuyến bay rẻ nhất với thuật toán Dijkstra',
    from: 'Điểm đi',
    to: 'Điểm đến',
    swap: 'Đổi chiều',
    date: 'Ngày bay',
    criterion: 'Tiêu chí',
    cheapest: 'Rẻ nhất',
    fastest: 'Nhanh nhất',
    search: 'Tìm đường bay',
    showAll: 'Hiện tất cả chuyến bay trong ngày',
    resultTitle: 'Kết quả tìm đường',
    totalPrice: 'Tổng giá vé',
    totalTime: 'Thời gian bay',
    legsCount: 'Số chặng',
    direct: 'Bay thẳng',
    stops: '{n} điểm dừng',
    routesTitle: 'Các đường bay ({n})',
    dijkstraTag: 'Tối ưu (Dijkstra)',
    flightDetails: 'Chi tiết chặng bay',
    nextDay: '+1 ngày',
    noRoute: 'Không có đường bay giữa hai thành phố trong ngày này.',
    sameCity: 'Điểm đi và điểm đến phải khác nhau.',
    pickHint: 'Chọn điểm đi, điểm đến và bấm "Tìm đường bay".',
    simTitle: 'Mô phỏng thuật toán Dijkstra',
    play: 'Chạy',
    pause: 'Dừng',
    step: 'Từng bước',
    reset: 'Làm lại',
    speed: 'Tốc độ',
    stepOf: 'Bước {i}/{n}',
    vertex: 'Đỉnh',
    dist: 'd (khoảng cách)',
    prev: 'Đỉnh trước',
    visited: 'Đã chốt',
    log: 'Nhật ký',
    legend: 'Chú thích',
    legendStart: 'Điểm đi',
    legendEnd: 'Điểm đến',
    legendCity: 'Thành phố',
    legendOptimal: 'Đường bay tối ưu (Dijkstra)',
    legendPrice: 'Màu tuyến theo giá (cùng giá cùng màu)',
    legendStop: 'Điểm dừng',
    legendOther: 'Các đoạn khác của chuyến',
    legendOld: 'Đường cũ trước sự cố',
    stopsLabel: 'Điểm dừng (bắt buộc ghé)',
    addStop: '+ Thêm điểm dừng',
    roundTrip: 'Khứ hồi',
    segmentOut: 'Đoạn {i}',
    segmentReturn: 'Chiều về',
    dateFor: 'Ngày bay · {seg}',
    tripTotal: 'Tổng cả chuyến',
    dateOrderWarn: 'Ngày bay của các đoạn nên tăng dần.',
    segmentNoRoute: 'Không có đường bay',
    rerouteTitle: 'Đổi đường bay',
    rerouteAt: 'Sự cố: {incident}. Đổi đường tại {city}.',
    oldRoute: 'Đường cũ',
    newRoute: 'Đường mới',
    noChange: 'Đường cũ vẫn là tối ưu, không cần đổi.',
    noAlternative: 'Không còn đường bay nào từ {from} tới {to} trong ngày.',
    difference: 'Chênh lệch',
    afterIncidentTag: 'Lộ trình sau sự cố',
    incidentBtn: '⚠ Sự cố',
    incCancel: 'Hủy chặng',
    incDelay: 'Trễ 3 giờ',
    incSurge: 'Tăng giá 50%',
    incClose: 'Đóng sân bay {code}',
    incidentsTitle: 'Sự cố đang áp dụng',
    clearIncidents: 'Xóa tất cả sự cố',
    descCancel: 'Hủy chặng {from} → {to} ({date})',
    descDelay: 'Trễ 3 giờ {from} → {to} ({date})',
    descSurge: 'Tăng giá 50% {from} → {to} ({date})',
    descClose: 'Đóng sân bay {code} ({date})',
    closeAirport: 'Đóng sân bay ngày {date}',
    reopenAirport: 'Mở lại sân bay',
    delayedTag: 'Trễ 3 giờ',
    surgedTag: 'Giá +50%',
    simInfo: 'Dijkstra từ {from} đến {to}, ngày {date}.',
    simInfoReroute: 'Dijkstra chạy lại từ {from} đến {to} sau sự cố, ngày {date}.',
    layerSatellite: 'Vệ tinh',
    layerDark: 'Bản đồ tối',
    hoangSa: 'QĐ. Hoàng Sa (Việt Nam)',
    truongSa: 'QĐ. Trường Sa (Việt Nam)',
    bienDong: 'Biển Đông',
    logInit: 'Khởi tạo: d[{s}] = 0, các đỉnh khác d = ∞.',
    logSelect: 'Chọn đỉnh {u} có d nhỏ nhất ({d}) và chốt đỉnh này.',
    logRelaxUpdate: 'Xét cạnh {u} → {v} ({w}): {old} > {nw} ⇒ cập nhật d[{v}] = {nw}, trước[{v}] = {u}.',
    logRelaxKeep: 'Xét cạnh {u} → {v} ({w}): {nw} ≥ {old} ⇒ giữ nguyên.',
    logSkip: 'Bỏ qua cạnh {u} → {v}: {v} đã được chốt.',
    logPath: 'Nối đường đi qua mảng "trước": {path}. Tổng = {total}.',
    logUnreachable: 'Không thể tới đích từ điểm đi.',
    weekdays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    hours: '{h} giờ', minutes: '{m} phút', hoursMinutes: '{h} giờ {m} phút'
  },
  en: {
    appSubtitle: 'Find the cheapest flight with Dijkstra\'s algorithm',
    from: 'From',
    to: 'To',
    swap: 'Swap',
    date: 'Flight date',
    criterion: 'Criterion',
    cheapest: 'Cheapest',
    fastest: 'Fastest',
    search: 'Find flights',
    showAll: 'Show all flights of the day',
    resultTitle: 'Search result',
    totalPrice: 'Total fare',
    totalTime: 'Flight time',
    legsCount: 'Legs',
    direct: 'Direct',
    stops: '{n} stop(s)',
    routesTitle: 'Routes ({n})',
    dijkstraTag: 'Optimal (Dijkstra)',
    flightDetails: 'Flight legs',
    nextDay: '+1 day',
    noRoute: 'No route between these two cities on this day.',
    sameCity: 'Departure and destination must be different.',
    pickHint: 'Choose departure, destination and press "Find flights".',
    simTitle: 'Dijkstra algorithm simulation',
    play: 'Play',
    pause: 'Pause',
    step: 'Step',
    reset: 'Reset',
    speed: 'Speed',
    stepOf: 'Step {i}/{n}',
    vertex: 'Vertex',
    dist: 'd (distance)',
    prev: 'Previous',
    visited: 'Final',
    log: 'Log',
    legend: 'Legend',
    legendStart: 'Departure',
    legendEnd: 'Destination',
    legendCity: 'City',
    legendOptimal: 'Optimal route (Dijkstra)',
    legendPrice: 'Route colour by price (same price, same colour)',
    legendStop: 'Stopover',
    legendOther: 'Other trip segments',
    legendOld: 'Route before the incident',
    stopsLabel: 'Stopovers (must visit)',
    addStop: '+ Add stopover',
    roundTrip: 'Round trip',
    segmentOut: 'Segment {i}',
    segmentReturn: 'Return',
    dateFor: 'Flight date · {seg}',
    tripTotal: 'Trip total',
    dateOrderWarn: 'Segment dates should be in increasing order.',
    segmentNoRoute: 'No route',
    rerouteTitle: 'Rerouting',
    rerouteAt: 'Incident: {incident}. Rerouted at {city}.',
    oldRoute: 'Old route',
    newRoute: 'New route',
    noChange: 'The old route is still optimal, no change needed.',
    noAlternative: 'No remaining route from {from} to {to} on this day.',
    difference: 'Difference',
    afterIncidentTag: 'Route after incident',
    incidentBtn: '⚠ Incident',
    incCancel: 'Cancel leg',
    incDelay: 'Delay 3h',
    incSurge: 'Price +50%',
    incClose: 'Close {code} airport',
    incidentsTitle: 'Active incidents',
    clearIncidents: 'Clear all incidents',
    descCancel: 'Cancelled {from} → {to} ({date})',
    descDelay: '3h delay {from} → {to} ({date})',
    descSurge: 'Price +50% {from} → {to} ({date})',
    descClose: 'Airport {code} closed ({date})',
    closeAirport: 'Close airport on {date}',
    reopenAirport: 'Reopen airport',
    delayedTag: 'Delayed 3h',
    surgedTag: 'Price +50%',
    simInfo: 'Dijkstra from {from} to {to}, {date}.',
    simInfoReroute: 'Dijkstra re-run from {from} to {to} after the incident, {date}.',
    layerSatellite: 'Satellite',
    layerDark: 'Dark map',
    hoangSa: 'Hoang Sa Archipelago (Viet Nam)',
    truongSa: 'Truong Sa Archipelago (Viet Nam)',
    bienDong: 'East Sea',
    logInit: 'Initialise: d[{s}] = 0, every other vertex d = ∞.',
    logSelect: 'Select vertex {u} with the smallest d ({d}) and finalise it.',
    logRelaxUpdate: 'Edge {u} → {v} ({w}): {old} > {nw} ⇒ update d[{v}] = {nw}, prev[{v}] = {u}.',
    logRelaxKeep: 'Edge {u} → {v} ({w}): {nw} ≥ {old} ⇒ no change.',
    logSkip: 'Skip edge {u} → {v}: {v} is already final.',
    logPath: 'Join the path through the "prev" array: {path}. Total = {total}.',
    logUnreachable: 'The destination cannot be reached from the departure.',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    hours: '{h}h', minutes: '{m}m', hoursMinutes: '{h}h {m}m'
  }
};

let currentLang = localStorage.getItem('lang') || 'vi';

function t(key, params) {
  let text = I18N[currentLang][key];
  if (text === undefined) return key;
  if (params && typeof text === 'string') {
    for (const name in params) text = text.split('{' + name + '}').join(params[name]);
  }
  return text;
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyLanguage();
  document.dispatchEvent(new CustomEvent('languagechange'));
}

function formatMoney(value) {
  if (value === Infinity) return '∞';
  return new Intl.NumberFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0
  }).format(value);
}

function formatDuration(minutes) {
  if (minutes === Infinity) return '∞';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return t('minutes', { m: m });
  if (m === 0) return t('hours', { h: h });
  return t('hoursMinutes', { h: h, m: m });
}

function formatWeight(value, mode) {
  return mode === 'time' ? formatDuration(value) : formatMoney(value);
}

function cityName(code) {
  const city = getCity(code);
  return city ? city.name[currentLang] : code;
}
