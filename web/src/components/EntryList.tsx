import { Trash2 } from 'lucide-react'
import type { Activity, Entry, EntryKind } from '../types'
import { formatDateTime, formatMoney } from '../lib/format'

type EntryListProps = {
  kind: EntryKind
  entries: Entry[]
  activities: Activity[]
  onDelete: (id: string) => void
}

export function EntryList({
  kind,
  entries,
  activities,
  onDelete,
}: EntryListProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const title = kind === 'expense' ? 'Recent expenses' : 'Recent incomes'
  const emptyTitle = kind === 'expense' ? 'No expenses yet' : 'No incomes yet'
  const emptyCopy =
    kind === 'expense'
      ? 'Add an expense from the Add section.'
      : 'Add an income from the Add section.'

  const activityName = (activityId: string) =>
    activities.find((item) => item.id === activityId)?.name ?? 'Unknown'

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h2 className="text-base font-medium text-zinc-950">{title}</h2>
        <p className="text-sm text-zinc-600">
          Saved on this device. Newest first.
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-base font-medium text-zinc-950">{emptyTitle}</h3>
          <p className="mt-2 text-sm text-zinc-600">{emptyCopy}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((entry) => (
            <li
              key={entry.id}
              className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex flex-col gap-1">
                <p className="truncate text-sm font-medium text-zinc-950">
                  {entry.concept}
                </p>
                <p className="text-xs text-zinc-600">
                  {activityName(entry.activityId)} ·{' '}
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 md:justify-end">
                <p className="text-sm font-medium text-zinc-950">
                  {formatMoney(entry.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
