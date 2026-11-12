import { Download, Plug, Save, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { ButtonLoader } from './ButtonLoader'
import {
  useBackupCountdown,
  type BackupClock,
} from '../hooks/useBackupCountdown'
import { formatDateTime } from '../lib/format'
import {
  clearServerConfig,
  loadServerConfig,
  saveServerConfig,
  testConnection,
} from '../lib/ledger'
import type { BackupRecord } from '../lib/backup'

type SettingsPanelProps = {
  onSaved: (urlChanged: boolean) => void
  onCleared: () => void
}

export function SettingsPanel({ onSaved, onCleared }: SettingsPanelProps) {
  const urlId = useId()
  const tokenId = useId()
  const saved = loadServerConfig()
  const [baseUrl, setBaseUrl] = useState(saved?.baseUrl ?? '')
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<'save' | 'test' | 'clear' | null>(null)

  const tokenOnDevice = Boolean(saved?.token)
  const backup = useBackupCountdown()

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const nextToken = token.trim() || saved?.token || ''
    if (!baseUrl.trim() || !nextToken) {
      setMessage('Enter a URL and a token.')
      return
    }

    setPending('save')
    try {
      const urlChanged = saveServerConfig({ baseUrl, token: nextToken })
      setToken('')
      setMessage('Server settings saved.')
      onSaved(urlChanged)
    } catch {
      setMessage('Enter a valid URL.')
    } finally {
      setPending(null)
    }
  }

  async function handleTest() {
    const nextToken = token.trim() || saved?.token || ''
    if (!baseUrl.trim() || !nextToken) {
      setMessage('Enter a URL and a token.')
      return
    }

    setPending('test')
    try {
      const version = await testConnection({ baseUrl, token: nextToken })
      setMessage(`Connected. Contract ${version}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Connection failed.')
    } finally {
      setPending(null)
    }
  }

  function handleClear() {
    clearServerConfig()
    setBaseUrl('')
    setToken('')
    setMessage('Server settings cleared. Data stays on this device.')
    setPending('clear')
    onCleared()
    setPending(null)
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950 md:text-2xl">
          Settings
        </h1>
        <p className="text-sm text-zinc-600">
          Add a server URL and token when you want this device to sync. Leave
          them empty to keep everything on this device.
        </p>
      </header>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor={urlId} className="text-sm font-medium text-zinc-950">
            Server URL
          </label>
          <input
            id={urlId}
            type="url"
            inputMode="url"
            autoComplete="off"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://example.com"
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 placeholder:text-zinc-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={tokenId} className="text-sm font-medium text-zinc-950">
            Token
          </label>
          <input
            id={tokenId}
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={tokenOnDevice ? 'Token saved' : 'Bearer token'}
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 placeholder:text-zinc-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          />
          {tokenOnDevice ? (
            <p className="text-xs text-zinc-600">
              A token is saved on this device. Enter a new one to replace it.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <button
            type="submit"
            disabled={pending !== null}
            aria-busy={pending === 'save'}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-zinc-50 transition-colors duration-150 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:w-auto"
          >
            {pending === 'save' ? (
              <ButtonLoader onDark />
            ) : (
              <Save className="size-4 shrink-0" aria-hidden />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={pending !== null}
            aria-busy={pending === 'test'}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors duration-150 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:w-auto"
          >
            {pending === 'test' ? (
              <ButtonLoader />
            ) : (
              <Plug className="size-4 shrink-0" aria-hidden />
            )}
            Test connection
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={pending !== null}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:w-auto"
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            Clear
          </button>
        </div>
      </form>

      <a
        href="/openapi.yaml"
        download="openapi.yaml"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors duration-150 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 md:w-auto"
      >
        <Download className="size-4 shrink-0" aria-hidden />
        Download contract
      </a>

      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-zinc-950">Backup history</h2>
          <p className="text-sm text-zinc-600">{backupStatus(backup)}</p>
          {backup.error ? (
            <p className="text-sm text-zinc-600">{backup.error}</p>
          ) : null}
        </header>

        {backup.history.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-base font-medium text-zinc-950">No backups yet</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Each upload is listed here after a server is saved.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {backup.history.map((record) => (
              <BackupHistoryItem key={record.id} record={record} />
            ))}
          </ul>
        )}
      </section>

      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
    </section>
  )
}

function BackupHistoryItem({ record }: { record: BackupRecord }) {
  const title = record.status === 'success' ? 'Uploaded' : 'Failed'
  const counts =
    record.status === 'success'
      ? `${record.activities} activities · ${record.entries} entries`
      : record.error

  return (
    <li className="flex min-w-0 flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-950">{title}</p>
      <p className="text-xs text-zinc-600">
        {formatDateTime(record.at)} · {backupHost(record.baseUrl)}
      </p>
      {counts ? <p className="text-sm text-zinc-600">{counts}</p> : null}
    </li>
  )
}

function backupHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl
  }
}

function backupStatus(clock: BackupClock): string {
  if (clock.phase === 'idle') return 'Backups start after you save a server.'
  if (clock.phase === 'uploading') return 'Uploading backup…'
  const label = clock.phase === 'retrying' ? 'Retrying in' : 'Next backup in'
  const minutes = Math.floor(clock.secondsLeft / 60)
  const seconds = clock.secondsLeft % 60
  return `${label} ${minutes}:${String(seconds).padStart(2, '0')}`
}
