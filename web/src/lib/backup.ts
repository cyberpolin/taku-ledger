import { loadServerConfig, uploadLocalBackup } from './ledger.ts'

const LAST_BACKUP_KEY = 'taku-last-backup-at'
const HISTORY_KEY = 'taku-backup-history'
const BACKUP_EVERY_MS = 10 * 60 * 1000
const RETRY_EVERY_MS = 60 * 1000
const HISTORY_LIMIT = 30

export type BackupPhase = 'idle' | 'uploading' | 'waiting' | 'retrying'

export type BackupRecord = {
  id: string
  at: string
  baseUrl: string
  status: 'success' | 'failed'
  error: string
  activities: number
  entries: number
}

export type BackupClock = {
  phase: BackupPhase
  lastBackupAt: number | null
  nextBackupAt: number | null
  secondsLeft: number
  error: string
  history: BackupRecord[]
}

const listeners = new Set<(clock: BackupClock) => void>()

let phase: BackupPhase = 'idle'
let nextBackupAt: number | null = null
let error = ''
let uploading = false
let tickTimer: ReturnType<typeof setInterval> | null = null
let backupTimer: ReturnType<typeof setTimeout> | null = null

export function getBackupClock(): BackupClock {
  return {
    phase,
    lastBackupAt: readLastBackup(),
    nextBackupAt,
    secondsLeft:
      nextBackupAt == null
        ? 0
        : Math.max(0, Math.ceil((nextBackupAt - Date.now()) / 1000)),
    error,
    history: readHistory(),
  }
}

export function subscribeBackupClock(
  listener: (clock: BackupClock) => void,
): () => void {
  listeners.add(listener)
  listener(getBackupClock())
  return () => {
    listeners.delete(listener)
  }
}

export function startBackupClock(): void {
  if (tickTimer != null) return
  tickTimer = setInterval(publish, 1000)
  planBackup()
}

export function stopBackupClock(): void {
  if (tickTimer != null) clearInterval(tickTimer)
  tickTimer = null
  clearBackupTimer()
}

export function forgetLastBackup(): void {
  localStorage.removeItem(LAST_BACKUP_KEY)
}

export function refreshBackupSchedule(): void {
  planBackup()
}

function planBackup() {
  if (!loadServerConfig()) {
    phase = 'idle'
    nextBackupAt = null
    error = ''
    clearBackupTimer()
    publish()
    return
  }

  if (uploading) return

  const lastBackupAt = readLastBackup()
  const dueAt = lastBackupAt == null ? 0 : lastBackupAt + BACKUP_EVERY_MS
  if (Date.now() >= dueAt) {
    void runBackup()
    return
  }

  schedule(dueAt, 'waiting')
}

async function runBackup() {
  if (uploading || !loadServerConfig()) return
  uploading = true
  phase = 'uploading'
  nextBackupAt = null
  error = ''
  clearBackupTimer()
  publish()

  const baseUrl = loadServerConfig()?.baseUrl ?? ''

  try {
    const uploaded = await uploadLocalBackup()
    localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()))
    recordHistory({
      baseUrl,
      status: 'success',
      error: '',
      activities: uploaded.activities,
      entries: uploaded.entries,
    })
    uploading = false
    error = ''
    schedule(Date.now() + BACKUP_EVERY_MS, 'waiting')
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Backup failed.'
    recordHistory({
      baseUrl,
      status: 'failed',
      error: message,
      activities: 0,
      entries: 0,
    })
    uploading = false
    error = message
    schedule(Date.now() + RETRY_EVERY_MS, 'retrying')
  }
}

function schedule(at: number, nextPhase: 'waiting' | 'retrying') {
  phase = nextPhase
  nextBackupAt = at
  clearBackupTimer()
  backupTimer = setTimeout(() => {
    void runBackup()
  }, Math.max(0, at - Date.now()))
  publish()
}

function clearBackupTimer() {
  if (backupTimer != null) clearTimeout(backupTimer)
  backupTimer = null
}

function recordHistory(
  record: Omit<BackupRecord, 'id' | 'at'>,
): void {
  const next: BackupRecord = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...record,
  }
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify([next, ...readHistory()].slice(0, HISTORY_LIMIT)),
  )
}

function readHistory(): BackupRecord[] {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isBackupRecord).slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

function isBackupRecord(value: unknown): value is BackupRecord {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<BackupRecord>
  return (
    typeof item.id === 'string' &&
    typeof item.at === 'string' &&
    typeof item.baseUrl === 'string' &&
    (item.status === 'success' || item.status === 'failed') &&
    typeof item.error === 'string' &&
    typeof item.activities === 'number' &&
    typeof item.entries === 'number'
  )
}

function readLastBackup(): number | null {
  const raw = localStorage.getItem(LAST_BACKUP_KEY)
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function publish() {
  const clock = getBackupClock()
  for (const listener of listeners) listener(clock)
}
