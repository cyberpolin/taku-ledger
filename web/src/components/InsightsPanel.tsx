import { useMemo, useState } from 'react'
import type { Activity, ActivityScope, Entry } from '../types'
import {
  activityBreakdown,
  entriesOfKind,
  filterEntriesByActivity,
} from '../lib/insights'
import {
  conceptShare,
  earliestEntryDate,
  filterEntriesByRange,
  kpiComparison,
  monthlySeries,
  type PeriodKey,
  resolvePeriodRange,
} from '../lib/insight-series'
import { ActivityScopeSelect } from './ActivityScopeSelect'
import { EntryList } from './EntryList'
import { ActivityBars } from './insights/ActivityBars'
import { ConceptBars } from './insights/ConceptBars'
import { IncomeExpenseChart } from './insights/IncomeExpenseChart'
import { KpiCards } from './insights/KpiCards'
import { NetCashFlowChart } from './insights/NetCashFlowChart'
import { PeriodSelect } from './insights/PeriodSelect'

type InsightsPanelProps = {
  activities: Activity[]
  entries: Entry[]
  onDelete: (id: string) => void
}

export function InsightsPanel({
  activities,
  entries,
  onDelete,
}: InsightsPanelProps) {
  const [scope, setScope] = useState<ActivityScope>('all')
  const [period, setPeriod] = useState<PeriodKey>('last-12-months')

  const activityScoped = useMemo(
    () => filterEntriesByActivity(entries, scope),
    [entries, scope],
  )

  const window = useMemo(
    () =>
      resolvePeriodRange(
        period,
        new Date(),
        earliestEntryDate(activityScoped),
      ),
    [period, activityScoped],
  )

  const periodEntries = useMemo(
    () => filterEntriesByRange(activityScoped, window.current),
    [activityScoped, window],
  )

  const priorEntries = useMemo(
    () =>
      window.prior
        ? filterEntriesByRange(activityScoped, window.prior)
        : null,
    [activityScoped, window],
  )

  const comparison = useMemo(
    () => kpiComparison(periodEntries, priorEntries),
    [periodEntries, priorEntries],
  )

  const series = useMemo(
    () => monthlySeries(periodEntries, window.current.from, window.current.to),
    [periodEntries, window],
  )

  const expenseConcepts = useMemo(
    () => conceptShare(periodEntries, 'expense', 5),
    [periodEntries],
  )
  const incomeConcepts = useMemo(
    () => conceptShare(periodEntries, 'income', 5),
    [periodEntries],
  )

  const breakdown = useMemo(
    () => activityBreakdown(periodEntries, activities),
    [periodEntries, activities],
  )

  const expenses = useMemo(
    () => entriesOfKind(periodEntries, 'expense'),
    [periodEntries],
  )
  const incomes = useMemo(
    () => entriesOfKind(periodEntries, 'income'),
    [periodEntries],
  )

  const hasData = periodEntries.length > 0
  const scopeLabel =
    scope === 'all'
      ? 'All activities'
      : (activities.find((item) => item.id === scope)?.name ?? 'Activity')

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950 md:text-2xl">
          Insights
        </h1>
        <p className="text-sm text-zinc-600">
          Cash flow for {scopeLabel.toLowerCase()} · {window.label.toLowerCase()}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActivityScopeSelect
          activities={activities}
          value={scope}
          onChange={setScope}
          label="Scope"
        />
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-base font-medium text-zinc-950">Nothing to show</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Insights appear after you save at least one income or expense in this
            scope and period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <KpiCards
            comparison={comparison}
            hasPrior={window.prior !== null}
          />
          <IncomeExpenseChart data={series} />
          <NetCashFlowChart data={series} />
          <ConceptBars
            title="Top expense concepts"
            series="expense"
            items={expenseConcepts}
            emptyMessage="No expenses in this period."
          />
          <ConceptBars
            title="Top income concepts"
            series="income"
            items={incomeConcepts}
            emptyMessage="No income in this period."
          />
          {scope === 'all' ? <ActivityBars rows={breakdown} /> : null}
        </div>
      )}

      <EntryList
        kind="income"
        entries={incomes}
        activities={activities}
        onDelete={onDelete}
      />
      <EntryList
        kind="expense"
        entries={expenses}
        activities={activities}
        onDelete={onDelete}
      />
    </section>
  )
}
