import postgres from 'postgres'

export type ActivityRow = {
  id: string
  name: string
  created_at: Date | string
  updated_at: Date | string
  deleted_at: Date | string | null
}

export type EntryRow = {
  id: string
  kind: string
  activity_id: string
  concept: string
  amount: number | string
  created_at: Date | string
  updated_at: Date | string
  deleted_at: Date | string | null
}

const globalForDb = globalThis as typeof globalThis & {
  __takuSql?: postgres.Sql
  __takuSchema?: Promise<void>
}

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL is not set.')
  return url
}

export function sql(): postgres.Sql {
  if (!globalForDb.__takuSql) {
    globalForDb.__takuSql = postgres(databaseUrl(), {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
      prepare: false,
    })
  }
  return globalForDb.__takuSql
}

export function ensureSchema(): Promise<void> {
  if (!globalForDb.__takuSchema) {
    globalForDb.__takuSchema = migrate().catch((error: unknown) => {
      globalForDb.__takuSchema = undefined
      throw error
    })
  }
  return globalForDb.__takuSchema
}

async function migrate(): Promise<void> {
  const db = sql()
  await db.unsafe(`
    create table if not exists activities (
      id text primary key,
      name text not null,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      deleted_at timestamptz
    )
  `)
  await db.unsafe(`
    create table if not exists entries (
      id text primary key,
      kind text not null,
      activity_id text not null,
      concept text not null,
      amount double precision not null,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      deleted_at timestamptz,
      constraint entries_kind_check check (kind in ('expense', 'income')),
      constraint entries_amount_check check (amount > 0)
    )
  `)
  await db.unsafe(
    `create index if not exists activities_updated_at_idx on activities (updated_at)`,
  )
  await db.unsafe(
    `create index if not exists entries_updated_at_idx on entries (updated_at)`,
  )
}
