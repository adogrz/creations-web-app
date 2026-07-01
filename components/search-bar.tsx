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
    router.push(query ? `/costumes?q=${encodeURIComponent(query)}` : '/costumes')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex w-full items-center gap-2 rounded-full border border-border bg-card p-2 pl-4 shadow-sm ring-1 ring-foreground/5 transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent sm:pl-5',
        className,
      )}
      role="search"
    >
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar Rumi, Elsa, Spider-Man…"
        aria-label="Buscar disfraces"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:text-base"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex shrink-0 items-center justify-center rounded-full bg-primary p-2.5 text-sm font-semibold text-primary-foreground transition-[background-color] hover:bg-primary/90 sm:px-5 sm:py-2.5"
      >
        <Search className="size-4 sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">Buscar</span>
      </button>
    </form>
  )
}
