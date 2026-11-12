import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/cn'

type ConceptAutocompleteProps = {
  value: string
  suggestions: string[]
  onChange: (value: string) => void
  id?: string
}

export function ConceptAutocomplete({
  value,
  suggestions,
  onChange,
  id,
}: ConceptAutocompleteProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const query = value.trim()
  const hasTyped = query.length > 0

  const filtered = useMemo(() => {
    if (!hasTyped) return []
    const normalizedQuery = query.toLowerCase()
    return suggestions
      .filter((item) => item.toLowerCase().includes(normalizedQuery))
      .slice(0, 8)
  }, [suggestions, query, hasTyped])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    setActiveIndex(-1)
  }, [value])

  function selectSuggestion(concept: string) {
    onChange(concept)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      if (!hasTyped || filtered.length === 0) return
      setOpen(true)
      setActiveIndex(0)
      event.preventDefault()
      return
    }

    if (!open) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) =>
        current < filtered.length - 1 ? current + 1 : 0,
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) =>
        current <= 0 ? filtered.length - 1 : current - 1,
      )
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      selectSuggestion(filtered[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        value={value}
        onChange={(event) => {
          const next = event.target.value
          onChange(next)
          setOpen(next.trim().length > 0)
        }}
        onFocus={() => {
          if (hasTyped) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Kitchen supplies"
        className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 placeholder:text-zinc-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
      />
      {open && hasTyped && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-sm"
        >
          {filtered.map((concept, index) => (
            <li key={concept} role="presentation">
              <button
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'flex h-11 w-full items-center px-3 text-left text-sm text-zinc-950 transition-colors duration-150',
                  index === activeIndex
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50 md:hover:bg-zinc-50',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(concept)}
              >
                {concept}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
