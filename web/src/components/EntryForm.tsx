import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import type { Activity, Entry, EntryKind } from '../types'
import { cn } from '../lib/cn'
import { createActivity, uniqueConcepts } from '../lib/storage'
import { ConceptAutocomplete } from './ConceptAutocomplete'

type EntryFormProps = {
  activities: Activity[]
  entries: Entry[]
  onAdd: (entry: Entry) => void
  onAddActivity: (activity: Activity) => void
}

export function EntryForm({
  activities,
  entries,
  onAdd,
  onAddActivity,
}: EntryFormProps) {
  const activityId = useId()
  const conceptId = useId()
  const amountId = useId()
  const newActivityId = useId()

  const [kind, setKind] = useState<EntryKind>('expense')
  const [activity, setActivity] = useState(activities[0]?.id ?? '')
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [addingActivity, setAddingActivity] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')

  const concepts = useMemo(
    () =>
      uniqueConcepts(entries, {
        kind,
        activityId: activity || undefined,
      }),
    [entries, kind, activity],
  )

  const kindLabel = kind === 'expense' ? 'expense' : 'income'

  useEffect(() => {
    if (!activities.some((item) => item.id === activity)) {
      setActivity(activities[0]?.id ?? '')
    }
  }, [activities, activity])

  function handleKindChange(next: EntryKind) {
    setKind(next)
    setError('')
  }

  function handleCreateActivity() {
    const name = newActivityName.trim()
    if (!name) {
      setError('Enter an activity name.')
      return
    }
    const exists = activities.some(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
    )
    if (exists) {
      setError('That activity already exists.')
      return
    }

    const created = createActivity(name)
    onAddActivity(created)
    setActivity(created.id)
    setNewActivityName('')
    setAddingActivity(false)
    setError('')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedConcept = concept.trim()
    const parsedAmount = Number.parseFloat(amount)

    if (!activity) {
      setError('Choose an activity.')
      return
    }
    if (!trimmedConcept) {
      setError('Enter a concept.')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }

    const now = new Date().toISOString()
    onAdd({
      id: crypto.randomUUID(),
      kind,
      activityId: activity,
      concept: trimmedConcept,
      amount: Math.round(parsedAmount * 100) / 100,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    setConcept('')
    setAmount('')
    setError('')
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950 md:text-2xl">
          Add {kindLabel}
        </h1>
        <p className="text-sm text-zinc-600">
          Pick an activity, then concept and amount. Date and time are saved
          automatically.
        </p>
      </header>

      <div
        role="group"
        aria-label="Entry type"
        className="grid grid-cols-2 gap-2"
      >
        <KindButton
          label="Expense"
          icon={ArrowDownRight}
          active={kind === 'expense'}
          onClick={() => handleKindChange('expense')}
        />
        <KindButton
          label="Income"
          icon={ArrowUpRight}
          active={kind === 'income'}
          onClick={() => handleKindChange('income')}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor={activityId}
            className="text-sm font-medium text-zinc-950"
          >
            Activity
          </label>
          <select
            id={activityId}
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            required
          >
            {activities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {!addingActivity ? (
            <button
              type="button"
              onClick={() => {
                setAddingActivity(true)
                setError('')
              }}
              className="inline-flex h-11 items-center justify-start gap-2 rounded-md px-1 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              Add activity
            </button>
          ) : null}
        </div>

        {addingActivity ? (
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4">
            <label
              htmlFor={newActivityId}
              className="text-sm font-medium text-zinc-950"
            >
              New activity
            </label>
            <input
              id={newActivityId}
              type="text"
              value={newActivityName}
              onChange={(event) => setNewActivityName(event.target.value)}
              placeholder="Side hustle"
              className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 placeholder:text-zinc-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            />
            <div className="flex flex-col gap-2 md:flex-row">
              <button
                type="button"
                onClick={handleCreateActivity}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 transition-colors duration-150 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 md:w-auto"
              >
                <Check className="size-4 shrink-0" aria-hidden />
                Save activity
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingActivity(false)
                  setNewActivityName('')
                  setError('')
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors duration-150 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 md:w-auto"
              >
                <X className="size-4 shrink-0" aria-hidden />
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor={conceptId} className="text-sm font-medium text-zinc-950">
            Concept
          </label>
          <ConceptAutocomplete
            id={conceptId}
            value={concept}
            suggestions={concepts}
            onChange={setConcept}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={amountId} className="text-sm font-medium text-zinc-950">
            Amount
          </label>
          <input
            id={amountId}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 placeholder:text-zinc-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          />
        </div>

        {error ? <p className="text-sm text-zinc-600">{error}</p> : null}

        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 transition-colors duration-150 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:w-auto"
        >
          <Check className="size-4 shrink-0" aria-hidden />
          Save {kindLabel}
        </button>
      </form>
    </section>
  )
}

function KindButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
        active
          ? 'border-zinc-950 bg-zinc-950 text-zinc-50'
          : 'border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </button>
  )
}
