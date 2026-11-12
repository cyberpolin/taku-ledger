import { Download, Mail } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import type { Activity, ActivityScope, Entry } from '../types'
import {
  buildCsv,
  csvFilename,
  downloadCsv,
  filterByDateRange,
} from '../lib/csv'
import { filterEntriesByActivity } from '../lib/insights'
import { formatMoney, toDateInputValue } from '../lib/format'
import { ActivityScopeSelect } from './ActivityScopeSelect'

type ExportPanelProps = {
  activities: Activity[]
  entries: Entry[]
}

export function ExportPanel({ activities, entries }: ExportPanelProps) {
  const fromId = useId()
  const toId = useId()
  const today = toDateInputValue(new Date())
  const monthStart = toDateInputValue(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )

  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [scope, setScope] = useState<ActivityScope>('all')
  const [message, setMessage] = useState('')

  const scopedEntries = useMemo(
    () => filterEntriesByActivity(entries, scope),
    [entries, scope],
  )

  const filtered = useMemo(
    () => filterByDateRange(scopedEntries, from, to),
    [scopedEntries, from, to],
  )

  const incomeTotal = filtered
    .filter((entry) => entry.kind === 'income')
    .reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = filtered
    .filter((entry) => entry.kind === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)
  const netTotal = incomeTotal - expenseTotal

  const scopeLabel =
    scope === 'all'
      ? 'All activities'
      : (activities.find((item) => item.id === scope)?.name ?? 'Activity')

  function handleDownload() {
    if (!from || !to) {
      setMessage('Choose a from and to date.')
      return
    }
    if (from > to) {
      setMessage('From date must be on or before to date.')
      return
    }
    if (filtered.length === 0) {
      setMessage('No entries in that date range.')
      return
    }

    downloadCsv(csvFilename(from, to), buildCsv(filtered, activities))
    setMessage(`Downloaded ${filtered.length} entries as CSV.`)
  }

  function handleEmail() {
    if (!from || !to) {
      setMessage('Choose a from and to date.')
      return
    }
    if (from > to) {
      setMessage('From date must be on or before to date.')
      return
    }
    if (filtered.length === 0) {
      setMessage('No entries in that date range.')
      return
    }

    downloadCsv(csvFilename(from, to), buildCsv(filtered, activities))
    const activityNames = new Map(
      activities.map((item) => [item.id, item.name]),
    )

    const subject = `Income and expenses ${from} to ${to} (${scopeLabel})`
    const body = [
      `Summary (${from} to ${to})`,
      `Activity scope: ${scopeLabel}`,
      '',
      `Entries: ${filtered.length}`,
      `Income: ${formatMoney(incomeTotal)}`,
      `Expenses: ${formatMoney(expenseTotal)}`,
      `Net: ${formatMoney(netTotal)}`,
      '',
      'A CSV file was downloaded. Attach that file to this email before sending.',
      '',
      ...filtered.slice(0, 20).map((entry) => {
        const activityName = activityNames.get(entry.activityId) ?? 'Unknown'
        return `- ${entry.createdAt} | ${entry.kind} | ${activityName} | ${entry.concept} | ${formatMoney(entry.amount)}`
      }),
      filtered.length > 20 ? `…and ${filtered.length - 20} more in the CSV.` : '',
    ]
      .filter(Boolean)
      .join('\n')

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setMessage('CSV downloaded. Your mail app should open next.')
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950 md:text-2xl">
          Export
        </h1>
        <p className="text-sm text-zinc-600">
          Filter by activity and date range, download a CSV, or open email with a
          summary.
        </p>
      </header>

      <ActivityScopeSelect
        activities={activities}
        value={scope}
        onChange={setScope}
        label="Scope"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={fromId} className="text-sm font-medium text-zinc-950">
            From
          </label>
          <input
            id={fromId}
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={toId} className="text-sm font-medium text-zinc-950">
            To
          </label>
          <input
            id={toId}
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <p className="text-sm text-zinc-600">
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} in range
        · {scopeLabel} · Income {formatMoney(incomeTotal)} · Expenses{' '}
        {formatMoney(expenseTotal)} · Net{' '}
        <span className="font-medium text-zinc-950">{formatMoney(netTotal)}</span>
      </p>

      <div className="flex flex-col gap-2 md:flex-row">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 transition-colors duration-150 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 md:w-auto"
        >
          <Download className="size-4 shrink-0" aria-hidden />
          Download CSV
        </button>
        <button
          type="button"
          onClick={handleEmail}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors duration-150 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 md:w-auto"
        >
          <Mail className="size-4 shrink-0" aria-hidden />
          Email
        </button>
      </div>

      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
    </section>
  )
}
