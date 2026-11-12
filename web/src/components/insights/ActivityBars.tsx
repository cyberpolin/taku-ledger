import { Layers } from 'lucide-react'
import type { ActivityBreakdown } from '../../lib/insights'
import { formatSignedMoney } from '../../lib/insight-series'
import { chartSeries } from '../../lib/chart-theme'
import { formatMoney } from '../../lib/format'

type ActivityBarsProps = {
  rows: ActivityBreakdown[]
}

export function ActivityBars({ rows }: ActivityBarsProps) {
  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.net)), 1)

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-medium text-zinc-950">
          <Layers className="size-4" aria-hidden />
          By activity
        </h2>
        <p className="text-sm text-zinc-600">
          Net by activity in the selected period.
        </p>
      </header>

      {rows.every((row) => row.income === 0 && row.expense === 0) ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600">No activity totals in this period.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const width = `${(Math.abs(row.net) / maxAbs) * 100}%`
            return (
              <li
                key={row.activityId}
                className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white px-3 py-3"
              >
                <div className="flex min-w-0 items-center justify-between gap-4">
                  <p className="truncate text-sm font-medium text-zinc-950">
                    {row.name}
                  </p>
                  <p className="shrink-0 text-sm font-medium text-zinc-950">
                    {formatSignedMoney(row.net, formatMoney)}
                  </p>
                </div>
                <p className="text-xs text-zinc-600">
                  Income {formatMoney(row.income)} · Expenses{' '}
                  {formatMoney(row.expense)}
                </p>
                <div
                  className="h-2 w-full overflow-hidden rounded-md bg-zinc-100"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-md"
                    style={{ width, backgroundColor: chartSeries.net }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
