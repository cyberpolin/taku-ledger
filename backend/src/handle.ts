import {
  ensureSchema,
  sql,
  type ActivityRow,
  type EntryRow,
} from './db.js'
import { authorize, empty, HttpError, json, readJson, routePath } from './http.js'
import {
  activitySchema,
  CONTRACT_VERSION,
  entrySchema,
  type Activity,
  type Entry,
} from './schema.js'

export async function handle(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return empty(204)

  try {
    if (!isHealth(request)) authorize(request)
    return await route(request)
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    const message = error instanceof Error ? error.message : 'Request failed.'
    return json({ error: message }, 500)
  }
}

async function route(request: Request): Promise<Response> {
  const parts = routePath(request)
  const [resource, id] = parts

  if (parts.length === 1 && resource === 'meta' && request.method === 'GET') {
    return json(
      { contractVersion: CONTRACT_VERSION, serverTime: new Date().toISOString() },
      200,
    )
  }

  if (parts.length === 1 && resource === 'health' && request.method === 'GET') {
    return health()
  }

  if (resource === 'activities' && parts.length <= 2) {
    return resourceRoute(request, parts.length === 2 ? id : undefined, 'activity')
  }

  if (resource === 'entries' && parts.length <= 2) {
    return resourceRoute(request, parts.length === 2 ? id : undefined, 'entry')
  }

  throw new HttpError(404, 'Not found.')
}

function isHealth(request: Request): boolean {
  if (request.method !== 'GET') return false
  const parts = routePath(request)
  return parts.length === 1 && parts[0] === 'health'
}

async function health(): Promise<Response> {
  const problems: string[] = []
  if (!process.env.API_TOKEN?.trim()) problems.push('API_TOKEN is not set.')

  try {
    await ensureSchema()
    const rows = await sql()`select 1 as ok`
    if (rows.length === 0) problems.push('Database is unavailable.')
  } catch (error) {
    problems.push(error instanceof Error ? error.message : 'Database is unavailable.')
  }

  if (problems.length > 0) throw new HttpError(503, problems.join(' '))
  return json({ status: 'ok' }, 200)
}

async function resourceRoute(
  request: Request,
  id: string | undefined,
  kind: 'activity' | 'entry',
): Promise<Response> {
  await ensureSchema()

  if (request.method === 'GET' && id == null) {
    const updatedSince = readUpdatedSince(request)
    const items =
      kind === 'activity'
        ? (await listActivities(updatedSince)).map(activityFromRow)
        : (await listEntries(updatedSince)).map(entryFromRow)
    return json({ items }, 200)
  }

  if (request.method === 'PUT' && id) {
    const body = await readJson(request)
    if (kind === 'activity') {
      const activity = parseActivity(body, id)
      return json(activityFromRow(await saveActivity(activity)), 200)
    }
    const entry = parseEntry(body, id)
    return json(entryFromRow(await saveEntry(entry)), 200)
  }

  if (request.method === 'DELETE' && id) {
    const row = kind === 'activity' ? await tombstoneActivity(id) : await tombstoneEntry(id)
    return json(kind === 'activity' ? activityFromRow(row as ActivityRow) : entryFromRow(row as EntryRow), 200)
  }

  throw new HttpError(405, 'Method not allowed.')
}

function readUpdatedSince(request: Request): string | null {
  const value = new URL(request.url).searchParams.get('updatedSince')
  if (!value) return null
  const parsed = activitySchema.shape.updatedAt.safeParse(value)
  if (!parsed.success) throw new HttpError(409, 'updatedSince must be a UTC timestamp.')
  return parsed.data
}

function parseActivity(body: unknown, id: string): Activity {
  const parsed = activitySchema.safeParse(body)
  if (!parsed.success) throw new HttpError(409, 'Activity is invalid.')
  if (parsed.data.id !== id) {
    throw new HttpError(409, 'The id in the path and body must match.')
  }
  return parsed.data
}

function parseEntry(body: unknown, id: string): Entry {
  const parsed = entrySchema.safeParse(body)
  if (!parsed.success) throw new HttpError(409, 'Entry is invalid.')
  if (parsed.data.id !== id) {
    throw new HttpError(409, 'The id in the path and body must match.')
  }
  return parsed.data
}

async function listActivities(updatedSince: string | null): Promise<ActivityRow[]> {
  const db = sql()
  if (updatedSince == null) {
    return db<ActivityRow[]>`
      select id, name, created_at, updated_at, deleted_at
      from activities
      order by updated_at asc
    `
  }
  return db<ActivityRow[]>`
    select id, name, created_at, updated_at, deleted_at
    from activities
    where updated_at > ${updatedSince}
    order by updated_at asc
  `
}

async function listEntries(updatedSince: string | null): Promise<EntryRow[]> {
  const db = sql()
  if (updatedSince == null) {
    return db<EntryRow[]>`
      select id, kind, activity_id, concept, amount, created_at, updated_at, deleted_at
      from entries
      order by updated_at asc
    `
  }
  return db<EntryRow[]>`
    select id, kind, activity_id, concept, amount, created_at, updated_at, deleted_at
    from entries
    where updated_at > ${updatedSince}
    order by updated_at asc
  `
}

async function saveActivity(activity: Activity): Promise<ActivityRow> {
  const db = sql()
  const saved = await db<ActivityRow[]>`
    insert into activities (id, name, created_at, updated_at, deleted_at)
    values (
      ${activity.id},
      ${activity.name},
      ${activity.createdAt},
      ${activity.updatedAt},
      ${activity.deletedAt}
    )
    on conflict (id) do update set
      name = excluded.name,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at
    where activities.updated_at < excluded.updated_at
    returning id, name, created_at, updated_at, deleted_at
  `
  return saved[0] ?? (await readActivity(activity.id))
}

async function saveEntry(entry: Entry): Promise<EntryRow> {
  const db = sql()
  const saved = await db<EntryRow[]>`
    insert into entries (
      id, kind, activity_id, concept, amount, created_at, updated_at, deleted_at
    )
    values (
      ${entry.id},
      ${entry.kind},
      ${entry.activityId},
      ${entry.concept},
      ${entry.amount},
      ${entry.createdAt},
      ${entry.updatedAt},
      ${entry.deletedAt}
    )
    on conflict (id) do update set
      kind = excluded.kind,
      activity_id = excluded.activity_id,
      concept = excluded.concept,
      amount = excluded.amount,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at
    where entries.updated_at < excluded.updated_at
    returning id, kind, activity_id, concept, amount, created_at, updated_at, deleted_at
  `
  return saved[0] ?? (await readEntry(entry.id))
}

async function tombstoneActivity(id: string): Promise<ActivityRow> {
  const db = sql()
  const updated = await db<ActivityRow[]>`
    update activities
    set deleted_at = now(), updated_at = now()
    where id = ${id} and deleted_at is null
    returning id, name, created_at, updated_at, deleted_at
  `
  if (updated[0]) return updated[0]
  const current = await db<ActivityRow[]>`
    select id, name, created_at, updated_at, deleted_at
    from activities
    where id = ${id}
  `
  if (!current[0]) throw new HttpError(409, 'Activity not found.')
  return current[0]
}

async function tombstoneEntry(id: string): Promise<EntryRow> {
  const db = sql()
  const updated = await db<EntryRow[]>`
    update entries
    set deleted_at = now(), updated_at = now()
    where id = ${id} and deleted_at is null
    returning id, kind, activity_id, concept, amount, created_at, updated_at, deleted_at
  `
  if (updated[0]) return updated[0]
  const current = await db<EntryRow[]>`
    select id, kind, activity_id, concept, amount, created_at, updated_at, deleted_at
    from entries
    where id = ${id}
  `
  if (!current[0]) throw new HttpError(409, 'Entry not found.')
  return current[0]
}

async function readActivity(id: string): Promise<ActivityRow> {
  const db = sql()
  const rows = await db<ActivityRow[]>`
    select id, name, created_at, updated_at, deleted_at
    from activities
    where id = ${id}
  `
  if (!rows[0]) throw new HttpError(409, 'Activity not found.')
  return rows[0]
}

async function readEntry(id: string): Promise<EntryRow> {
  const db = sql()
  const rows = await db<EntryRow[]>`
    select id, kind, activity_id, concept, amount, created_at, updated_at, deleted_at
    from entries
    where id = ${id}
  `
  if (!rows[0]) throw new HttpError(409, 'Entry not found.')
  return rows[0]
}

function activityFromRow(row: ActivityRow) {
  return {
    id: row.id,
    name: row.name,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: row.deleted_at == null ? null : toIso(row.deleted_at),
  }
}

function entryFromRow(row: EntryRow) {
  return {
    id: row.id,
    kind: row.kind,
    activityId: row.activity_id,
    concept: row.concept,
    amount: typeof row.amount === 'number' ? row.amount : Number(row.amount),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: row.deleted_at == null ? null : toIso(row.deleted_at),
  }
}

function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid timestamp from the database.')
  return date.toISOString()
}
