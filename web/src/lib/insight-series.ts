import type { Entry, EntryKind } from '../types'

export type PeriodKey = 'this-month' | 'last-3-months' | 'last-12-months' | 'all'

export type DateRange = {
  from: Date
  to: Date
}

export type PeriodWindow = {
  current: DateRange
  prior: DateRange | null
  label: string
}

export type MonthPoint = {
  monthKey: string
  label: string
  income: number
  expense: number
  net: number
}

export type ConceptShare = {
  concept: string
  total: number
  pct: number
}

export type PeriodTotals = {
  income: number
  expense: number
  net: number
  count: number
}

export type KpiComparison = {
  current: PeriodTotals
  prior: PeriodTotals | null
  incomeDelta: number | null
  expenseDelta: number | null
  netDelta: number | null
}

const monthLabel = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: '2-digit',
})

export function resolvePeriodRange(
  period: PeriodKey,
  now = new Date(),
  earliestEntry?: Date | null,
): PeriodWindow {
  const end = endOfDay(now)

  if (period === 'this-month') {
    const from = startOfMonth(now)
    const priorTo = new Date(from.getTime() - 1)
    const priorFrom = startOfMonth(priorTo)
    return {
      current: { from, to: end },
      prior: { from: priorFrom, to: endOfDay(priorTo) },
      label: 'This month',
    }
  }

  if (period === 'last-3-months') {
    const from = startOfMonth(addMonths(now, -2))
    const priorTo = new Date(from.getTime() - 1)
    const priorFrom = startOfMonth(addMonths(priorTo, -2))
    return {
      current: { from, to: end },
      prior: { from: priorFrom, to: endOfDay(priorTo) },
      label: 'Last 3 months',
    }
  }

  if (period === 'last-12-months') {
    const from = startOfMonth(addMonths(now, -11))
    const priorTo = new Date(from.getTime() - 1)
    const priorFrom = startOfMonth(addMonths(priorTo, -11))
    return {
      current: { from, to: end },
      prior: { from: priorFrom, to: endOfDay(priorTo) },
      label: 'Last 12 months',
    }
  }

  const from =
    earliestEntry && !Number.isNaN(earliestEntry.getTime())
      ? startOfMonth(earliestEntry)
      : startOfMonth(now)

  return {
    current: { from, to: end },
    prior: null,
    label: 'All time',
  }
}

export function filterEntriesByRange(
  entries: Entry[],
  range: DateRange,
): Entry[] {
  return entries.filter((entry) => {
    const created = new Date(entry.createdAt)
    if (Number.isNaN(created.getTime())) return false
    return created >= range.from && created <= range.to
  })
}

export function earliestEntryDate(entries: Entry[]): Date | null {
  let earliest: Date | null = null
  for (const entry of entries) {
    const created = new Date(entry.createdAt)
    if (Number.isNaN(created.getTime())) continue
    if (!earliest || created < earliest) earliest = created
  }
  return earliest
}

export function periodTotals(entries: Entry[]): PeriodTotals {
  let income = 0
  let expense = 0
  for (const entry of entries) {
    if (entry.kind === 'income') income += entry.amount
    else expense += entry.amount
  }
  return {
    income,
    expense,
    net: income - expense,
    count: entries.length,
  }
}

export function kpiComparison(
  currentEntries: Entry[],
  priorEntries: Entry[] | null,
): KpiComparison {
  const current = periodTotals(currentEntries)
  const prior = priorEntries ? periodTotals(priorEntries) : null
  return {
    current,
    prior,
    incomeDelta: prior ? current.income - prior.income : null,
    expenseDelta: prior ? current.expense - prior.expense : null,
    netDelta: prior ? current.net - prior.net : null,
  }
}

export function monthlySeries(
  entries: Entry[],
  from: Date,
  to: Date,
): MonthPoint[] {
  const points: MonthPoint[] = []
  let cursor = startOfMonth(from)
  const last = startOfMonth(to)

  while (cursor <= last) {
    const key = monthKey(cursor)
    points.push({
      monthKey: key,
      label: monthLabel.format(cursor),
      income: 0,
      expense: 0,
      net: 0,
    })
    cursor = addMonths(cursor, 1)
  }

  const index = new Map(points.map((point, i) => [point.monthKey, i]))

  for (const entry of entries) {
    const created = new Date(entry.createdAt)
    if (Number.isNaN(created.getTime())) continue
    if (created < from || created > to) continue
    const i = index.get(monthKey(created))
    if (i === undefined) continue
    if (entry.kind === 'income') points[i].income += entry.amount
    else points[i].expense += entry.amount
    points[i].net = points[i].income - points[i].expense
  }

  return points
}

export function conceptShare(
  entries: Entry[],
  kind: EntryKind,
  limit = 5,
): ConceptShare[] {
  const filtered = entries.filter((entry) => entry.kind === kind)
  const totals = new Map<string, { concept: string; total: number }>()
  let sum = 0

  for (const entry of filtered) {
    const key = entry.concept.trim().toLowerCase()
    const label = entry.concept.trim()
    if (!key) continue
    const existing = totals.get(key)
    if (existing) existing.total += entry.amount
    else totals.set(key, { concept: label, total: entry.amount })
    sum += entry.amount
  }

  return [...totals.values()]
    .sort((a, b) => b.total - a.total || a.concept.localeCompare(b.concept))
    .slice(0, limit)
    .map((item) => ({
      concept: item.concept,
      total: item.total,
      pct: sum === 0 ? 0 : (item.total / sum) * 100,
    }))
}

export function formatSignedMoney(amount: number, formatMoney: (n: number) => string): string {
  if (amount > 0) return `+${formatMoney(amount)}`
  if (amount < 0) return `−${formatMoney(Math.abs(amount))}`
  return formatMoney(0)
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  )
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}
