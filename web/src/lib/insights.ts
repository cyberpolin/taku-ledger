import type { Activity, ActivityScope, Entry, EntryKind } from '../types'

export type ConceptTotal = {
  concept: string
  total: number
  count: number
}

export type KindInsights = {
  total: number
  count: number
  average: number
  topConcepts: ConceptTotal[]
  currentMonthTotal: number
  previousMonthTotal: number
}

export type AppInsights = {
  expenses: KindInsights
  incomes: KindInsights
  netTotal: number
  currentMonthNet: number
  previousMonthNet: number
}

export type ActivityBreakdown = {
  activityId: string
  name: string
  income: number
  expense: number
  net: number
}

export function filterEntriesByActivity(
  entries: Entry[],
  scope: ActivityScope,
): Entry[] {
  if (scope === 'all') return entries
  return entries.filter((entry) => entry.activityId === scope)
}

export function computeInsights(
  entries: Entry[],
  now = new Date(),
): AppInsights {
  const expenses = computeKindInsights(
    entries.filter((entry) => entry.kind === 'expense'),
    now,
  )
  const incomes = computeKindInsights(
    entries.filter((entry) => entry.kind === 'income'),
    now,
  )

  return {
    expenses,
    incomes,
    netTotal: incomes.total - expenses.total,
    currentMonthNet: incomes.currentMonthTotal - expenses.currentMonthTotal,
    previousMonthNet:
      incomes.previousMonthTotal - expenses.previousMonthTotal,
  }
}

export function activityBreakdown(
  entries: Entry[],
  activities: Activity[],
): ActivityBreakdown[] {
  const byId = new Map<string, ActivityBreakdown>()

  for (const activity of activities) {
    byId.set(activity.id, {
      activityId: activity.id,
      name: activity.name,
      income: 0,
      expense: 0,
      net: 0,
    })
  }

  for (const entry of entries) {
    let row = byId.get(entry.activityId)
    if (!row) {
      row = {
        activityId: entry.activityId,
        name: 'Unknown',
        income: 0,
        expense: 0,
        net: 0,
      }
      byId.set(entry.activityId, row)
    }
    if (entry.kind === 'income') row.income += entry.amount
    else row.expense += entry.amount
    row.net = row.income - row.expense
  }

  return [...byId.values()].sort(
    (a, b) => b.net - a.net || a.name.localeCompare(b.name),
  )
}

function computeKindInsights(entries: Entry[], now: Date): KindInsights {
  const total = entries.reduce((sum, item) => sum + item.amount, 0)
  const count = entries.length
  const average = count === 0 ? 0 : total / count

  const byConcept = new Map<string, ConceptTotal>()
  for (const entry of entries) {
    const key = entry.concept.trim().toLowerCase()
    const label = entry.concept.trim()
    const existing = byConcept.get(key)
    if (existing) {
      existing.total += entry.amount
      existing.count += 1
    } else {
      byConcept.set(key, { concept: label, total: entry.amount, count: 1 })
    }
  }

  const topConcepts = [...byConcept.values()]
    .sort((a, b) => b.total - a.total || a.concept.localeCompare(b.concept))
    .slice(0, 5)

  const currentStart = startOfMonth(now)
  const previousStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  )
  const previousEnd = currentStart

  let currentMonthTotal = 0
  let previousMonthTotal = 0

  for (const entry of entries) {
    const created = new Date(entry.createdAt)
    if (Number.isNaN(created.getTime())) continue
    if (created >= currentStart) {
      currentMonthTotal += entry.amount
    } else if (created >= previousStart && created < previousEnd) {
      previousMonthTotal += entry.amount
    }
  }

  return {
    total,
    count,
    average,
    topConcepts,
    currentMonthTotal,
    previousMonthTotal,
  }
}

export function entriesOfKind(entries: Entry[], kind: EntryKind): Entry[] {
  return entries.filter((entry) => entry.kind === kind)
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
