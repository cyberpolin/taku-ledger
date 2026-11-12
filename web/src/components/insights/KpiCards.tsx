import { ArrowDownRight, ArrowUpRight, Scale, type LucideIcon } from 'lucide-react'
import type { KpiComparison } from '../../lib/insight-series'
import { formatSignedMoney } from '../../lib/insight-series'
import { formatMoney } from '../../lib/format'

type KpiCardsProps = {
  comparison: KpiComparison
  hasPrior: boolean
}

export function KpiCards({ comparison, hasPrior }: KpiCardsProps) {
  const { current, incomeDelta, expenseDelta, netDelta } = comparison

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-medium text-zinc-950">Overview</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label="Income"
          icon={ArrowUpRight}
          value={formatMoney(current.income)}
          delta={hasPrior ? incomeDelta : null}
        />
        <Kpi
          label="Expenses"
          icon={ArrowDownRight}
          value={formatMoney(current.expense)}
          delta={hasPrior ? expenseDelta : null}
        />
        <Kpi
          label="Net"
          icon={Scale}
          value={formatSignedMoney(current.net, formatMoney)}
          delta={hasPrior ? netDelta : null}
        />
      </dl>
    </section>
  )
}

function Kpi({
  label,
  icon: Icon,
  value,
  delta,
}: {
  label: string
  icon: LucideIcon
  value: string
  delta: number | null
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <dt className="flex items-center gap-2 text-xs text-zinc-600">
        <Icon className="size-4" aria-hidden />
        {label}
      </dt>
      <dd className="mt-2 text-base font-medium text-zinc-950">{value}</dd>
      {delta !== null ? (
        <p className="mt-2 text-xs text-zinc-600">
          vs prior period{' '}
          <span className="font-medium text-zinc-950">
            {formatSignedMoney(delta, formatMoney)}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-600">No prior period</p>
      )}
    </div>
  )
}
