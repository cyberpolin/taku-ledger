import { useEffect, useState } from 'react'
import { AppNav, type AppSection } from './components/AppNav'
import { EntryForm } from './components/EntryForm'
import { ExportPanel } from './components/ExportPanel'
import { InsightsPanel } from './components/InsightsPanel'
import { SettingsPanel } from './components/SettingsPanel'
import {
  forgetLastBackup,
  refreshBackupSchedule,
  startBackupClock,
  stopBackupClock,
} from './lib/backup'
import { deleteEntry, saveActivity, saveEntry } from './lib/ledger'
import { loadActivities, loadEntries } from './lib/storage'
import type { Activity, Entry } from './types'

export default function App() {
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities())
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries())
  const [section, setSection] = useState<AppSection>('add')

  useEffect(() => {
    startBackupClock()
    return () => stopBackupClock()
  }, [])

  const visibleActivities = activities.filter((item) => !item.deletedAt)
  const visibleEntries = entries.filter((item) => !item.deletedAt)

  function applySnapshot(snapshot: { activities: Activity[]; entries: Entry[] }) {
    setActivities(snapshot.activities)
    setEntries(snapshot.entries)
  }

  function handleAdd(entry: Entry) {
    applySnapshot(saveEntry(entry))
  }

  function handleAddActivity(activity: Activity) {
    applySnapshot(saveActivity(activity))
  }

  function handleDelete(id: string) {
    applySnapshot(deleteEntry(id))
  }

  function handleServerSaved(urlChanged: boolean) {
    if (urlChanged) forgetLastBackup()
    refreshBackupSchedule()
  }

  function handleServerCleared() {
    forgetLastBackup()
    refreshBackupSchedule()
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <AppNav section={section} onChange={setSection} />

      <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8 px-4 py-6 md:gap-12 md:px-6 md:py-8">
        {section === 'add' ? (
          <EntryForm
            activities={visibleActivities}
            entries={visibleEntries}
            onAdd={handleAdd}
            onAddActivity={handleAddActivity}
          />
        ) : null}

        {section === 'insights' ? (
          <InsightsPanel
            activities={visibleActivities}
            entries={visibleEntries}
            onDelete={handleDelete}
          />
        ) : null}

        {section === 'export' ? (
          <ExportPanel activities={visibleActivities} entries={visibleEntries} />
        ) : null}

        {section === 'settings' ? (
          <SettingsPanel
            onSaved={handleServerSaved}
            onCleared={handleServerCleared}
          />
        ) : null}
      </main>
    </div>
  )
}
