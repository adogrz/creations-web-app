'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { CostumeCard } from '@/components/costume-card'
import { categories, costumes } from '@/lib/data'
import { cn } from '@/lib/utils'

type CatalogViewProps = {
  initialQuery?: string
  initialCategory?: string
}

export function CatalogView({
  initialQuery = '',
  initialCategory = 'all',
}: CatalogViewProps) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return costumes.filter((costume) => {
      const matchesCategory =
        category === 'all' || costume.categorySlug === category
      if (!matchesCategory) return false
      if (!q) return true
      const haystack = [
        costume.name,
        costume.shortDescription,
        ...costume.tags,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, category])

  const filters = [{ slug: 'all', name: 'Todos' }, ...categories]

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-full border border-border bg-card p-2 pl-5 ring-1 ring-foreground/5 transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o etiqueta…"
          aria-label="Buscar disfraces"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
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
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-ring outline-none',
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
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'creación' : 'creaciones'}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((costume) => (
            <CostumeCard key={costume.slug} costume={costume} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-secondary/40 py-16 text-center">
          <p className="font-heading text-xl font-medium">No se encontraron creaciones</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Prueba con una búsqueda o categoría distinta — o escríbenos para pedir una pieza personalizada.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
            className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  )
}
