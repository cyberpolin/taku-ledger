import { TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatSignedMoney, type MonthPoint } from '../../lib/insight-series'
import { formatMoney } from '../../lib/format'
import { chartSeries } from '../../lib/chart-theme'

type NetCashFlowChartProps = {
  data: MonthPoint[]
}

export function NetCashFlowChart({ data }: NetCashFlowChartProps) {
  const hasValues = data.some(
    (point) => point.income > 0 || point.expense > 0 || point.net !== 0,
  )

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-medium text-zinc-950">
          <TrendingUp className="size-4" aria-hidden />
          Net cash flow
        </h2>
        <p className="text-sm text-zinc-600">
          Income minus expenses by month.
        </p>
      </header>

      {!hasValues ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-600">
            No net cash flow to chart in this period.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                contentStyle={{
                  background: chartSeries.tooltipBg,
                  border: `1px solid ${chartSeries.tooltipBorder}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value) => [
                  formatSignedMoney(Number(value ?? 0), formatMoney),
                  'Net',
                ]}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="net"
                stroke={chartSeries.net}
                strokeWidth={2}
                dot={{ r: 3, fill: chartSeries.net }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function compactMoney(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return `$${Math.round(value)}`
}
