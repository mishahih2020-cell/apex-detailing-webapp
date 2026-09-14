// BLESK Detailing — данные, иконки, состояние приложения
// Всё состояние хранится в localStorage. Реального бэкенда пока нет —
// это самодостаточный клиентский прототип, готовый к подключению API.

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  services: '<path d="M12 3s7 7.58 7 12a7 7 0 11-14 0c0-4.42 7-12 7-12z"/>',
  garage: '<path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11"/><path d="M3 11h18v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z"/><circle cx="7.5" cy="14.5" r="1.4"/><circle cx="16.5" cy="14.5" r="1.4"/>',
  orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  chevron: '<path d="M9 18l6-6-6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  pin: '<path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/>',
  star: '<path d="M12 2l2.9 6.6L22 9.3l-5 4.8L18.2 22 12 18.3 5.8 22 7 14.1l-5-4.8 7.1-.7z"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
  gift: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 14h16"/>',
  bulb: '<circle cx="12" cy="10" r="5"/><path d="M9.5 21h5M10 18h4"/>',
  seat: '<path d="M5 19l1-8a4 4 0 014-4h4a4 4 0 014 4l1 8"/><path d="M3 19h18M8 11V8a2 2 0 012-2h4a2 2 0 012 2v3"/>',
  heart: '<path d="M12 21s-7-4.35-9.33-8.9A5.4 5.4 0 0112 6.5a5.4 5.4 0 019.33 5.6C19 16.65 12 21 12 21z"/>',
  telegram: '<path d="M22 2L2 9.5l7 3M22 2L15.5 22l-6.5-9.5M22 2L9 12.5"/>',
  sbp: '<path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 01-8.9 8.5 9 9 0 01-4-.9L3 20l1-4.5a8.4 8.4 0 01-1-4A8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="2.4"/><path d="M2 21c0-3.3 3-5 7-5s7 1.7 7 5"/>',
  support: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 1.8-2.5 3.5"/><path d="M12 17h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.6 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  car: '<path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11"/><path d="M3 11h18v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z"/><circle cx="7.5" cy="14.5" r="1.4"/><circle cx="16.5" cy="14.5" r="1.4"/>',
  layers: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 14h16"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'
};

function icon(name, size = 20, color = 'currentColor', strokeWidth = 1.7) {
  const body = ICONS[name] || '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// Векторная "чертёжная" схема автомобиля — используется на онбординге и в трекинге заказа
const CAR_BLUEPRINT_SVG = `<svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 130c0-8 8-16 24-20l30-34c8-9 20-14 33-14h86c14 0 27 6 36 16l26 29c17 3 27 10 27 20v10c0 6-5 11-11 11h-8a30 30 0 00-58 0H127a30 30 0 00-58 0H35c-8 0-15-7-15-15v-3z" stroke="var(--lime)" stroke-width="1.5" opacity=".8"/>
  <circle cx="98" cy="141" r="24" stroke="var(--lime)" stroke-width="1.5" opacity=".8"/>
  <circle cx="272" cy="141" r="24" stroke="var(--lime)" stroke-width="1.5" opacity=".8"/>
</svg>`;

const SERVICES = [
  { id: 'wash', category: 'Мойка', name: 'Комплексная мойка', desc: 'Ручная мойка, чернение резины, полировка стёкол', icon: 'services', duration: '1.5 часа', rating: 4.8, reviews: 214,
    include: ['Ручная мойка кузова и порогов', 'Чернение резины и пластика', 'Пылесос салона', 'Полировка стёкол и зеркал'],
    price: { sedan: 3500, crossover: 4200, suv: 5100 } },
  { id: 'polish', category: 'Кузов', name: 'Полировка кузова', desc: 'Удаление царапин и голограмм, глубина блеска', icon: 'star', duration: '4 часа', rating: 4.9, reviews: 156,
    include: ['Мойка и обезжиривание кузова', 'Полировка абразивным кругом', 'Удаление голограмм финишным кругом', 'Защитный воск на 1 месяц'],
    price: { sedan: 12000, crossover: 15000, suv: 19000 } },
  { id: 'ceramic', category: 'Защита', name: 'Керамическое покрытие 9H', desc: 'Защита кузова, гарантия 24 месяца', icon: 'shield', duration: '4 часа', rating: 4.9, reviews: 128,
    include: ['Глубокая мойка и обезжиривание кузова', 'Полировка одним этапом для подготовки лака', 'Нанесение керамики Ceramic Pro в 2 слоя', 'Гарантийный сертификат на 24 месяца'],
    price: { sedan: 35000, crossover: 42000, suv: 51000 } },
  { id: 'ppf', category: 'Защита', name: 'Оклейка плёнкой PPF', desc: 'Защита от сколов, самовосстанавливающееся покрытие', icon: 'layers', duration: '2 дня', rating: 4.9, reviews: 74,
    include: ['Подготовка и полировка кузова', 'Оклейка передней части кузова', 'Обработка кромок и стыков', 'Гарантия производителя плёнки'],
    price: { sedan: 90000, crossover: 108000, suv: 132000 } },
  { id: 'interior', category: 'Салон', name: 'Химчистка салона', desc: 'Кожа, алькантара, текстиль, удаление запахов', icon: 'seat', duration: '3 часа', rating: 4.7, reviews: 189,
    include: ['Чистка сидений и потолка', 'Уход за кожей и алькантарой', 'Чистка ковров и багажника', 'Озонирование от запахов'],
    price: { sedan: 8000, crossover: 9500, suv: 11500 } },
  { id: 'headlights', category: 'Оптика', name: 'Восстановление фар', desc: 'Полировка и защита оптики от помутнения', icon: 'bulb', duration: '1 час', rating: 4.8, reviews: 97,
    include: ['Шлифовка поверхности фары', 'Полировка до прозрачности', 'Защитное УФ-покрытие'],
    price: { sedan: 4000, crossover: 4000, suv: 4500 } }
];

const SIZE_LABELS = {
  sedan: { title: 'Седан / купе', hint: 'напр. Mercedes E-Class' },
  crossover: { title: 'Кроссовер', hint: 'напр. BMW X3–X5' },
  suv: { title: 'Внедорожник', hint: 'напр. Range Rover' }
};

const LOCATIONS = [
  { id: 'studio', name: 'Студия BLESK на Дмитровском', sub: '15–20 мин от вашего района', extra: 0 },
  { id: 'onsite', name: 'Выездной мастер', sub: 'В пределах МКАД', extra: 3000 }
];

const TIERS = [
  { name: 'Silver', min: 0 },
  { name: 'Gold', min: 2000 },
  { name: 'Black', min: 5000 }
];

const TRACKING_STAGES = [
  { key: 'accepted', name: 'Приём', full: 'Приём автомобиля', detail: 'дефектовка и фотофиксация' },
  { key: 'wash', name: 'Мойка', full: 'Мойка и обезжиривание', detail: 'подготовка поверхности' },
  { key: 'work', name: 'Полировка', full: 'Полировка кузова', detail: 'в процессе' },
  { key: 'coat', name: 'Керамика', full: 'Нанесение керамики', detail: 'ожидается' },
  { key: 'done', name: 'Выдача', full: 'Контроль качества и выдача', detail: 'ожидается' }
];

function seedState() {
  return {
    user: { name: 'Андрей Королёв', phone: '+7 916 000-00-00', points: 3240 },
    primaryCarId: 'car1',
    cars: [
      { id: 'car1', brand: 'BMW', model: 'M5 Competition', plate: 'А 777 ЕХ 197', size: 'crossover', passport: 78, lastService: 'Керамика обновлена 12 мая 2026', img: 'img/car-hero.png' },
      { id: 'car2', brand: 'Mercedes-Benz', model: 'E200', plate: 'В 112 КМ 777', size: 'sedan', passport: 45, lastService: 'Плановая мойка через 3 дня', img: 'img/car-mercedes.png' },
      { id: 'car3', brand: 'Lexus', model: 'LS 500', plate: 'Е 500 ЛХ 799', size: 'suv', passport: 92, lastService: 'PPF нанесена 3 февраля 2026', img: 'img/car-lexus.png' }
    ],
    draft: null, // { items:[{serviceId,sizeKey,price}], carId, date, time, locationId, promo }
    orders: [
      { id: 'APX-30215', carId: 'car1', items: [{ serviceId: 'ceramic', sizeKey: 'crossover', price: 42000 }, { serviceId: 'headlights', sizeKey: 'crossover', price: 4000 }],
        date: 'Сегодня', time: '11:30', locationId: 'studio', total: 43700, status: 'active', stageIndex: 2, createdAt: Date.now() },
      { id: 'APX-28110', carId: 'car2', items: [{ serviceId: 'wash', sizeKey: 'sedan', price: 3500 }],
        date: '28 апреля', time: '09:00', locationId: 'studio', total: 3500, status: 'done', stageIndex: 4, createdAt: Date.now() - 864e5 * 20 },
      { id: 'APX-20302', carId: 'car3', items: [{ serviceId: 'ppf', sizeKey: 'suv', price: 96000 }],
        date: '3 февраля', time: '10:00', locationId: 'studio', total: 96000, status: 'done', stageIndex: 4, createdAt: Date.now() - 864e5 * 60 },
      { id: 'APX-10144', carId: 'car1', items: [{ serviceId: 'interior', sizeKey: 'crossover', price: 8000 }],
        date: '14 января', time: '15:00', locationId: 'studio', total: 8000, status: 'cancelled', stageIndex: 0, createdAt: Date.now() - 864e5 * 90 }
    ],
    activeOrderId: 'APX-30215'
  };
}

const STORAGE_KEY = 'apex_detailing_state_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function resetState() {
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

function fmtPrice(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function findService(id) {
  return SERVICES.find(s => s.id === id);
}

function findCar(state, id) {
  return state.cars.find(c => c.id === id);
}

function currentTier(points) {
  let cur = TIERS[0];
  for (const t of TIERS) if (points >= t.min) cur = t;
  const idx = TIERS.indexOf(cur);
  const next = TIERS[idx + 1] || null;
  return { cur, next };
}
