import type { Activity, Entry, EntryKind } from '../types'

const ENTRIES_KEY = 'taku-entries'
const ACTIVITIES_KEY = 'taku-activities'
const LEGACY_EXPENSES_KEY = 'taku-expenses'

const SEED_JOB_ID = 'activity-job'
const SEED_BUSINESS_ID = 'activity-business'

export function loadActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        let changed = false
        const activities = parsed.flatMap((item) => {
          const next = normalizeActivity(item)
          if (!next) return []
          if (!sameActivity(item, next)) changed = true
          return [next]
        })
        if (activities.length > 0) {
          const sorted = sortActivities(activities)
          if (changed) saveActivities(sorted)
          return sorted
        }
      }
    }
  } catch {
    // fall through to seed
  }

  const seeded = seedActivities()
  saveActivities(seeded)
  return seeded
}

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
}

export function loadEntries(activities: Activity[] = loadActivities()): Entry[] {
  const jobId = resolveJobId(activities)

  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        let changed = false
        const migrated = parsed
          .map((item) => {
            const next = migrateEntry(item, jobId)
            if (next && !sameEntry(item, next)) changed = true
            return next
          })
          .filter((item): item is Entry => item !== null)
        if (changed) saveEntries(migrated)
        return migrated
      }
    }

    const legacy = localStorage.getItem(LEGACY_EXPENSES_KEY)
    if (!legacy) return []
    const parsed: unknown = JSON.parse(legacy)
    if (!Array.isArray(parsed)) return []
    const migrated = parsed
      .map((item) => migrateLegacyExpense(item, jobId))
      .filter((item): item is Entry => item !== null)
    if (migrated.length > 0) {
      saveEntries(migrated)
    }
    return migrated
  } catch {
    return []
  }
}

export function saveEntries(entries: Entry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function uniqueConcepts(
  entries: Entry[],
  options: { kind?: EntryKind; activityId?: string } = {},
): string[] {
  const seen = new Map<string, string>()
  for (const entry of entries) {
    if (entry.deletedAt) continue
    if (options.kind && entry.kind !== options.kind) continue
    if (options.activityId && entry.activityId !== options.activityId) continue
    const key = entry.concept.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.set(key, entry.concept.trim())
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b))
}

export function createActivity(name: string): Activity {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

function seedActivities(): Activity[] {
  const now = new Date().toISOString()
  return [
    {
      id: SEED_JOB_ID,
      name: 'Job',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      id: SEED_BUSINESS_ID,
      name: 'Business',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ]
}

function resolveJobId(activities: Activity[]): string {
  const job = activities.find(
    (activity) =>
      activity.id === SEED_JOB_ID ||
      activity.name.trim().toLowerCase() === 'job',
  )
  return job?.id ?? activities[0]?.id ?? SEED_JOB_ID
}

function migrateEntry(value: unknown, jobId: string): Entry | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>

  if (
    typeof item.id !== 'string' ||
    (item.kind !== 'expense' && item.kind !== 'income') ||
    typeof item.concept !== 'string' ||
    typeof item.amount !== 'number' ||
    !Number.isFinite(item.amount) ||
    typeof item.createdAt !== 'string'
  ) {
    return null
  }

  const activityId =
    typeof item.activityId === 'string' && item.activityId.trim()
      ? item.activityId
      : jobId

  return {
    id: item.id,
    kind: item.kind,
    activityId,
    concept: item.concept,
    amount: item.amount,
    createdAt: item.createdAt,
    updatedAt:
      typeof item.updatedAt === 'string' ? item.updatedAt : item.createdAt,
    deletedAt: typeof item.deletedAt === 'string' ? item.deletedAt : null,
  }
}

function migrateLegacyExpense(value: unknown, jobId: string): Entry | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (
    typeof item.id !== 'string' ||
    typeof item.concept !== 'string' ||
    typeof item.amount !== 'number' ||
    !Number.isFinite(item.amount) ||
    typeof item.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: item.id,
    kind: 'expense',
    activityId: jobId,
    concept: item.concept,
    amount: item.amount,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    deletedAt: null,
  }
}

function normalizeActivity(value: unknown): Activity | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (
    typeof item.id !== 'string' ||
    typeof item.name !== 'string' ||
    item.name.trim().length === 0 ||
    typeof item.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: item.id,
    name: item.name.trim(),
    createdAt: item.createdAt,
    updatedAt:
      typeof item.updatedAt === 'string' ? item.updatedAt : item.createdAt,
    deletedAt: typeof item.deletedAt === 'string' ? item.deletedAt : null,
  }
}

function sameActivity(value: unknown, next: Activity): boolean {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    item.id === next.id &&
    item.name === next.name &&
    item.createdAt === next.createdAt &&
    item.updatedAt === next.updatedAt &&
    (item.deletedAt ?? null) === next.deletedAt
  )
}

function sameEntry(value: unknown, next: Entry): boolean {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    item.id === next.id &&
    item.kind === next.kind &&
    item.activityId === next.activityId &&
    item.concept === next.concept &&
    item.amount === next.amount &&
    item.createdAt === next.createdAt &&
    item.updatedAt === next.updatedAt &&
    (item.deletedAt ?? null) === next.deletedAt
  )
}

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => a.name.localeCompare(b.name))
}
