import { useId } from 'react'
import type { Activity, ActivityScope } from '../types'

type ActivityScopeSelectProps = {
  activities: Activity[]
  value: ActivityScope
  onChange: (scope: ActivityScope) => void
  includeAll?: boolean
  label?: string
}

export function ActivityScopeSelect({
  activities,
  value,
  onChange,
  includeAll = true,
  label = 'Activity',
}: ActivityScopeSelectProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-950">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as ActivityScope)}
        className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
      >
        {includeAll ? <option value="all">All activities</option> : null}
        {activities.map((activity) => (
          <option key={activity.id} value={activity.id}>
            {activity.name}
          </option>
        ))}
      </select>
    </div>
  )
}
