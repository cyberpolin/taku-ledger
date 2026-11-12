import type { Activity, Entry } from '../types'

export function filterByDateRange(
  entries: Entry[],
  from: string,
  to: string,
): Entry[] {
  const start = startOfDay(from)
  const end = endOfDay(to)
  if (!start || !end) return []

  return entries
    .filter((entry) => {
      const created = new Date(entry.createdAt)
      if (Number.isNaN(created.getTime())) return false
      return created >= start && created <= end
    })
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
}

export function buildCsv(
  entries: Entry[],
  activities: Activity[],
): string {
  const names = new Map(activities.map((item) => [item.id, item.name]))
  const header = 'createdAt,kind,activity,concept,amount'
  const rows = entries.map((entry) =>
    [
      escapeCsv(entry.createdAt),
      escapeCsv(entry.kind),
      escapeCsv(names.get(entry.activityId) ?? 'Unknown'),
      escapeCsv(entry.concept),
      entry.amount.toFixed(2),
    ].join(','),
  )
  return [header, ...rows].join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function csvFilename(from: string, to: string): string {
  return `entries-${from}-to-${to}.csv`
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function startOfDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function endOfDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date
}
