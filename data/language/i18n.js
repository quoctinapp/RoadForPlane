const I18N = { vi: LANG_VI, en: LANG_EN };

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
