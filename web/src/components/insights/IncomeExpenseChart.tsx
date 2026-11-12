import { BarChart3 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatSignedMoney, type MonthPoint } from '../../lib/insight-series'
import { formatMoney } from '../../lib/format'
import { chartSeries } from '../../lib/chart-theme'

type IncomeExpenseChartProps = {
  data: MonthPoint[]
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const hasValues = data.some((point) => point.income > 0 || point.expense > 0)

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-medium text-zinc-950">
          <BarChart3 className="size-4" aria-hidden />
          Income vs expenses
        </h2>
        <p className="text-sm text-zinc-600">Monthly totals in the selected period.</p>
      </header>

      {!hasValues ? (
        <EmptyChart message="No income or expense totals in this period." />
      ) : (
        <div className="h-64 w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chartSeries.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: chartSeries.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: chartSeries.grid }}
              />
              <YAxis
                tick={{ fill: chartSeries.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) => compactMoney(value)}
              />
              <Tooltip
                cursor={{ fill: chartSeries.grid, opacity: 0.35 }}
                contentStyle={{
                  background: chartSeries.tooltipBg,
                  border: `1px solid ${chartSeries.tooltipBorder}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  formatSignedMoney(Number(value ?? 0), formatMoney),
                  name === 'income' ? 'Income' : 'Expenses',
                ]}
              />
              <Legend
                formatter={(value) => (value === 'income' ? 'Income' : 'Expenses')}
              />
              <Bar
                dataKey="income"
                name="income"
                fill={chartSeries.income}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="expense"
                name="expense"
                fill={chartSeries.expense}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-600">{message}</p>
    </div>
  )
}

function compactMoney(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return `$${Math.round(value)}`
}
