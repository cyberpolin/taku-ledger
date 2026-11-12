import { cn } from '../lib/cn'

type ButtonLoaderProps = {
  onDark?: boolean
}

export function ButtonLoader({ onDark = false }: ButtonLoaderProps) {
  return (
    <span
      className={cn(
        'size-4 shrink-0 animate-spin rounded-full border-2 motion-reduce:animate-none',
        onDark
          ? 'border-zinc-400 border-t-zinc-50'
          : 'border-zinc-300 border-t-zinc-950',
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
