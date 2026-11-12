import { useId } from 'react'
import type { PeriodKey } from '../../lib/insight-series'

const OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'this-month', label: 'This month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'last-12-months', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]

type PeriodSelectProps = {
  value: PeriodKey
  onChange: (period: PeriodKey) => void
}

export function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-950">
        Period
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as PeriodKey)}
        className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
