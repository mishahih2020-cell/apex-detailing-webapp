// APEX Detailing — SPA: роутинг, экраны, обработчики, интеграция с Telegram WebApp SDK

const TAB_ROUTES = ['home', 'services', 'garage', 'history', 'profile'];
const DOW = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

let S = loadState();
let ui = defaultUi();
let trackingTimer = null;
let toastTimer = null;

function defaultUi() {
  return { svcCategory: 'Все', historyTab: 'active', selectedSize: {}, booking: { day: 0, slot: '11:00', locId: 'studio', carId: null }, pay: 'telegram', promoError: false, favs: {}, newCarSize: 'sedan' };
}

// ---------- helpers ----------
function ru(n, one, few, many) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
}
function carLabel(car) { return car ? `${car.brand} ${car.model}`.trim() : ''; }
function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
function generateDays(n) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    out.push({ dow: DOW[d.getDay()], num: d.getDate(), month: MONTHS[d.getMonth()], isToday: i === 0 });
  }
  return out;
}
function draftTotals(draft) {
  const subtotal = draft.items.reduce((s, i) => s + i.price, 0);
  const loc = LOCATIONS.find(l => l.id === draft.locationId) || LOCATIONS[0];
  const locExtra = loc.extra || 0;
  let discount = 0;
  if (draft.promo && draft.promo.pct) discount = Math.round((subtotal + locExtra) * draft.promo.pct / 100);
  return { subtotal, locExtra, discount, total: subtotal + locExtra - discount };
}
function etaTime(order) {
  const d = new Date(Date.now() + Math.max(1, 4 - order.stageIndex) * 25 * 60000);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// ---------- routing ----------
function parseHash() {
  let h = location.hash.replace(/^#\/?/, '');
  if (!h) h = 'home';
  const [route, param] = h.split('/');
  return { route, param };
}
function nav(path) { location.hash = '/' + path; }

function render() {
  stopTrackingTimer();
  const { route, param } = parseHash();
  let html;
  switch (route) {
    case 'home': html = screenHome(); break;
    case 'services': html = screenServices(); break;
    case 'service': html = screenServiceDetail(param); break;
    case 'garage': html = screenGarage(); break;
    case 'booking': html = screenBooking(); break;
    case 'cart': html = screenCart(); break;
    case 'checkout': html = screenCheckout(); break;
    case 'success': html = screenSuccess(param); break;
    case 'tracking': html = screenTracking(param); break;
    case 'history': html = screenHistory(); break;
    case 'profile': html = screenProfile(); break;
    default: html = screenHome();
  }
  const isTab = TAB_ROUTES.includes(route);
  document.getElementById('app').innerHTML = html + (isTab ? renderBottomNav(route) : '');
  syncBackButton(route);
  const scrollEl = document.querySelector('.scroll');
  if (scrollEl) scrollEl.scrollTop = 0; else window.scrollTo(0, 0);
  if (route === 'tracking' && param) startTrackingTimer(param);
}

function renderBottomNav(active) {
  const items = [
    { r: 'home', label: 'Главная', ic: 'home' },
    { r: 'services', label: 'Услуги', ic: 'services' },
    { r: 'garage', label: 'Гараж', ic: 'garage' },
    { r: 'history', label: 'Заказы', ic: 'orders' },
    { r: 'profile', label: 'Профиль', ic: 'profile' }
  ];
  return `<div class="bottom-nav">${items.map(it => `<button class="nav-item ${it.r === active ? 'active' : ''}" data-nav="${it.r}">${icon(it.ic, 20, 'currentColor', 1.7)}${it.label}</button>`).join('')}</div>`;
}
function headerBack(title, subtitle) {
  return `<div class="hdr"><div class="hdr-left"><button class="icon-btn" data-act="go-back">${icon('back', 16, '#F2F5F7', 2)}</button><div class="hdr-title">${title}${subtitle ? `<small>${subtitle}</small>` : ''}</div></div></div>`;
}
function emptyState(iconName, title, sub, ctaLabel, ctaNav) {
  return `<div class="empty">${icon(iconName, 40, 'var(--t1)', 1.4)}<b>${title}</b><span>${sub}</span>${ctaLabel ? `<button class="btn btn-primary" style="margin-top:16px;width:auto;padding:0 24px;" data-nav="${ctaNav}">${ctaLabel}</button>` : ''}</div>`;
}

// ---------- screens ----------
function screenHome() {
  const car = findCar(S, S.primaryCarId) || S.cars[0];
  const activeOrder = S.orders.find(o => o.status === 'active');
  const svc4 = SERVICES.slice(0, 4);
  const svcCards = svc4.map(s => `
    <button class="scard" data-nav="service/${s.id}">
      <div class="ic">${icon(s.icon, 17, 'var(--lime)', 1.7)}</div>
      <b>${s.name}</b><span>от ${fmtPrice(s.price.sedan)}</span>
    </button>`).join('');
  return `
  <div class="hdr">
    <div class="hdr-left"><div class="wordmark">APE<span class="a">X</span></div></div>
    <button class="icon-btn" data-nav="profile">${icon('bell', 19, '#F2F5F7')}<span class="dotalert"></span></button>
  </div>
  <div class="scroll">
    <div class="greet">
      <div class="greet-text">${greeting()}, ${S.user.name.split(' ')[0]}<span>Готовы позаботиться о машине?</span></div>
      <div class="tier-chip">${icon('star', 11, 'currentColor')} ${currentTier(S.user.points).cur.name.toUpperCase()}</div>
    </div>
    <div class="hero">
      <div class="hero-eyebrow">Ваш автомобиль</div>
      <div class="hero-carrow">${icon('car', 20, 'var(--lime)', 1.6)}<div class="hero-car">${carLabel(car)}</div></div>
      <div class="hero-stat">
        <div class="stat-ring" style="--pct:${car.passport}"><i>${car.passport}%</i></div>
        <div class="stat-label"><b>Готовность к сезону</b><span>${car.lastService}</span></div>
      </div>
      <button class="hero-cta" data-nav="services">Записаться на детейлинг ${icon('arrow', 14, 'var(--oninv)', 2.2)}</button>
    </div>
    <div class="quick">
      <button class="qtile" data-nav="garage">
        <div class="ic">${icon('garage', 15, 'var(--lime)', 1.8)}</div>
        <b>Гараж</b><span>${S.cars.length} ${ru(S.cars.length, 'автомобиль', 'автомобиля', 'автомобилей')}</span>
      </button>
      <button class="qtile" data-act="open-active-order">
        <div class="ic">${icon('clock', 15, 'var(--lime)', 1.8)}</div>
        <b>${activeOrder ? 'В работе' : 'Нет заказов'}</b><span>${activeOrder ? findService(activeOrder.items[0].serviceId).name : 'Записаться на услугу'}</span>
      </button>
      <button class="qtile" data-nav="profile">
        <div class="ic">${icon('star', 15, 'var(--lime)', 1.8)}</div>
        <b>${S.user.points.toLocaleString('ru-RU')}</b><span>баллов</span>
      </button>
    </div>
    <div class="sec"><div class="section-title">Популярные услуги<b data-nav="services">Все услуги</b></div></div>
    <div class="srow">${svcCards}</div>
    <div class="trust">
      <div class="trow"><div class="ic">${icon('shield', 16, '#F2F5F7', 1.6)}</div><div><b>Гарантия до 24 месяцев</b><span>на керамику и защитные плёнки</span></div></div>
      <div class="trow"><div class="ic">${icon('star', 16, '#F2F5F7', 1.6)}</div><div><b>Только оригинальные материалы</b><span>3M, Ceramic Pro, Koch Chemie</span></div></div>
      <div class="trow"><div class="ic">${icon('profile', 16, '#F2F5F7', 1.6)}</div><div><b>Сертифицированные мастера</b><span>от 7 лет опыта в премиум-детейлинге</span></div></div>
    </div>
  </div>`;
}

function screenServices() {
  const cats = ['Все', 'Мойка', 'Защита', 'Салон', 'Кузов', 'Оптика'];
  const active = ui.svcCategory;
  const list = SERVICES.filter(s => active === 'Все' || s.category === active);
  const chipsHtml = cats.map(c => `<div class="chip ${c === active ? 'on' : ''}" data-act="filter-cat" data-cat="${c}">${c}</div>`).join('');
  const rowsHtml = list.map(s => `
    <button class="row" data-nav="service/${s.id}">
      <div class="img">${icon(s.icon, 22, 'var(--lime)', 1.6)}</div>
      <div class="info"><b>${s.name}</b><div class="desc">${s.desc}</div><div class="price">от ${fmtPrice(s.price.sedan)}</div></div>
      <div class="chev">${icon('chevron', 18, 'currentColor', 1.8)}</div>
    </button>`).join('') || emptyState('services', 'Ничего не найдено', 'Попробуйте другую категорию');
  return `
  <div class="hdr-page">
    <div class="h1">Услуги</div>
    <div class="search">${icon('search', 16, 'currentColor', 1.7)}<input id="svc-search" placeholder="Поиск услуги или пакета"></div>
  </div>
  <div class="chips pad">${chipsHtml}</div>
  <div class="scroll pad">${rowsHtml}</div>`;
}

function screenServiceDetail(id) {
  const svc = findService(id) || SERVICES[0];
  const car = findCar(S, S.primaryCarId) || S.cars[0];
  if (!ui.selectedSize[svc.id]) ui.selectedSize[svc.id] = car.size;
  const size = ui.selectedSize[svc.id];
  const price = svc.price[size];
  const sizesHtml = Object.keys(SIZE_LABELS).map(key => {
    const on = key === size;
    return `<div class="size ${on ? 'on' : ''}" data-act="pick-size" data-svc="${svc.id}" data-size="${key}">
      <div style="display:flex;align-items:center;gap:12px;"><div class="radio ${on ? 'on' : ''}"></div><div><b>${SIZE_LABELS[key].title}</b><br><span>${SIZE_LABELS[key].hint}</span></div></div>
      <div class="pr">${fmtPrice(svc.price[key])}</div>
    </div>`;
  }).join('');
  const includeHtml = svc.include.map(t => `<div class="check">${icon('check', 16, 'currentColor', 2)}${t}</div>`).join('');
  const isFav = ui.favs[svc.id];
  return `
  <div class="scroll">
    <div class="hero2">
      <div class="hero2-glyph">${icon(svc.icon, 84, 'var(--lime)', 1)}</div>
      <div class="hero2-top">
        <button class="icon-btn" data-act="go-back">${icon('back', 16, '#F2F5F7', 2)}</button>
        <button class="icon-btn" data-act="toggle-fav" data-id="${svc.id}">${icon('heart', 16, isFav ? 'var(--lime)' : '#F2F5F7', 1.8)}</button>
      </div>
    </div>
    <div class="pad" style="padding-top:18px;">
      <div class="title">${svc.name}</div>
      <div class="meta"><span class="stars">★★★★★</span> <b>${svc.rating}</b> · ${svc.reviews} отзывов · от ${svc.duration}</div>
      <div class="p">${svc.desc}. Работаем по протоколу: фиксируем состояние до и после, используем сертифицированные материалы.</div>
      <div class="section-title">Что входит</div>
      ${includeHtml}
      <div class="section-title" style="margin-top:20px;">Стоимость по типу кузова</div>
      <div class="sizes">${sizesHtml}</div>
      <div class="section-title">Мастер</div>
      <div class="master"><div class="avatar">ДС</div><div><b>Дмитрий Соколов</b><span>Старший мастер · 312 работ · ★ 5.0</span></div></div>
    </div>
  </div>
  <div class="sticky">
    <div class="stickyrow">
      <div class="stprice"><span>Итого</span><b>${fmtPrice(price)}</b></div>
      <button class="btn btn-primary" style="flex:1" data-act="add-to-cart" data-id="${svc.id}">Добавить в заказ</button>
    </div>
  </div>`;
}

function screenGarage() {
  const carsHtml = S.cars.map(c => {
    const primary = c.id === S.primaryCarId;
    return `<button class="car ${primary ? 'primary' : ''}" data-act="select-car" data-id="${c.id}">
      <div class="car-ic">${icon('car', 26, 'var(--lime)', 1.6)}</div>
      <div class="car-info"><span class="tag">${carLabel(c)}</span><span class="plate">${c.plate}</span><span class="sub">${c.lastService}</span></div>
      <div class="ring" style="--pct:${c.passport}"><i>${c.passport}%</i></div>
    </button>`;
  }).join('');
  return `
  <div class="hdr-page">
    <div class="h1" style="display:flex;justify-content:space-between;align-items:center;">Мой гараж <button class="addbtn" data-act="open-addcar">${icon('plus', 18, 'var(--lime)', 2)}</button></div>
  </div>
  <div class="scroll pad">
    ${carsHtml}
    <button class="addcar" data-act="open-addcar">${icon('garage', 26, 'var(--t1)', 1.6)}<b>Добавить автомобиль</b><span style="font-size:11.5px;">Марка, модель, госномер и тип кузова</span></button>
  </div>`;
}

function screenBooking() {
  if (!S.draft || !S.draft.items || S.draft.items.length === 0) {
    return headerBack('Запись на детейлинг') + emptyState('calendar', 'Нечего бронировать', 'Сначала выберите услугу в каталоге', 'К услугам', 'services');
  }
  const draft = S.draft;
  if (ui.booking.carId == null) ui.booking.carId = draft.carId || S.primaryCarId;
  if (ui.booking.day == null) ui.booking.day = 0;
  const days = generateDays(6);
  const items = draft.items;
  const svcSummary = items.length === 1 ? findService(items[0].serviceId).name : `${items.length} ${ru(items.length, 'услуга', 'услуги', 'услуг')}`;
  const svcSub = items.length === 1 ? `${SIZE_LABELS[items[0].sizeKey].title} · ${fmtPrice(items[0].price)}` : `на сумму ${fmtPrice(items.reduce((s, i) => s + i.price, 0))}`;
  const carsHtml = S.cars.map(c => {
    const on = c.id === ui.booking.carId;
    return `<div class="carchip ${on ? 'on' : ''}" data-act="pick-car" data-id="${c.id}"><div class="img">${icon('car', 20, on ? 'var(--lime)' : 'var(--t1)', 1.6)}</div><span>${carLabel(c)}</span></div>`;
  }).join('');
  const daysHtml = days.map((d, i) => `<div class="day ${i === ui.booking.day ? 'on' : ''}" data-act="pick-day" data-idx="${i}"><span>${d.dow}</span><b>${d.num}</b></div>`).join('');
  const slotsArr = ['09:00', '11:00', '12:30', '14:00', '16:00', '18:00'];
  const slotsHtml = slotsArr.map(s => `<div class="slot ${s === ui.booking.slot ? 'on' : ''}" data-act="pick-slot" data-slot="${s}">${s}</div>`).join('');
  const locHtml = LOCATIONS.map(l => {
    const on = l.id === ui.booking.locId;
    return `<div class="locrow ${on ? 'on' : ''}" data-act="pick-loc" data-id="${l.id}">
      <div class="ic">${icon('pin', 16, '#F2F5F7', 1.7)}</div>
      <div><b>${l.name}</b><span>${l.sub}${l.extra ? ` · +${fmtPrice(l.extra)}` : ''}</span></div>
      <div class="radio ${on ? 'on' : ''}"></div>
    </div>`;
  }).join('');
  return `
  ${headerBack('Запись на детейлинг')}
  <div class="scroll pad">
    <div class="svcchip"><div class="img">${icon('shield', 20, 'var(--lime)', 1.5)}</div><div><b>${svcSummary}</b><span>${svcSub}</span></div></div>
    <div class="section-title">Автомобиль</div>
    <div class="carrow">${carsHtml}</div>
    <div class="section-title">Дата</div>
    <div class="days">${daysHtml}</div>
    <div class="section-title">Время</div>
    <div class="slots">${slotsHtml}</div>
    <div class="section-title">Место</div>
    <div class="loc">${locHtml}</div>
  </div>
  <div class="sticky"><button class="btn btn-primary" data-act="confirm-booking">Продолжить</button></div>`;
}

function screenCart() {
  const draft = S.draft;
  if (!draft || !draft.items.length) {
    return headerBack('Ваш заказ') + emptyState('gift', 'Корзина пуста', 'Выберите услугу в каталоге, чтобы оформить запись', 'К услугам', 'services');
  }
  const car = findCar(S, draft.carId) || S.cars[0];
  const loc = LOCATIONS.find(l => l.id === draft.locationId) || LOCATIONS[0];
  const t = draftTotals(draft);
  const itemsHtml = draft.items.map((it, idx) => {
    const svc = findService(it.serviceId);
    return `<div class="item"><div class="img">${icon(svc.icon, 18, 'var(--lime)', 1.5)}</div><div><b>${svc.name}</b><span>${SIZE_LABELS[it.sizeKey].title}</span></div><div class="pr">${fmtPrice(it.price)}</div><button class="rm" data-act="remove-item" data-idx="${idx}">${icon('close', 12, 'currentColor', 2)}</button></div>`;
  }).join('');
  return `
  ${headerBack('Ваш заказ')}
  <div class="scroll pad">
    <div class="sumcard"><div class="img">${icon('car', 20, 'var(--lime)', 1.6)}</div><div><b>${carLabel(car)} · ${draft.date || 'дата не выбрана'} · ${draft.time || ''}</b><span>${loc.name}</span></div></div>
    <div class="section-title">Услуги</div>
    ${itemsHtml}
    <div class="promo">
      <input id="promo-input" placeholder="Промокод (APEX10)" value="${draft.promo ? draft.promo.code : ''}">
      <button data-act="apply-promo">Применить</button>
    </div>
    ${ui.promoError ? `<div style="color:var(--red);font-size:11.5px;margin:-12px 0 16px;">Промокод не найден</div>` : ''}
    <div class="sums">
      <div class="sr"><span>Подытог</span><span>${fmtPrice(t.subtotal + t.locExtra)}</span></div>
      ${t.discount ? `<div class="sr disc"><span>Промокод ${draft.promo.code}</span><span>−${fmtPrice(t.discount)}</span></div>` : ''}
      <div class="sr total"><span>Итого</span><span>${fmtPrice(t.total)}</span></div>
    </div>
  </div>
  <div class="sticky"><button class="btn btn-primary" data-act="go-checkout">Перейти к оплате</button></div>`;
}

function screenCheckout() {
  const draft = S.draft;
  if (!draft || !draft.items.length) {
    return headerBack('Оплата') + emptyState('gift', 'Нечего оплачивать', 'Сначала соберите заказ в корзине', 'К услугам', 'services');
  }
  const t = draftTotals(draft);
  const methods = [
    { id: 'telegram', name: 'Telegram Pay', sub: 'Быстрая оплата без ввода карты', ic: 'telegram' },
    { id: 'card', name: 'Банковская карта', sub: 'Visa, Mastercard, МИР', ic: 'card' },
    { id: 'sbp', name: 'Оплата по СБП', sub: 'Через приложение банка', ic: 'sbp' }
  ];
  const payHtml = methods.map(m => {
    const on = m.id === ui.pay;
    return `<div class="payrow ${on ? 'on' : ''}" data-act="pick-pay" data-id="${m.id}"><div class="ic">${icon(m.ic, 18, '#F2F5F7', 1.7)}</div><div><b>${m.name}</b><span>${m.sub}</span></div><div class="radio ${on ? 'on' : ''}"></div></div>`;
  }).join('');
  return `
  ${headerBack('Оплата')}
  <div class="scroll pad">
    <div class="amount"><span>Сумма к оплате</span><b>${fmtPrice(t.total)}</b></div>
    <div class="section-title">Способ оплаты</div>
    <div class="pay">${payHtml}</div>
    <div class="note">${icon('shield', 16, 'currentColor', 1.6)}Списание произойдёт после подтверждения записи мастером. Отмена бесплатна за 12 часов до визита.</div>
  </div>
  <div class="sticky"><button class="btn btn-primary" data-act="pay-now">Оплатить ${fmtPrice(t.total)}</button></div>`;
}

function screenSuccess(orderId) {
  const order = S.orders.find(o => o.id === orderId) || S.orders[0];
  if (!order) return headerBack('Заказ') + emptyState('alert', 'Заказ не найден', '', 'На главную', 'home');
  const car = findCar(S, order.carId);
  const loc = LOCATIONS.find(l => l.id === order.locationId);
  return `
  <div class="wrap-center">
    <div class="ring-lg">${icon('check', 40, 'var(--lime)', 2)}</div>
    <h1>Заказ подтверждён</h1>
    <p class="sub">Мы забронировали пост и мастера. За 2 часа до визита пришлём напоминание в чат.</p>
    <div class="details">
      <div class="drow"><span>Автомобиль</span><b>${carLabel(car)}</b></div>
      <div class="drow"><span>Дата и время</span><b>${order.date} · ${order.time}</b></div>
      <div class="drow"><span>Место</span><b>${loc.name}</b></div>
      <div class="drow"><span>Мастер</span><b>Дмитрий Соколов</b></div>
      <div class="drow"><span>Номер заказа</span><b>#${order.id}</b></div>
    </div>
    <div class="btns">
      <button class="btn btn-primary" data-act="goto-tracking" data-id="${order.id}">Смотреть статус заказа</button>
      <button class="btn btn-ghost" data-nav="home">На главную</button>
    </div>
  </div>`;
}

function screenTracking(orderId) {
  const order = S.orders.find(o => o.id === orderId);
  if (!order) return headerBack('Заказ') + emptyState('alert', 'Заказ не найден', 'Возможно, он был удалён', 'К заказам', 'history');
  const car = findCar(S, order.carId);
  if (order.status === 'cancelled') {
    return headerBack('Заказ #' + order.id, carLabel(car)) +
      `<div class="scroll pad">${emptyState('close', 'Заказ отменён', 'Вы можете записаться повторно на удобное время', 'Записаться снова', 'services')}</div>`;
  }
  const stageIndex = order.stageIndex;
  const done = order.status === 'done';
  const stepsHtml = TRACKING_STAGES.map((s, i) => {
    const cls = i < stageIndex ? 'done' : (i === stageIndex ? 'active' : '');
    return `<div class="step ${cls}"><div class="sdot">${i < stageIndex ? icon('check', 10, 'var(--oninv)', 3) : ''}</div><span>${s.name}</span></div>`;
  }).join('');
  const tlHtml = TRACKING_STAGES.map((s, i) => {
    const cls = i < stageIndex ? 'done' : (i === stageIndex ? 'active' : '');
    const label = i < stageIndex ? 'завершено' : (i === stageIndex ? (done ? 'завершено' : 'в процессе') : 'ожидается');
    return `<div class="tlrow ${cls}"><div class="tlline"></div><div class="tldot">${i < stageIndex || (done && i === stageIndex) ? icon('check', 11, 'var(--oninv)', 3) : ''}</div><div><b>${s.full}</b><span>${label}</span></div></div>`;
  }).join('');
  return `
  <div class="hdr">
    <div class="hdr-left"><button class="icon-btn" data-act="go-back">${icon('back', 16, '#F2F5F7', 2)}</button>
      <div class="hdr-title">Заказ #${order.id}<small>${carLabel(car)}</small></div>
    </div>
    <div class="pulse ${done ? 'done' : ''}"><i></i>${done ? 'Готово' : 'В работе'}</div>
  </div>
  <div class="scroll pad">
    <div class="stage">
      ${CAR_BLUEPRINT_SVG.replace('<svg ', '<svg class="stage-blueprint" ')}
      ${stageIndex > 0 ? `<div class="pin done" style="top:36%;left:26%;"></div>` : ''}
      ${!done ? `<div class="pin" style="top:60%;left:66%;"></div>` : ''}
      <div class="tag2" style="top:20%;left:8%;">${stageIndex > 0 ? 'Диски — готово' : 'Ожидание приёма'}</div>
      ${!done ? `<div class="tag2" style="top:70%;left:44%;">${TRACKING_STAGES[stageIndex].full}</div>` : ''}
    </div>
    ${!done ? `<div class="steps">${stepsHtml}</div>` : ''}
    ${!done ? `<div class="eta">${icon('clock', 20, 'var(--lime)', 1.7)}<div><b>Ориентировочно готово к ${etaTime(order)}</b><span>Обновляем статус каждые несколько минут</span></div></div>` : ''}
    <div class="section-title">Ход работы</div>
    <div class="tl">${tlHtml}</div>
    <div class="master"><div class="avatar">ДС</div><div><b>Дмитрий Соколов</b><span>${done ? 'Обслуживал ваш автомобиль' : 'Ваш мастер сегодня'}</span></div><button class="chatbtn" data-act="noop">${icon('chat', 16, 'currentColor', 1.7)}</button></div>
  </div>`;
}

function screenHistory() {
  const tab = ui.historyTab;
  const filtered = S.orders.filter(o => o.status === tab).sort((a, b) => b.createdAt - a.createdAt);
  const rows = filtered.length ? filtered.map(o => {
    const car = findCar(S, o.carId);
    const svcNames = o.items.map(it => findService(it.serviceId).name).join(', ');
    const badge = o.status === 'active' ? '<div class="status st-prog">В работе</div>' : o.status === 'done' ? '<div class="status st-done">Готово</div>' : '<div class="status st-cancel">Отменён</div>';
    return `<button class="ord" data-act="goto-tracking" data-id="${o.id}"><div class="img">${icon(findService(o.items[0].serviceId).icon, 20, 'var(--lime)', 1.6)}</div><div class="info"><b>${svcNames} · ${carLabel(car)}</b><div class="meta">${o.date} · ${o.time}</div><div class="pr">${fmtPrice(o.total)}</div></div>${badge}</button>`;
  }).join('') : emptyState('orders', 'Здесь пока пусто', 'Заказы этой категории появятся здесь');
  return `
  <div class="hdr-page">
    <div class="h1">Заказы</div>
    <div class="tabs">
      <button class="tab ${tab === 'active' ? 'on' : ''}" data-act="history-tab" data-tab="active">Активные</button>
      <button class="tab ${tab === 'done' ? 'on' : ''}" data-act="history-tab" data-tab="done">Завершённые</button>
      <button class="tab ${tab === 'cancelled' ? 'on' : ''}" data-act="history-tab" data-tab="cancelled">Отменённые</button>
    </div>
  </div>
  <div class="scroll pad">${rows}</div>`;
}

function screenProfile() {
  const { cur, next } = currentTier(S.user.points);
  const pct = next ? Math.min(100, Math.round((S.user.points - cur.min) / (next.min - cur.min) * 100)) : 100;
  const initials = S.user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `
  <div class="scroll pad" style="padding-top:calc(16px + var(--safe-t));">
    <div class="who">
      <div class="avatar" style="width:60px;height:60px;font-size:18px;">${initials}</div>
      <div><b>${S.user.name}</b><span>${S.user.phone}</span></div>
      <button class="editbtn" data-act="noop">${icon('edit', 15, 'currentColor', 1.7)}</button>
    </div>
    <div class="tier">
      <div class="tier-top"><b>Уровень ${cur.name}</b><span>${S.user.points.toLocaleString('ru-RU')} баллов</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="tier-sub">${next ? `Ещё ${(next.min - S.user.points).toLocaleString('ru-RU')} баллов до уровня ${next.name}` : 'Максимальный уровень достигнут'}</div>
    </div>
    <div class="menu">
      <button class="mrow" data-nav="garage"><div class="ic">${icon('garage', 16, '#F2F5F7', 1.6)}</div><b>Мои автомобили</b><div class="chev">${icon('chevron', 16, 'currentColor', 1.8)}</div></button>
      <button class="mrow" data-nav="history"><div class="ic">${icon('orders', 16, '#F2F5F7', 1.6)}</div><b>История заказов</b><div class="chev">${icon('chevron', 16, 'currentColor', 1.8)}</div></button>
      <button class="mrow" data-act="noop"><div class="ic">${icon('card', 16, '#F2F5F7', 1.6)}</div><b>Способы оплаты</b><div class="chev">${icon('chevron', 16, 'currentColor', 1.8)}</div></button>
      <button class="mrow" data-act="noop"><div class="ic">${icon('gift', 16, '#F2F5F7', 1.6)}</div><b>Промокоды</b><div class="chev">${icon('chevron', 16, 'currentColor', 1.8)}</div></button>
      <button class="mrow" data-act="noop"><div class="ic">${icon('users', 16, '#F2F5F7', 1.6)}</div><b>Пригласить друга</b><div class="chev">${icon('chevron', 16, 'currentColor', 1.8)}</div></button>
      <button class="mrow" data-act="noop"><div class="ic">${icon('support', 16, '#F2F5F7', 1.6)}</div><b>Поддержка</b><div class="chev">${icon('chevron', 16, 'currentColor', 1.8)}</div></button>
      <button class="mrow" data-act="noop"><div class="ic">${icon('gear', 16, '#F2F5F7', 1.6)}</div><b>Настройки</b><div class="chev">${icon('chevron', 16, 'currentColor', 1.8)}</div></button>
    </div>
    <button class="logout" data-act="reset-demo">${icon('logout', 16, 'currentColor', 1.8)}Сбросить демо-данные</button>
  </div>`;
}

// ---------- add-car sheet ----------
function renderAddCarSheet() {
  return `<div class="sheet-backdrop">
    <div class="sheet" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h2 style="margin:0;">Добавить автомобиль</h2>
        <button class="icon-btn" data-act="close-sheet">${icon('close', 16, 'currentColor', 2)}</button>
      </div>
      <div class="sheet-field"><label class="lbl">Марка и модель</label><input id="nc-brand" placeholder="Например, BMW M5"></div>
      <div class="sheet-field"><label class="lbl">Госномер</label><input id="nc-plate" placeholder="А 000 АА 197"></div>
      <label class="lbl">Тип кузова</label>
      <div class="sizepick">
        <div class="chip on" data-act="nc-size" data-size="sedan">Седан</div>
        <div class="chip" data-act="nc-size" data-size="crossover">Кроссовер</div>
        <div class="chip" data-act="nc-size" data-size="suv">Внедорожник</div>
      </div>
      <button class="btn btn-primary" data-act="submit-addcar">Добавить</button>
    </div>
  </div>`;
}
function openAddCarSheet() {
  ui.newCarSize = 'sedan';
  document.getElementById('sheet-root').innerHTML = renderAddCarSheet();
  requestAnimationFrame(() => { const b = document.querySelector('.sheet-backdrop'); if (b) b.classList.add('show'); });
}
function closeSheet() {
  const root = document.getElementById('sheet-root');
  const backdrop = root.querySelector('.sheet-backdrop');
  if (backdrop) { backdrop.classList.remove('show'); setTimeout(() => { root.innerHTML = ''; }, 200); } else root.innerHTML = '';
}

// ---------- toast ----------
function toast(title, sub) {
  const root = document.getElementById('toast-root');
  root.innerHTML = `<div class="toast">${icon('check', 18, 'var(--lime)', 2)}<div><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div></div>`;
  requestAnimationFrame(() => { const t = root.querySelector('.toast'); if (t) t.classList.add('show'); });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { const t = root.querySelector('.toast'); if (t) t.classList.remove('show'); }, 2600);
}

// ---------- tracking live progress ----------
function stopTrackingTimer() { if (trackingTimer) { clearInterval(trackingTimer); trackingTimer = null; } }
function startTrackingTimer(orderId) {
  stopTrackingTimer();
  const o = S.orders.find(x => x.id === orderId);
  if (!o || o.status !== 'active' || o.stageIndex >= 4) return;
  trackingTimer = setInterval(() => {
    const ord = S.orders.find(x => x.id === orderId);
    if (!ord) return stopTrackingTimer();
    ord.stageIndex = Math.min(4, ord.stageIndex + 1);
    if (ord.stageIndex >= 4) { ord.status = 'done'; stopTrackingTimer(); if (S.activeOrderId === orderId) S.activeOrderId = null; }
    saveState(S);
    if (parseHash().route === 'tracking' && parseHash().param === orderId) render();
  }, 9000);
}

// ---------- actions ----------
function addToCart(serviceId) {
  const svc = findService(serviceId);
  const size = ui.selectedSize[serviceId] || (findCar(S, S.primaryCarId) || S.cars[0]).size;
  const price = svc.price[size];
  const wasEmpty = !S.draft || !S.draft.date;
  if (!S.draft) S.draft = { items: [], carId: S.primaryCarId, date: null, time: null, locationId: 'studio', promo: null };
  S.draft.items.push({ serviceId, sizeKey: size, price });
  saveState(S);
  haptic();
  toast('Добавлено в заказ', svc.name);
  nav(wasEmpty ? 'booking' : 'cart');
}
function confirmBooking() {
  const days = generateDays(6);
  const d = days[ui.booking.day] || days[0];
  S.draft.carId = ui.booking.carId;
  S.draft.date = d.isToday ? 'Сегодня' : `${d.dow}, ${d.num} ${d.month}`;
  S.draft.time = ui.booking.slot;
  S.draft.locationId = ui.booking.locId;
  saveState(S);
  haptic();
  nav('cart');
}
function removeItem(idx) {
  S.draft.items.splice(idx, 1);
  if (S.draft.items.length === 0) S.draft = null;
  saveState(S);
  render();
}
function applyPromo() {
  const val = (document.getElementById('promo-input').value || '').trim().toUpperCase();
  if (val === 'APEX10') { S.draft.promo = { code: 'APEX10', pct: 10 }; ui.promoError = false; toast('Промокод применён', '−10% к заказу'); }
  else { S.draft.promo = null; ui.promoError = !!val; }
  saveState(S);
  render();
}
function payNow() {
  const draft = S.draft; if (!draft) return;
  const t = draftTotals(draft);
  const id = 'APX-' + Math.floor(10000 + Math.random() * 90000);
  const order = { id, carId: draft.carId, items: draft.items.slice(), date: draft.date, time: draft.time, locationId: draft.locationId, total: t.total, status: 'active', stageIndex: 0, createdAt: Date.now() };
  S.orders.unshift(order);
  S.activeOrderId = id;
  S.user.points += Math.round(t.total / 1000);
  S.draft = null;
  saveState(S);
  hapticNotify('success');
  nav('success/' + id);
}
function pickNcSize(el) {
  el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  ui.newCarSize = el.dataset.size;
}
function submitAddCar() {
  const brand = document.getElementById('nc-brand').value.trim();
  const plate = document.getElementById('nc-plate').value.trim();
  if (!brand) { toast('Укажите марку и модель'); return; }
  const id = 'car' + Date.now();
  S.cars.push({ id, brand: '', model: brand, plate: plate || '—', size: ui.newCarSize, passport: 100, lastService: 'Автомобиль только добавлен' });
  saveState(S);
  closeSheet();
  render();
  toast('Автомобиль добавлен', brand);
}
function resetDemo() {
  const doReset = () => { S = resetState(); ui = defaultUi(); nav('home'); render(); toast('Демо-данные сброшены'); };
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg && tg.showConfirm) tg.showConfirm('Сбросить все демо-данные?', (ok) => { if (ok) doReset(); });
  else if (confirm('Сбросить все демо-данные?')) doReset();
}

function handleAction(act, data, el) {
  switch (act) {
    case 'go-back': history.back(); break;
    case 'pick-size': ui.selectedSize[data.svc] = data.size; render(); break;
    case 'add-to-cart': addToCart(data.id); break;
    case 'toggle-fav': ui.favs[data.id] = !ui.favs[data.id]; render(); break;
    case 'pick-car': ui.booking.carId = data.id; render(); break;
    case 'pick-day': ui.booking.day = parseInt(data.idx, 10); render(); break;
    case 'pick-slot': ui.booking.slot = data.slot; render(); break;
    case 'pick-loc': ui.booking.locId = data.id; render(); break;
    case 'confirm-booking': confirmBooking(); break;
    case 'remove-item': removeItem(parseInt(data.idx, 10)); break;
    case 'apply-promo': applyPromo(); break;
    case 'go-checkout': haptic(); nav('checkout'); break;
    case 'pick-pay': ui.pay = data.id; render(); break;
    case 'pay-now': payNow(); break;
    case 'goto-tracking': nav('tracking/' + data.id); break;
    case 'open-active-order': { const o = S.orders.find(x => x.status === 'active'); nav(o ? 'tracking/' + o.id : 'services'); break; }
    case 'select-car': S.primaryCarId = data.id; saveState(S); render(); toast('Основной автомобиль обновлён'); break;
    case 'open-addcar': openAddCarSheet(); break;
    case 'close-sheet': closeSheet(); break;
    case 'nc-size': pickNcSize(el); break;
    case 'submit-addcar': submitAddCar(); break;
    case 'history-tab': ui.historyTab = data.tab; render(); break;
    case 'filter-cat': ui.svcCategory = data.cat; render(); break;
    case 'reset-demo': resetDemo(); break;
    case 'noop': toast('Скоро будет доступно'); break;
  }
}

// ---------- delegated events ----------
function onBodyClick(e) {
  const navEl = e.target.closest('[data-nav]');
  if (navEl) { e.preventDefault(); nav(navEl.dataset.nav); return; }
  const backdrop = e.target.closest('.sheet-backdrop');
  if (backdrop && e.target === backdrop) { closeSheet(); return; }
  const actEl = e.target.closest('[data-act]');
  if (actEl) { e.preventDefault(); handleAction(actEl.dataset.act, actEl.dataset, actEl); }
}
function onBodyInput(e) {
  if (e.target.id === 'svc-search') {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('#app .row[data-nav^="service/"]').forEach(row => {
      row.style.display = (!q || row.textContent.toLowerCase().includes(q)) ? '' : 'none';
    });
  }
}

// ---------- Telegram WebApp integration ----------
function haptic(style) {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(style || 'light');
}
function hapticNotify(type) {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred(type || 'success');
}
function syncBackButton(route) {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg || !tg.BackButton) return;
  if (TAB_ROUTES.includes(route)) tg.BackButton.hide(); else tg.BackButton.show();
}
function initTelegram() {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  try { tg.ready(); } catch (e) {}
  try { tg.expand(); } catch (e) {}
  try { if (tg.requestFullscreen) tg.requestFullscreen(); } catch (e) {}
  try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) { try { tg.isVerticalSwipesEnabled = false; } catch (e2) {} }
  try { tg.setHeaderColor('#0A0C0E'); } catch (e) {}
  try { tg.setBackgroundColor('#0A0C0E'); } catch (e) {}
  try { tg.setBottomBarColor && tg.setBottomBarColor('#0A0C0E'); } catch (e) {}
  const updateVH = () => { document.documentElement.style.setProperty('--tg-vh', (tg.viewportStableHeight || tg.viewportHeight || window.innerHeight) + 'px'); };
  const updateSafeArea = () => {
    const sa = tg.safeAreaInset || {};
    const csa = tg.contentSafeAreaInset || {};
    document.documentElement.style.setProperty('--tg-safe-top', ((sa.top || 0) + (csa.top || 0)) + 'px');
    document.documentElement.style.setProperty('--tg-safe-bottom', ((sa.bottom || 0) + (csa.bottom || 0)) + 'px');
  };
  updateVH();
  updateSafeArea();
  try { tg.onEvent('viewportChanged', updateVH); } catch (e) {}
  try { tg.onEvent('fullscreenChanged', () => { updateVH(); updateSafeArea(); }); } catch (e) {}
  try { tg.onEvent('safeAreaChanged', updateSafeArea); } catch (e) {}
  try { tg.onEvent('contentSafeAreaChanged', updateSafeArea); } catch (e) {}
  try { tg.BackButton.onClick(() => history.back()); } catch (e) {}
}

// ---------- splash intro ----------
function playSplash(done) {
  const root = document.getElementById('splash-root');
  root.innerHTML = `
    <div id="splash">
      <div class="splash-stage" id="splash-stage">
        <div class="splash-shadow"></div>
        <img class="splash-car" src="img/car-hero.png" alt="">
      </div>
      <div class="splash-logo" id="splash-logo">
        <div class="splash-word">APE<span>X</span></div>
        <div class="splash-tag">Detailing Studio</div>
      </div>
    </div>`;
  const splashEl = document.getElementById('splash');
  const stage = document.getElementById('splash-stage');
  const logo = document.getElementById('splash-logo');
  let finished = false;
  let autoTimer = null;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(autoTimer);
    splashEl.classList.add('out');
    setTimeout(() => { root.innerHTML = ''; done(); }, 380);
  };
  setTimeout(() => { stage.classList.add('drive'); }, 200);
  setTimeout(() => { logo.classList.add('show'); }, 2725);
  splashEl.addEventListener('click', finish, { once: true });
  autoTimer = setTimeout(finish, 4625);
}

// ---------- boot ----------
function boot() {
  initTelegram();
  document.body.addEventListener('click', onBodyClick);
  document.body.addEventListener('input', onBodyInput);
  window.addEventListener('hashchange', render);
  if (!location.hash || location.hash === '#') location.hash = '/home';
  playSplash(render);
}
document.addEventListener('DOMContentLoaded', boot);
