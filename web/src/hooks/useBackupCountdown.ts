import { useEffect, useState } from 'react'
import {
  getBackupClock,
  subscribeBackupClock,
  type BackupClock,
} from '../lib/backup.ts'

export type { BackupClock }

export function useBackupCountdown(): BackupClock {
  const [clock, setClock] = useState<BackupClock>(() => getBackupClock())

  useEffect(() => subscribeBackupClock(setClock), [])

  return clock
}
