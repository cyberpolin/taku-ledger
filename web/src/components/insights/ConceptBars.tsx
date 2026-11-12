import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ConceptShare } from '../../lib/insight-series'
import { chartSeries } from '../../lib/chart-theme'
import { formatMoney } from '../../lib/format'

type ConceptBarsProps = {
  title: string
  series: 'income' | 'expense'
  items: ConceptShare[]
  emptyMessage: string
}

export function ConceptBars({
  title,
  series,
  items,
  emptyMessage,
}: ConceptBarsProps) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-medium text-zinc-950">
          {series === 'income' ? (
            <ArrowUpRight className="size-4" aria-hidden />
          ) : (
            <ArrowDownRight className="size-4" aria-hidden />
          )}
          {title}
        </h2>
        <p className="text-sm text-zinc-600">Share of total in this period.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.concept} className="flex flex-col gap-2">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <p className="truncate text-sm text-zinc-950">{item.concept}</p>
                <p className="shrink-0 text-sm font-medium text-zinc-950">
                  {formatMoney(item.total)}
                  <span className="ml-2 text-xs font-normal text-zinc-600">
                    {item.pct.toFixed(0)}%
                  </span>
                </p>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-md bg-zinc-100"
                role="presentation"
              >
                <div
                  className="h-full rounded-md"
                  style={{
                    width: `${Math.max(item.pct, item.pct > 0 ? 2 : 0)}%`,
                    backgroundColor:
                      series === 'income' ? chartSeries.income : chartSeries.expense,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
