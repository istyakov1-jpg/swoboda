import type { Player, GameRoom, Asset, GameEvent } from '@/types/database'
import { BOARD_CELLS, ASSETS, PROFESSIONS, DREAMS, PLAYER_COLORS, BOT_NAMES, KEY_RATE_DEFAULT, DIFFICULTY_CONFIG, getBoardCells, type GameDifficulty, type Cell } from './gameData'

// Генерация кода комнаты
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

// Случайный элемент массива
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Инициализация игрока
export function createPlayer(params: {
  id: string
  room_id: string
  name: string
  is_bot: boolean
  bot_strategy?: Player['bot_strategy']
  is_host: boolean
  color_index: number
  difficulty?: GameDifficulty
}): Player {
  const profession = randomFrom(PROFESSIONS)
  const dream = randomFrom(DREAMS)
  const diff = DIFFICULTY_CONFIG[params.difficulty ?? 'normal']

  // Стартовые долги с детализацией
  const startDebts = ((profession as any).debt_breakdown ?? []).length > 0
    ? (profession as any).debt_breakdown.map((d: any) => ({
        name: d.n,
        amount: d.a,
        monthly: Math.round(d.a * (d.r ?? 0.16)),
      }))
    : profession.initial_debt > 0
      ? [{ name: 'Стартовый долг', amount: profession.initial_debt, monthly: Math.round(profession.initial_debt * 0.16) }]
      : []

  const debtMonthly = startDebts.reduce((s: number, d: any) => s + d.monthly, 0)

  return {
    id: params.id,
    room_id: params.room_id,
    name: params.name,
    is_bot: params.is_bot,
    bot_strategy: params.bot_strategy,
    color: PLAYER_COLORS[params.color_index % PLAYER_COLORS.length],
    initial: params.name[0].toUpperCase(),
    profession,
    dream,
    cash: Math.round(profession.salary * diff.starting_cash_multiplier),
    position: 0,
    passive_income: 0,
    // total_expenses = базовые расходы профессии + ежемес. платежи по долгам
    total_expenses: profession.expenses + debtMonthly,
    is_free: false,
    assets: [],
    debts: startDebts,
    is_host: params.is_host,
    joined_at: new Date().toISOString(),
  }
}

// Бросок кубика
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

// Ход игрока — вычисляет новую позицию и клетку
export function movePlayer(player: Player, roll: number, cells?: Cell[]): { player: Player; cell: Cell; passed_salary: boolean; salary_count: number } {
  const board = cells ?? BOARD_CELLS
  const total = board.length
  const old_pos = player.position
  const new_pos = (old_pos + roll) % total

  // Считаем сколько зарплатных клеток пройдено (не включая клетку приземления)
  let salary_count = 0
  for (let i = 1; i < roll; i++) {
    const idx = (old_pos + i) % total
    if (board[idx]?.type === 'salary') salary_count++
  }
  // Если приземлился на зарплату — она обрабатывается отдельно через cell.type
  const passed_salary = salary_count > 0

  return {
    player: { ...player, position: new_pos },
    cell: board[new_pos],
    passed_salary,
    salary_count,
  }
}

// Рассчитать дивиденды по акциям из портфеля игрока
export function calcDividends(player: Player, marketPrices: Record<string, number>, stocks: any[]): number {
  let total = 0
  for (const asset of player.assets) {
    if (asset.type !== 'stocks') continue
    // Извлекаем базовое имя тикера из имени актива (напр. "Газпром x5" → "GAZP")
    const stock = stocks.find(s => asset.name?.startsWith(s.name) || asset.id?.startsWith(s.id))
    if (!stock || !stock.dividend) continue
    const qty = parseInt(asset.name?.match(/x(\d+)$/)?.[1] ?? '1')
    const currentPrice = marketPrices?.[stock.ticker] ?? stock.price
    total += Math.round(qty * currentPrice * stock.dividend)
  }
  return total
}

// Получить зарплату (денежный поток) + дивиденды если переданы
export function collectSalary(player: Player, dividends = 0): { player: Player; amount: number; dividends: number } {
  const cashflow = (player.profession?.salary ?? 0) + player.passive_income
  const expenses = player.total_expenses
  const net = cashflow - expenses
  const total = net + dividends
  return {
    player: { ...player, cash: player.cash + total },
    amount: net,
    dividends,
  }
}

// Купить актив (key_rate фиксируется на момент покупки)
export function buyAsset(player: Player, asset: Asset, key_rate = KEY_RATE_DEFAULT): { player: Player; success: boolean; reason?: string } {
  if (player.cash < asset.down_payment) {
    return { player, success: false, reason: 'Недостаточно наличных' }
  }

  const monthly = asset.debt > 0 ? Math.round(asset.debt * key_rate / 12) : 0

  const newPlayer: Player = {
    ...player,
    cash: player.cash - asset.down_payment,
    passive_income: player.passive_income + asset.passive_income,
    assets: [...player.assets, asset],
    debts: asset.debt > 0
      ? [...player.debts, { name: asset.name, amount: asset.debt, monthly }]
      : player.debts,
    total_expenses: player.total_expenses + monthly,
  }

  const is_free = netPassiveIncome(newPlayer) >= baseExpenses(newPlayer)
  return { player: { ...newPlayer, is_free }, success: true }
}

// Платежи по долгам активов (не жизненные расходы)
export function assetDebtPayments(player: Player): number {
  return player.debts
    .filter(d => d.amount > 0)
    .reduce((s, d) => s + d.monthly, 0)
}

// Чистый пассивный доход = валовый доход − платежи по долгам активов
export function netPassiveIncome(player: Player): number {
  return player.passive_income - assetDebtPayments(player)
}

// Базовые расходы без платежей по активам
export function baseExpenses(player: Player): number {
  return player.total_expenses - assetDebtPayments(player)
}

// Прогресс к свободе: чистый пассив / базовые расходы
export function freedomProgress(player: Player): number {
  const base = baseExpenses(player)
  if (base <= 0) return netPassiveIncome(player) > 0 ? 100 : 0
  return Math.min(100, Math.max(0, Math.round((netPassiveIncome(player) / base) * 100)))
}

// Логирование решения для ИИ-разбора
export type DecisionLog = {
  round: number
  player_id: string
  cell_type: string
  asset_name?: string
  asset_price?: number
  asset_roi?: number
  cash_at_decision: number
  could_afford: boolean
  took_credit: boolean
  decision: 'buy' | 'pass' | 'auction_win' | 'auction_lose' | 'auction_skip'
  freedom_progress_before: number
}

export function logDecision(player: Player, params: Omit<DecisionLog, 'player_id' | 'cash_at_decision' | 'freedom_progress_before'>): DecisionLog {
  return {
    ...params,
    player_id: player.id,
    cash_at_decision: player.cash,
    freedom_progress_before: freedomProgress(player),
  }
}

// Стратегия бота
export function botDecide(player: Player, asset: Asset): 'buy' | 'pass' {
  const canAfford = player.cash >= asset.down_payment
  const roi = asset.passive_income / asset.price

  switch (player.bot_strategy) {
    case 'conservative':
      // Покупает только если может позволить и ROI > 20% и не крипта
      return canAfford && roi > 0.20 && asset.type !== 'crypto' ? 'buy' : 'pass'

    case 'adventurer':
      // Покупает всё что может себе позволить
      return canAfford ? 'buy' : 'pass'

    case 'analyst':
      // Покупает только если ROI > 25% и остаток > 2 зарплат
      const salary = player.profession?.salary ?? 100000
      return canAfford && roi > 0.25 && (player.cash - asset.down_payment) > salary * 2 ? 'buy' : 'pass'

    case 'predator':
      // Покупает всё что может, особенно то что нужно другим
      return canAfford ? 'buy' : 'pass'

    default:
      return canAfford && roi > 0.15 ? 'buy' : 'pass'
  }
}

export function botAuctionBid(player: Player, asset: Asset, start_price: number): number {
  const canAfford = player.cash
  const max_willing = Math.min(canAfford * 0.8, asset.price * 1.3)

  switch (player.bot_strategy) {
    case 'adventurer':
      return Math.round(start_price * (1.1 + Math.random() * 0.4))
    case 'conservative':
      return Math.round(start_price * (1.0 + Math.random() * 0.1))
    case 'analyst':
      // Максимум = цена где ROI ещё окупается за 3 года
      return Math.min(Math.round(asset.passive_income * 36), Math.round(max_willing))
    case 'predator':
      return Math.round(start_price * (1.2 + Math.random() * 0.3))
    default:
      return Math.round(start_price * (1.05 + Math.random() * 0.2))
  }
}

// Реплики ботов
export const BOT_PHRASES: Record<NonNullable<Player['bot_strategy']>, string[]> = {
  conservative: [
    'Слишком рискованно для меня.',
    'Подожду более выгодной цены.',
    'Лучше квартира, чем крипта.',
    'Моя подушка важнее роста.',
  ],
  adventurer: [
    'Беру всё что вижу!',
    'Риск — благородное дело.',
    'Кто не рискует, тот не побеждает.',
    'Эх, была бы ещё наличка!',
  ],
  analyst: [
    'ROI не устраивает.',
    'Окупаемость 4 года — пас.',
    'Считаю цифры... нет.',
    'При такой ставке ЦБ — невыгодно.',
  ],
  predator: [
    'О, это хочет Артём? Тогда я тоже!',
    'Не дам лидеру вырваться вперёд.',
    'Интересно кто здесь побеждает...',
    'Блокирую выгодный актив.',
  ],
}

// ── КРЕДИТЫ ────────────────────────────────────────────────────

// Максимальный кредитный лимит игрока
export function getCreditLimit(player: Player): number {
  const cashflow = (player.profession?.salary ?? 0) + player.passive_income
  const expenses = player.total_expenses
  const freeFlow = Math.max(0, cashflow - expenses)
  // На каждые 10К свободного потока — 100К кредита
  return Math.floor(freeFlow / 10000) * 100000
}

// Текущая сумма всех кредитных платежей
export function getTotalDebtPayments(player: Player): number {
  return player.debts.reduce((sum, d) => sum + d.monthly, 0)
}

// Взять кредит
export function takeCredit(player: Player, amount: number): { player: Player; success: boolean; reason?: string } {
  const limit = getCreditLimit(player)
  const currentDebtPayments = getTotalDebtPayments(player)
  const newMonthly = Math.round(amount / 10) // платёж = сумма / 10
  const maxMonthly = Math.round(limit / 10)

  if (currentDebtPayments + newMonthly > maxMonthly) {
    return { player, success: false, reason: `Превышен кредитный лимит. Доступно ещё ₽${Math.max(0, (maxMonthly - currentDebtPayments) * 10).toLocaleString()}` }
  }

  const newPlayer: Player = {
    ...player,
    cash: player.cash + amount,
    total_expenses: player.total_expenses + newMonthly,
    debts: [...player.debts, {
      name: `Кредит ₽${(amount / 1000).toFixed(0)}К`,
      amount,
      monthly: newMonthly,
    }],
  }

  return { player: newPlayer, success: true }
}

// Погасить кредит досрочно
export function repayDebt(player: Player, debtIndex: number): { player: Player; success: boolean; reason?: string } {
  const debt = player.debts[debtIndex]
  if (!debt) return { player, success: false, reason: 'Долг не найден' }
  if (player.cash < debt.amount) return { player, success: false, reason: `Нужно ₽${debt.amount.toLocaleString()}, у тебя ₽${player.cash.toLocaleString()}` }

  const newDebts = player.debts.filter((_, i) => i !== debtIndex)
  const newPlayer: Player = {
    ...player,
    cash: player.cash - debt.amount,
    total_expenses: player.total_expenses - debt.monthly,
    debts: newDebts,
  }

  return { player: newPlayer, success: true }
}