'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { CostumeCard } from '@/components/costume-card'
import { cn } from '@/lib/utils'
import type { Costume, Category } from '@/lib/types'

type CatalogViewProps = {
  costumes: Costume[]
  categories: Category[]
  initialQuery?: string
  initialCategory?: string
}

export function CatalogView({
  costumes,
  categories,
  initialQuery = '',
  initialCategory = 'all',
}: CatalogViewProps) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return costumes.filter((costume) => {
      const matchesCategory =
        category === 'all' || costume.category?.slug === category
      if (!matchesCategory) return false
      if (!q) return true
      const haystack = [
        costume.name,
        costume.description || '',
        ...(costume.tags || []),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, category, costumes])

  const filters = [{ slug: 'all', name: 'Todos' }, ...categories]

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="border-border bg-card ring-foreground/5 focus-within:ring-ring flex items-center gap-2 rounded-full border p-2 pl-5 ring-1 transition-all focus-within:border-transparent focus-within:ring-2">
        <Search
          className="text-muted-foreground size-5 shrink-0"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o etiqueta…"
          aria-label="Buscar disfraces"
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="text-muted-foreground hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-full"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filtrar por categoría"
      >
        {filters.map((f) => (
          <button
            key={f.slug}
            type="button"
            role="tab"
            aria-selected={category === f.slug}
            onClick={() => setCategory(f.slug)}
            className={cn(
              'focus-visible:ring-ring shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-[color,background-color] outline-none focus-visible:ring-2',
              category === f.slug
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
            )}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-muted-foreground text-sm">
        {filtered.length} {filtered.length === 1 ? 'creación' : 'creaciones'}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((costume) => (
            <CostumeCard key={costume.slug} costume={costume} />
          ))}
        </div>
      ) : (
        <div className="bg-secondary/40 flex flex-col items-center gap-3 rounded-3xl py-16 text-center">
          <p className="font-heading text-xl font-medium">
            No se encontraron creaciones
          </p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Prueba con una búsqueda o categoría distinta — o escríbenos para
            pedir una pieza personalizada.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  )
}
