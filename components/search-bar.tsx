'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const query = value.trim()
    router.push(
      query ? `/costumes?q=${encodeURIComponent(query)}` : '/costumes',
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'border-border bg-card ring-foreground/5 focus-within:ring-ring flex w-full items-center gap-2 rounded-full border p-2 pl-4 shadow-sm ring-1 transition-all focus-within:border-transparent focus-within:ring-2 sm:pl-5',
        className,
      )}
      role="search"
    >
      <Search
        className="text-muted-foreground size-5 shrink-0"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar Rumi, princesa, Spider-Man…"
        aria-label="Buscar disfraces"
        className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none sm:text-base"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center justify-center rounded-full p-2.5 text-sm font-semibold transition-[background-color] sm:px-5 sm:py-2.5"
      >
        <Search className="size-4 sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">Buscar</span>
      </button>
    </form>
  )
}
