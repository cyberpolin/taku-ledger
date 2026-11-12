import { z } from 'zod'
import {
  CONTRACT_VERSION,
  activitySchema,
  contractMajor,
  entrySchema,
  metaSchema,
  type Activity,
  type Entry,
} from '../contract/schema.ts'
import {
  loadActivities,
  loadEntries,
  saveActivities,
  saveEntries,
} from './storage.ts'

const SERVER_KEY = 'taku-server'
const CURSOR_KEY = 'taku-sync-cursor'

export type ServerConfig = {
  baseUrl: string
  token: string
}

export type LedgerSnapshot = {
  activities: Activity[]
  entries: Entry[]
}

export function loadServerConfig(): ServerConfig | null {
  try {
    const raw = localStorage.getItem(SERVER_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const item = parsed as Record<string, unknown>
    if (typeof item.baseUrl !== 'string' || typeof item.token !== 'string') {
      return null
    }
    if (!item.baseUrl.trim() || !item.token.trim()) return null
    return { baseUrl: item.baseUrl.trim(), token: item.token }
  } catch {
    return null
  }
}

export function saveServerConfig(config: ServerConfig): boolean {
  const next = {
    baseUrl: normalizeBaseUrl(config.baseUrl),
    token: config.token.trim(),
  }
  const previous = loadServerConfig()
  const urlChanged = !previous || previous.baseUrl !== next.baseUrl
  localStorage.setItem(SERVER_KEY, JSON.stringify(next))
  if (urlChanged) localStorage.removeItem(CURSOR_KEY)
  return urlChanged
}

export function clearServerConfig(): void {
  localStorage.removeItem(SERVER_KEY)
  localStorage.removeItem(CURSOR_KEY)
}

export function loadLedger(): LedgerSnapshot {
  return localSnapshot()
}

export function saveActivity(activity: Activity): LedgerSnapshot {
  const stamped = { ...activity, updatedAt: new Date().toISOString() }
  const current = loadActivities().filter((item) => item.id !== stamped.id)
  const activities = sortByName([...current, stamped])
  saveActivities(activities)
  return { activities, entries: loadEntries(activities) }
}

export function saveEntry(entry: Entry): LedgerSnapshot {
  const stamped = {
    ...entry,
    updatedAt: new Date().toISOString(),
    deletedAt: entry.deletedAt ?? null,
  }
  const entries = [stamped, ...loadEntries().filter((item) => item.id !== stamped.id)]
  saveEntries(entries)
  return { activities: loadActivities(), entries }
}

export function deleteActivity(id: string): LedgerSnapshot {
  const now = new Date().toISOString()
  const activities = loadActivities().map((item) =>
    item.id === id ? { ...item, deletedAt: now, updatedAt: now } : item,
  )
  saveActivities(activities)
  return { activities, entries: loadEntries(activities) }
}

export function deleteEntry(id: string): LedgerSnapshot {
  const now = new Date().toISOString()
  const entries = loadEntries().map((item) =>
    item.id === id ? { ...item, deletedAt: now, updatedAt: now } : item,
  )
  saveEntries(entries)
  return { activities: loadActivities(), entries }
}

export async function uploadLocalBackup(): Promise<{
  activities: number
  entries: number
}> {
  const config = loadServerConfig()
  if (!config) return { activities: 0, entries: 0 }

  const meta = await readMeta(config)
  assertContract(meta.contractVersion)

  const activities = loadActivities()
  const entries = loadEntries()

  for (const activity of activities) {
    await request(
      config,
      `/activities/${encodeURIComponent(activity.id)}`,
      { method: 'PUT', body: JSON.stringify(activity) },
      activitySchema,
    )
  }
  for (const entry of entries) {
    await request(
      config,
      `/entries/${encodeURIComponent(entry.id)}`,
      { method: 'PUT', body: JSON.stringify(entry) },
      entrySchema,
    )
  }

  return { activities: activities.length, entries: entries.length }
}

export async function testConnection(config: ServerConfig): Promise<string> {
  const meta = await readMeta({
    baseUrl: normalizeBaseUrl(config.baseUrl),
    token: config.token.trim(),
  })
  assertContract(meta.contractVersion)
  return meta.contractVersion
}

function localSnapshot(): LedgerSnapshot {
  const activities = loadActivities()
  return { activities, entries: loadEntries(activities) }
}

async function readMeta(config: ServerConfig) {
  return request(config, '/meta', { method: 'GET' }, metaSchema)
}

function assertContract(version: string) {
  if (contractMajor(version) !== contractMajor(CONTRACT_VERSION)) {
    throw new Error(
      `This app supports contract ${CONTRACT_VERSION}. The server reported ${version}.`,
    )
  }
}

async function request<T>(
  config: ServerConfig,
  path: string,
  init: RequestInit,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })

  const text = await response.text()
  const body: unknown = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : `Request failed (${response.status}).`
    throw new Error(message)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new Error('The server response did not match the contract.')
  }
  return parsed.data
}

function normalizeBaseUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Enter a valid URL.')
    }
    return url.toString().replace(/\/$/, '')
  } catch (error) {
    if (error instanceof Error && error.message === 'Enter a valid URL.') {
      throw error
    }
    throw new Error('Enter a valid URL.')
  }
}

function sortByName(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => a.name.localeCompare(b.name))
}

