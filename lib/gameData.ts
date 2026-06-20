import type { Profession, Dream, Asset, CellType } from '@/types/database'

export const PROFESSIONS: Profession[] = [
  { id: 'courier',    name: 'Курьер',           icon: '🛵', salary: 120000, expenses: 85000,  initial_debt: 30000,
    expense_breakdown: [{n:'Аренда квартиры',a:35000},{n:'Еда и быт',a:25000},{n:'Транспорт',a:15000},{n:'Налоги/связь',a:10000}],
    debt_breakdown: [{n:'Кредитная карта',a:30000,r:0.16}] },
  { id: 'beauty',     name: 'Бьюти-мастер',     icon: '💅', salary: 100000, expenses: 68000,  initial_debt: 20000,
    expense_breakdown: [{n:'Аренда квартиры',a:28000},{n:'Еда и быт',a:20000},{n:'Транспорт',a:12000},{n:'Налоги/связь',a:8000}],
    debt_breakdown: [{n:'Кредитная карта',a:20000,r:0.18}] },
  { id: 'taxi',       name: 'Таксист',           icon: '🚕', salary: 115000, expenses: 78000,  initial_debt: 50000,
    expense_breakdown: [{n:'Аренда квартиры',a:30000},{n:'Еда и быт',a:22000},{n:'Транспорт',a:18000},{n:'Налоги/связь',a:8000}],
    debt_breakdown: [{n:'Автокредит (Kia Rio)',a:50000,r:0.14}] },
  { id: 'buyer',      name: 'Байер',             icon: '🧳', salary: 130000, expenses: 88000,  initial_debt: 40000,
    expense_breakdown: [{n:'Аренда квартиры',a:38000},{n:'Еда и быт',a:25000},{n:'Транспорт',a:15000},{n:'Налоги/связь',a:10000}],
    debt_breakdown: [{n:'Кредитная карта',a:40000,r:0.16}] },
  { id: 'lawyer',     name: 'Юрист',             icon: '⚖️', salary: 160000, expenses: 110000, initial_debt: 80000,
    expense_breakdown: [{n:'Аренда квартиры',a:50000},{n:'Еда и быт',a:30000},{n:'Транспорт',a:18000},{n:'Налоги/связь',a:12000}],
    debt_breakdown: [{n:'Автокредит (Toyota)',a:80000,r:0.13}] },
  { id: 'doctor',     name: 'Врач',              icon: '🩺', salary: 190000, expenses: 130000, initial_debt: 100000,
    expense_breakdown: [{n:'Аренда квартиры',a:55000},{n:'Еда и быт',a:35000},{n:'Транспорт',a:25000},{n:'Налоги/связь',a:15000}],
    debt_breakdown: [{n:'Автокредит (Skoda)',a:60000,r:0.13},{n:'Кредитная карта',a:40000,r:0.18}] },
  { id: 'seller',     name: 'Селлер',            icon: '📦', salary: 140000, expenses: 95000,  initial_debt: 60000,
    expense_breakdown: [{n:'Аренда квартиры',a:40000},{n:'Еда и быт',a:28000},{n:'Склад/логистика',a:18000},{n:'Налоги/связь',a:9000}],
    debt_breakdown: [{n:'Кредит на оборотку',a:60000,r:0.16}] },
  { id: 'cafe',       name: 'Владелец кофейни',  icon: '☕', salary: 150000, expenses: 105000, initial_debt: 120000,
    expense_breakdown: [{n:'Аренда точки',a:55000},{n:'Продукты/сырьё',a:30000},{n:'Квартира',a:15000},{n:'Налоги/связь',a:5000}],
    debt_breakdown: [{n:'Лизинг оборудования',a:120000,r:0.14}] },
  { id: 'creator',    name: 'Видеокреатор',      icon: '🎬', salary: 130000, expenses: 85000,  initial_debt: 25000,
    expense_breakdown: [{n:'Аренда квартиры',a:38000},{n:'Еда и быт',a:22000},{n:'Подписки/ПО',a:15000},{n:'Налоги/связь',a:10000}],
    debt_breakdown: [{n:'Кредит на технику',a:25000,r:0.15}] },
  { id: 'arbitrage',  name: 'Арбитражник',       icon: '📲', salary: 180000, expenses: 120000, initial_debt: 45000,
    expense_breakdown: [{n:'Аренда квартиры',a:50000},{n:'Рекламный бюджет',a:40000},{n:'Еда и быт',a:20000},{n:'Налоги/связь',a:10000}],
    debt_breakdown: [{n:'Кредитная карта',a:45000,r:0.18}] },
  { id: 'crypto',     name: 'Криптотрейдер',     icon: '🪙', salary: 150000, expenses: 98000,  initial_debt: 40000,
    expense_breakdown: [{n:'Аренда квартиры',a:42000},{n:'Еда и быт',a:28000},{n:'Подписки/VPN',a:18000},{n:'Налоги/связь',a:10000}],
    debt_breakdown: [{n:'Кредитная карта',a:40000,r:0.19}] },
  { id: 'investor',   name: 'Частный инвестор',  icon: '📊', salary: 60000,  expenses: 35000,  initial_debt: 0,
    expense_breakdown: [{n:'Аренда квартиры',a:15000},{n:'Еда и быт',a:12000},{n:'Транспорт',a:5000},{n:'Налоги/связь',a:3000}],
    debt_breakdown: [] },
  { id: 'mechanic',   name: 'Монтажник',         icon: '🔩', salary: 125000, expenses: 82000,  initial_debt: 30000,
    expense_breakdown: [{n:'Аренда квартиры',a:32000},{n:'Еда и быт',a:25000},{n:'Транспорт',a:15000},{n:'Налоги/связь',a:10000}],
    debt_breakdown: [{n:'Кредитная карта',a:30000,r:0.16}] },
  { id: 'realtor',    name: 'Риелтор',           icon: '🔑', salary: 135000, expenses: 88000,  initial_debt: 35000,
    expense_breakdown: [{n:'Аренда квартиры',a:38000},{n:'Еда и быт',a:25000},{n:'Транспорт',a:18000},{n:'Налоги/связь',a:7000}],
    debt_breakdown: [{n:'Автокредит (Hyundai)',a:35000,r:0.13}] },
  { id: 'drone',      name: 'Оператор дронов',   icon: '🛸', salary: 140000, expenses: 92000,  initial_debt: 40000,
    expense_breakdown: [{n:'Аренда квартиры',a:38000},{n:'Еда и быт',a:25000},{n:'Транспорт/топливо',a:17000},{n:'Налоги/связь',a:12000}],
    debt_breakdown: [{n:'Кредит на оборудование',a:40000,r:0.15}] },
  { id: 'vibecoder',  name: 'Вайб-кодер',        icon: '🤖', salary: 320000, expenses: 210000, initial_debt: 70000,
    expense_breakdown: [{n:'Аренда квартиры',a:90000},{n:'Еда и доставка',a:60000},{n:'Подписки/ПО',a:40000},{n:'Налоги/связь',a:20000}],
    debt_breakdown: [{n:'Автокредит (BMW)',a:70000,r:0.13}] },
  { id: 'pvz',        name: 'Владелец ПВЗ',      icon: '🏪', salary: 125000, expenses: 82000,  initial_debt: 90000,
    expense_breakdown: [{n:'Аренда точки',a:45000},{n:'Квартира',a:20000},{n:'Еда и быт',a:12000},{n:'Налоги/связь',a:5000}],
    debt_breakdown: [{n:'Лизинг оборудования',a:90000,r:0.14}] },
  { id: 'brand',      name: 'Свой бренд',        icon: '🏷️', salary: 160000, expenses: 108000, initial_debt: 110000,
    expense_breakdown: [{n:'Аренда склада',a:50000},{n:'Квартира',a:35000},{n:'Маркетинг',a:15000},{n:'Налоги/связь',a:8000}],
    debt_breakdown: [{n:'Кредит на производство',a:110000,r:0.15}] },
  { id: 'restaurant', name: 'Ресторатор',        icon: '🍽️', salary: 175000, expenses: 118000, initial_debt: 180000,
    expense_breakdown: [{n:'Аренда зала',a:70000},{n:'Продукты/кухня',a:30000},{n:'Квартира',a:12000},{n:'Налоги/связь',a:6000}],
    debt_breakdown: [{n:'Лизинг кухни',a:120000,r:0.14},{n:'Кредитная карта',a:60000,r:0.18}] },
  { id: 'targetolog', name: 'Таргетолог',        icon: '🎯', salary: 140000, expenses: 92000,  initial_debt: 32000,
    expense_breakdown: [{n:'Аренда квартиры',a:38000},{n:'Еда и быт',a:25000},{n:'Рекламные инструменты',a:20000},{n:'Налоги/связь',a:9000}],
    debt_breakdown: [{n:'Кредитная карта',a:32000,r:0.17}] },
]

export const DREAMS: Dream[] = [
  { id: 'baikal',     name: 'Дом на берегу Байкала',   price: 60000000,  passive_required: 220000, icon: '🏞️' },
  { id: 'trip',       name: 'Кругосветка всей семьёй', price: 35000000,  passive_required: 180000, icon: '🌍' },
  { id: 'restaurant', name: 'Свой ресторан',           price: 50000000,  passive_required: 200000, icon: '🍽️' },
  { id: 'yacht',      name: 'Яхта в Средиземном море', price: 80000000,  passive_required: 280000, icon: '⛵' },
  { id: 'fund',       name: 'Благотворительный фонд',  price: 40000000,  passive_required: 160000, icon: '🕊️' },
  { id: 'plane',      name: 'Личный самолёт',          price: 120000000, passive_required: 400000, icon: '✈️' },
  { id: 'castle',     name: 'Замок с виноградником',   price: 100000000, passive_required: 350000, icon: '🏰' },
  { id: 'space',      name: 'Полёт в космос',          price: 150000000, passive_required: 500000, icon: '🚀' },
]

// Базовая ключевая ставка (влияет на ежемесячный платёж по новым долгам)
export const KEY_RATE_DEFAULT = 0.16

// ── МАЛЫЕ СДЕЛКИ (взнос до 800К) ──────────────────────────────
export const SMALL_DEALS: Asset[] = [
  { id: 'vending',   name: 'Вендинговый автомат', type: 'business',    price: 150000,  down_payment: 150000,  passive_income: 5000,  debt: 0 },
  { id: 'telegram',  name: 'Telegram-канал',      type: 'business',    price: 350000,  down_payment: 350000,  passive_income: 7000,  debt: 0 },
  { id: 'pvz_point', name: 'Точка ПВЗ',           type: 'business',    price: 500000,  down_payment: 500000,  passive_income: 13000, debt: 0 },
  { id: 'garage',    name: 'Гараж в аренду',      type: 'real_estate', price: 800000,  down_payment: 800000,  passive_income: 12000, debt: 0 },
  { id: 'dacha',     name: 'Дача под аренду',     type: 'real_estate', price: 1800000, down_payment: 270000,  passive_income: 22000, debt: 1530000 },
  { id: 'laundry',   name: 'Прачечная',           type: 'business',    price: 1000000, down_payment: 150000,  passive_income: 20000, debt: 850000  },
]

// ── КРУПНЫЕ СДЕЛКИ (взнос от 300К) ────────────────────────────
export const LARGE_DEALS: Asset[] = [
  { id: 'studio',     name: 'Квартира-студия',        type: 'real_estate', price: 3200000, down_payment: 320000,  passive_income: 42000, debt: 2880000 },
  { id: 'flat2',      name: 'Двушка у метро',         type: 'real_estate', price: 5000000, down_payment: 500000,  passive_income: 62000, debt: 4500000 },
  { id: 'cafe_small', name: 'Кофейня «Зерно»',        type: 'business',    price: 1800000, down_payment: 360000,  passive_income: 38000, debt: 1440000 },
  { id: 'carwash',    name: 'Автомойка',              type: 'business',    price: 2500000, down_payment: 500000,  passive_income: 52000, debt: 2000000 },
  { id: 'commercial', name: 'Коммерческое помещение', type: 'real_estate', price: 7000000, down_payment: 700000,  passive_income: 90000, debt: 6300000 },
  { id: 'storage',    name: 'Склад-хранилище',        type: 'business',    price: 4000000, down_payment: 400000,  passive_income: 58000, debt: 3600000 },
]

export const ASSETS: Asset[] = [...SMALL_DEALS, ...LARGE_DEALS]

// ── АКЦИИ ──────────────────────────────────────────────────────
export const STOCKS = [
  { id: 'sber',  name: 'Сбер',    ticker: 'SBER', price: 305,   min: 180,  max: 520,  volatility: 0.08, dividend: 0.06, icon: '🏦', lot: 10 },
  { id: 'ozon',  name: 'Озон',    ticker: 'OZON', price: 5000,  min: 2000, max: 9000, volatility: 0.15, dividend: 0,    icon: '📦', lot: 1  },
  { id: 'nvda',  name: 'NVDA',    ticker: 'NVDA', price: 16500, min: 8000, max: 32000,volatility: 0.12, dividend: 0.01, icon: '💻', lot: 1  },
  { id: 'ydex',  name: 'Яндекс',  ticker: 'YDEX', price: 4800,  min: 2500, max: 8500, volatility: 0.10, dividend: 0,    icon: '🔍', lot: 1  },
  { id: 'gazp',  name: 'Газпром', ticker: 'GAZP', price: 120,   min: 60,   max: 280,  volatility: 0.09, dividend: 0.10, icon: '⛽', lot: 10 },
  { id: 'gold',  name: 'Золото',  ticker: 'GOLD', price: 11000, min: 7000, max: 18000,volatility: 0.06, dividend: 0,    icon: '🥇', lot: 1  },
]

// ── КРИПТА ─────────────────────────────────────────────────────
export const CRYPTO = [
  { id: 'btc',   name: 'Bitcoin',  ticker: 'BTC',  price: 95000, min: 40000, max: 200000, volatility: 0.20, icon: '₿',  description: 'Цифровое золото. Медленно но верно.' },
  { id: 'eth',   name: 'Ethereum', ticker: 'ETH',  price: 33500, min: 12000, max: 80000,  volatility: 0.25, icon: '⟠',  description: 'Платформа для всего. Волатильнее биткоина.' },
  { id: 'ton',   name: 'TON',      ticker: 'TON',  price: 580,   min: 150,   max: 2500,   volatility: 0.30, icon: '💎', description: 'Криптовалюта Telegram. Популярна в СНГ.' },
  { id: 'hmstr', name: 'Hamster',  ticker: 'HMSTR',price: 2,     min: 0.3,   max: 20,     volatility: 0.60, icon: '🐹', description: 'Мем-коин. Может x9 или упасть до нуля.' },
]

// ── КРЕДИТЫ ────────────────────────────────────────────────────
export const CREDIT_PRODUCTS = [
  { id: 'credit_100', name: 'Кредит 100К',  amount: 100000,  monthly: 5000,  rate: 0.18 },
  { id: 'credit_300', name: 'Кредит 300К',  amount: 300000,  monthly: 13000, rate: 0.18 },
  { id: 'credit_500', name: 'Кредит 500К',  amount: 500000,  monthly: 20000, rate: 0.16 },
  { id: 'credit_1m',  name: 'Кредит 1 млн', amount: 1000000, monthly: 35000, rate: 0.15 },
]

// ── ПУЛ УДАРОВ (случайно выбирается при попадании на клетку) ────
export const HIT_EVENTS: { desc: string; amount: number; skip_turns?: number; lose_salary?: boolean }[] = [
  { desc: 'Штраф ГИБДД за превышение',               amount: 15000  },
  { desc: 'Срочный ремонт машины',                    amount: 40000  },
  { desc: 'Больничный — потеря дохода',               amount: 50000  },
  { desc: 'Налоговая проверка — доначисление',        amount: 75000  },
  { desc: 'Прорвало трубу — ремонт квартиры',        amount: 60000  },
  { desc: 'Кража — ноутбук и телефон',               amount: 80000  },
  { desc: 'Возврат товара клиенту — потеря партии',  amount: 35000  },
  { desc: 'Залили соседи — ремонт потолка',          amount: 55000  },
  { desc: 'Юридический спор с партнёром',            amount: 120000 },
  { desc: 'Взломали карту — несанкционированный перевод', amount: 45000 },
  { desc: 'Штраф за опоздание с налоговой декларацией',  amount: 30000 },
  { desc: 'Форс-мажор — возврат предоплаты клиентам', amount: 90000  },
  { desc: 'Мошенники — выманили предоплату',         amount: 65000  },
  { desc: 'Конкурент скопировал продукт — падение продаж', amount: 70000 },
  { desc: 'Сорвалась сделка — потеря задатка',       amount: 50000  },
  { desc: 'Штраф за нарушение договора аренды',      amount: 25000  },
  { desc: 'Просрочка платежа — пени и штрафы',       amount: 18000  },
  { desc: 'Санитарная проверка — временное закрытие', amount: 85000  },
  { desc: 'Обвал маркетплейса — заморозили склад',   amount: 55000  },
  { desc: 'Сломался главный сервер — простой бизнеса', amount: 40000 },
  // Сокращение / пропуск ходов
  { desc: 'Сокращение на работе — 2 месяца без зарплаты', amount: 0, skip_turns: 2, lose_salary: true },
  { desc: 'Серьёзная болезнь — 2 месяца на больничном без дохода', amount: 0, skip_turns: 2, lose_salary: true },
  { desc: 'Отзыв лицензии — вынужденный простой 2 месяца', amount: 0, skip_turns: 2, lose_salary: true },
]

// ── ПУЛ СОБЫТИЙ (случайно выбирается при попадании на клетку) ───
export const GAME_EVENTS: { desc: string; effect: string }[] = [
  { desc: 'ЦБ поднял ключевую ставку до 21%',                  effect: 'rate:0.21' },
  { desc: 'ЦБ снизил ключевую ставку до 12%',                  effect: 'rate:0.12' },
  { desc: 'ЦБ поднял ставку до 19% — охлаждение экономики',    effect: 'rate:0.19' },
  { desc: 'ЦБ снизил ставку до 14% — льготный период',         effect: 'rate:0.14' },
  { desc: 'ЦБ сохранил ставку 16% — рынок стабилен',           effect: 'rate:0.16' },
  { desc: 'Инфляция ускорилась — расходы растут',               effect: 'expenses+5%' },
  { desc: 'Доллар вырос — импорт подорожал',                    effect: 'expenses+5%' },
  { desc: 'Цены на топливо взлетели — логистика дорожает',      effect: 'expenses+5%' },
  { desc: 'Коммунальные тарифы выросли на 10%',                 effect: 'expenses+5%' },
  { desc: '13-я зарплата — годовой бонус',                      effect: 'cash+salary' },
  { desc: 'Налоговый вычет — кэшбэк от государства',            effect: 'cash+salary' },
  { desc: 'Курс рубля укрепился — реальные доходы выросли',     effect: 'cash+salary' },
  { desc: 'Государство субсидировало малый бизнес',             effect: 'cash+salary' },
]

// ── АКТИВЫ ДЛЯ АУКЦИОНА ────────────────────────────────────────
// Аукционные активы — доход рассчитан с запасом, остаётся в плюсе даже при ставке ЦБ 21%
// Формула проверки: passive_income > debt * 0.21 / 12
export const AUCTION_ASSETS: Asset[] = [
  { id: 'auction_flat3',   name: 'Трёшка в центре',       type: 'real_estate', price: 8000000, down_payment: 800000,  passive_income: 140000, debt: 7200000 }, // @21%: pay 126K, net +14K
  { id: 'auction_hotel',   name: 'Мини-отель 10 номеров', type: 'business',    price: 6000000, down_payment: 600000,  passive_income: 105000, debt: 5400000 }, // @21%: pay 94.5K, net +10.5K
  { id: 'auction_factory', name: 'Производственный цех',  type: 'business',    price: 5000000, down_payment: 500000,  passive_income: 88000,  debt: 4500000 }, // @21%: pay 78.8K, net +9.2K
  { id: 'auction_land',    name: 'Земля под застройку',   type: 'real_estate', price: 4500000, down_payment: 450000,  passive_income: 78000,  debt: 4050000 }, // @21%: pay 70.9K, net +7.1K
  { id: 'auction_mall',    name: 'Торговый павильон (ТЦ)',type: 'real_estate', price: 9000000, down_payment: 900000,  passive_income: 158000, debt: 8100000 }, // @21%: pay 141.8K, net +16.2K
  { id: 'auction_clinic',  name: 'Частный медкабинет',    type: 'business',    price: 3500000, down_payment: 350000,  passive_income: 62000,  debt: 3150000 }, // @21%: pay 55.1K, net +6.9K
]

export type Cell = {
  type: CellType
  label: string
  data?: any
}

// ── ДОСКИ ПО УРОВНЯМ СЛОЖНОСТИ (30 клеток) ─────────────────────
// Лёгкая: opp×8, hit×4, event×3, auction×3, market×8, salary×2, child×1, child×1
// Стандарт: opp×6, hit×6, event×4, auction×3, market×8, salary×2, child×1
// Хардкор: opp×4, hit×8, event×5, auction×3, market×8, salary×2 (нет ребёнка)

const M = (ticker: string, isCrypto = false): Cell => ({
  type: 'market', label: isCrypto ? 'Крипта' : 'Биржа',
  data: { ticker, market_type: isCrypto ? 'crypto' : 'stock' },
})
const O: Cell = { type: 'opportunity', label: 'Возможность' }
const H: Cell = { type: 'hit',     label: 'Удар' }
const E: Cell = { type: 'event',   label: 'Событие' }
const A: Cell = { type: 'auction', label: 'Аукцион' }
const S: Cell = { type: 'salary',  label: 'Зарплата' }
const C: Cell  = { type: 'child',   label: 'Жизнь', data: { desc: 'Родился ребёнок!' } }
const BL: Cell = { type: 'charity', label: 'Благотворительность' }

// EASY — удары равномерно на позициях 5 и 19 (расстояние 14)
// Благотворительность на 20, ребёнок на 27
export const BOARD_CELLS_EASY: Cell[] = [
  /* 0  */ S,
  /* 1  */ O,
  /* 2  */ M('SBER'),
  /* 3  */ O,
  /* 4  */ E,
  /* 5  */ H,
  /* 6  */ O,
  /* 7  */ A,
  /* 8  */ M('BTC', true),
  /* 9  */ O,
  /* 10 */ E,
  /* 11 */ O,
  /* 12 */ M('NVDA'),
  /* 13 */ O,
  /* 14 */ S,
  /* 15 */ M('ETH', true),
  /* 16 */ O,
  /* 17 */ E,
  /* 18 */ M('OZON'),
  /* 19 */ H,
  /* 20 */ BL,
  /* 21 */ A,
  /* 22 */ M('TON', true),
  /* 23 */ O,
  /* 24 */ M('YDEX'),
  /* 25 */ O,
  /* 26 */ E,
  /* 27 */ C,
]

// NORMAL — 4 удара равномерно: 3, 10, 17, 25 (шаг ~7)
// Благотворительность на 20
export const BOARD_CELLS_NORMAL: Cell[] = [
  /* 0  */ S,
  /* 1  */ O,
  /* 2  */ M('SBER'),
  /* 3  */ H,
  /* 4  */ E,
  /* 5  */ M('BTC', true),
  /* 6  */ O,
  /* 7  */ A,
  /* 8  */ M('NVDA'),
  /* 9  */ E,
  /* 10 */ H,
  /* 11 */ O,
  /* 12 */ M('ETH', true),
  /* 13 */ O,
  /* 14 */ S,
  /* 15 */ E,
  /* 16 */ M('OZON'),
  /* 17 */ H,
  /* 18 */ O,
  /* 19 */ M('TON', true),
  /* 20 */ BL,
  /* 21 */ A,
  /* 22 */ M('YDEX'),
  /* 23 */ O,
  /* 24 */ E,
  /* 25 */ H,
  /* 26 */ M('GAZP'),
  /* 27 */ C,
]

// HARD — 7 ударов равномерно: 2,6,10,15,19,23,26 (шаг ~4)
// Благотворительность на 20 заменена ударами, поэтому BL на 13
export const BOARD_CELLS_HARD: Cell[] = [
  /* 0  */ S,
  /* 1  */ M('SBER'),
  /* 2  */ H,
  /* 3  */ E,
  /* 4  */ M('BTC', true),
  /* 5  */ O,
  /* 6  */ H,
  /* 7  */ A,
  /* 8  */ M('NVDA'),
  /* 9  */ O,
  /* 10 */ H,
  /* 11 */ E,
  /* 12 */ M('ETH', true),
  /* 13 */ BL,
  /* 14 */ S,
  /* 15 */ H,
  /* 16 */ M('OZON'),
  /* 17 */ E,
  /* 18 */ M('TON', true),
  /* 19 */ H,
  /* 20 */ O,
  /* 21 */ A,
  /* 22 */ M('YDEX'),
  /* 23 */ H,
  /* 24 */ E,
  /* 25 */ O,
  /* 26 */ H,
  /* 27 */ M('GAZP'),
]

// Функция выбора доски по сложности
export function getBoardCells(difficulty: GameDifficulty = 'normal'): Cell[] {
  if (difficulty === 'easy') return BOARD_CELLS_EASY
  if (difficulty === 'hard') return BOARD_CELLS_HARD
  return BOARD_CELLS_NORMAL
}

// Алиас для обратной совместимости
export const BOARD_CELLS = BOARD_CELLS_NORMAL

// ── НАСТРОЙКИ ИГРЫ ─────────────────────────────────────────────
export type GameDifficulty = 'easy' | 'normal' | 'hard'

export type GameSettings = {
  difficulty: GameDifficulty
  volatile_rate: boolean
  inflation: boolean
  unique_assets: boolean
  game_duration: number // минуты, 0 = без ограничения
}

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'normal',
  volatile_rate: true,
  inflation: true,
  unique_assets: false,
  game_duration: 30,
}

export const DIFFICULTY_CONFIG: Record<GameDifficulty, {
  starting_cash_multiplier: number
  hit_multiplier: number
  salary_bonus: number
  label: string
  desc: string
  color: string
}> = {
  easy:   { starting_cash_multiplier: 5,   hit_multiplier: 0.6, salary_bonus: 1.2, label: 'Лёгкая',   desc: 'Больше денег, меньше штрафов',  color: '#34D399' },
  normal: { starting_cash_multiplier: 3,   hit_multiplier: 1.0, salary_bonus: 1.0, label: 'Стандарт', desc: 'Классическая игра',              color: '#F5B843' },
  hard:   { starting_cash_multiplier: 1.5, hit_multiplier: 1.5, salary_bonus: 0.8, label: 'Хардкор',  desc: 'Мало наличных, крупные штрафы', color: '#FB6B6B' },
}

export const BOT_NAMES = ['Рокки', 'Нина', 'Тимур', 'Зина', 'Олег', 'Снежана']
export const BOT_AVATARS: Record<string, string> = {
  'Рокки':   '🦊',
  'Нина':    '🐱',
  'Тимур':   '🐻',
  'Зина':    '🦁',
  'Олег':    '🐺',
  'Снежана': '🦋',
}
export const PLAYER_COLORS = ['#F5B843', '#34D399', '#5B9DF9', '#A78BFA', '#FB6B6B', '#F4C430']

// ── ПРЕДЛОЖЕНИЯ О ПОКУПКЕ АКТИВОВ ──────────────────────────────
// type: 'real_estate' | 'business' — кому показывать
// multiplier: диапазон коэффициента к цене покупки
export const SELL_OFFERS: { type: 'real_estate'|'business'; title: string; desc: string; multiplierMin: number; multiplierMax: number }[] = [
  { type:'real_estate', title:'Инвесторы скупают однушки', desc:'Фонд недвижимости расширяет портфель — предлагают выкупить вашу квартиру выше рынка.', multiplierMin:1.25, multiplierMax:1.60 },
  { type:'real_estate', title:'Застройщик сносит квартал', desc:'Крупный девелопер выкупает всё в вашем районе под новый ЖК. Цена выше рыночной.', multiplierMin:1.30, multiplierMax:1.70 },
  { type:'real_estate', title:'Риелтор нашёл покупателя', desc:'Горячий покупатель из Москвы ищет именно такой объект. Готовы заплатить с премией.', multiplierMin:1.20, multiplierMax:1.50 },
  { type:'real_estate', title:'ПИФ скупает жилую недвижимость', desc:'Паевой инвестиционный фонд формирует портфель. Предложение выше рыночной цены.', multiplierMin:1.15, multiplierMax:1.45 },
  { type:'real_estate', title:'Под коммерцию переводят дом', desc:'Соседнее помещение уходит под офисы — рядом хотят купить и вашу площадь.', multiplierMin:1.20, multiplierMax:1.55 },
  { type:'business', title:'Сеть кофеен расширяется', desc:'Федеральная сеть ищет точки для поглощения. Предлагают выкупить ваше заведение.', multiplierMin:1.30, multiplierMax:1.80 },
  { type:'business', title:'Маркетплейс скупает ПВЗ', desc:'Крупный маркетплейс выходит в регионы и выкупает сеть ПВЗ. Условия выгодные.', multiplierMin:1.25, multiplierMax:1.65 },
  { type:'business', title:'Стратег хочет купить бизнес', desc:'Стратегический инвестор ищет готовый бизнес с клиентской базой. Мультипликатор выше рынка.', multiplierMin:1.35, multiplierMax:1.90 },
  { type:'business', title:'Франшиза поглощает малый бизнес', desc:'Крупная франшиза хочет занять вашу нишу — дешевле купить вас, чем строить с нуля.', multiplierMin:1.20, multiplierMax:1.60 },
  { type:'business', title:'Конкурент предлагает выкуп', desc:'Основной конкурент решил не воевать, а купить. Предложение выше балансовой стоимости.', multiplierMin:1.15, multiplierMax:1.50 },
]

export function getRandomSellOffer(assetType: 'real_estate'|'business') {
  const pool = SELL_OFFERS.filter(o => o.type === assetType)
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── УТИЛИТЫ ────────────────────────────────────────────────────

export function getRandomDeal(size: 'small' | 'large'): Asset {
  const pool = size === 'small' ? SMALL_DEALS : LARGE_DEALS
  return pool[Math.floor(Math.random() * pool.length)]
}

// Выбрать N случайных сделок из пула (без повторов)
export function getRandomDeals(count: number, pool: Asset[]): Asset[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// Случайный удар из пула
export function getRandomHit(): { desc: string; amount: number } {
  return HIT_EVENTS[Math.floor(Math.random() * HIT_EVENTS.length)]
}

// Случайное событие из пула
export function getRandomEvent(): { desc: string; effect: string } {
  return GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)]
}

// Случайный актив для аукциона
export function getRandomAuctionAsset(): Asset {
  return AUCTION_ASSETS[Math.floor(Math.random() * AUCTION_ASSETS.length)]
}

export function getNewPrice(current: number, min: number, max: number, volatility: number, volMod = 1): number {
  const effectiveVol = volatility * volMod
  const change = (Math.random() * 2 - 1) * effectiveVol
  const newPrice = current * (1 + change)
  if (newPrice < 100) return Math.max(min, Math.min(max, Math.round(newPrice * 10) / 10))
  return Math.max(min, Math.min(max, Math.round(newPrice)))
}

// Генерирует случайные модификаторы волатильности для новой игры
// Каждый тикер получает множитель от 0.4x (стабильный) до 3x (ракета)
export function generateVolatilityProfile(tickers: string[]): Record<string, number> {
  const profile: Record<string, number> = {}
  // Делим тикеры на 3 группы случайно
  const shuffled = [...tickers].sort(() => Math.random() - 0.5)
  const third = Math.ceil(shuffled.length / 3)
  shuffled.forEach((t, i) => {
    if (i < third) {
      // Стабильные: 0.3x–0.6x
      profile[t] = 0.3 + Math.random() * 0.3
    } else if (i < third * 2) {
      // Обычные: 0.8x–1.4x
      profile[t] = 0.8 + Math.random() * 0.6
    } else {
      // Ракеты: 2x–4x
      profile[t] = 2.0 + Math.random() * 2.0
    }
  })
  return profile
}

export function getPriceChangeEmoji(oldPrice: number, newPrice: number): string {
  const pct = ((newPrice - oldPrice) / oldPrice) * 100
  if (pct > 20) return '🚀'
  if (pct > 5)  return '📈'
  if (pct > 0)  return '↗️'
  if (pct > -5) return '↘️'
  if (pct > -20)return '📉'
  return '💥'
}

export function getStockByTicker(ticker: string) {
  return STOCKS.find(s => s.ticker === ticker) ?? null
}

export function getCryptoByTicker(ticker: string) {
  return CRYPTO.find(c => c.ticker === ticker) ?? null
}
