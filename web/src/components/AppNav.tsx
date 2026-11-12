import {
  ChartColumn,
  Menu,
  Plus,
  Settings,
  Share,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../lib/cn'

export type AppSection = 'add' | 'insights' | 'export' | 'settings'

const NAV_ITEMS: { id: AppSection; label: string; icon: LucideIcon }[] = [
  { id: 'add', label: 'Add', icon: Plus },
  { id: 'insights', label: 'Insights', icon: ChartColumn },
  { id: 'export', label: 'Export', icon: Share },
  { id: 'settings', label: 'Settings', icon: Settings },
]

type AppNavProps = {
  section: AppSection
  onChange: (section: AppSection) => void
}

export function AppNav({ section, onChange }: AppNavProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function selectSection(next: AppSection) {
    onChange(next)
    setOpen(false)
  }

  return (
    <header className="relative border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Wallet className="size-5 shrink-0" aria-hidden />
          <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-zinc-950">
            Money tracker
          </p>
          <p className="truncate text-xs text-zinc-600 md:hidden">
            {NAV_ITEMS.find((item) => item.id === section)?.label}
          </p>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-2 md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectSection(item.id)}
              aria-current={section === item.id ? 'page' : undefined}
              className={cn(
                'inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
                section === item.id
                  ? 'bg-zinc-950 text-zinc-50'
                  : 'text-zinc-700 hover:bg-zinc-100',
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </button>
          ))}
        </nav>

        <button
          ref={buttonRef}
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-zinc-700 transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open ? (
        <div
          ref={panelRef}
          id={menuId}
          className="border-t border-zinc-200 bg-white md:hidden"
        >
          <nav aria-label="Mobile" className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectSection(item.id)}
                aria-current={section === item.id ? 'page' : undefined}
                className={cn(
                  'inline-flex h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
                  section === item.id
                    ? 'bg-zinc-950 text-zinc-50'
                    : 'text-zinc-700 hover:bg-zinc-100',
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
