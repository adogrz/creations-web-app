import Link from 'next/link'
import { Search } from 'lucide-react'
import { CostumeCard } from '@/components/costume-card'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { Category, Costume } from '@/lib/types'
import { getCatalogHref, getPageItems } from '@/lib/catalog-navigation'
import { cn } from '@/lib/utils'

type CatalogViewProps = {
  costumes: Costume[]
  categories: Category[]
  query: string
  category: string
  page: number
  pageSize: number
  total: number
}

export function CatalogView({
  costumes,
  categories,
  query,
  category,
  page,
  pageSize,
  total,
}: CatalogViewProps) {
  const filters = [{ slug: '', name: 'Todas' }, ...categories]
  const totalPages = Math.ceil(total / pageSize)
  const firstResult = total ? (page - 1) * pageSize + 1 : 0
  const lastResult = total ? firstResult + costumes.length - 1 : 0
  const pageItems = totalPages > 1 ? getPageItems(totalPages, page) : []

  return (
    <div className="flex flex-col gap-6">
      <form
        action="/costumes"
        className="border-border bg-card ring-foreground/5 focus-within:ring-ring flex flex-col gap-2 rounded-3xl border p-3 ring-1 focus-within:border-transparent focus-within:ring-2 sm:flex-row sm:items-center"
        method="get"
        role="search"
      >
        <label className="sr-only" htmlFor="catalog-search">
          Buscar disfraces
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Search
            aria-hidden="true"
            className="text-muted-foreground size-5 shrink-0"
          />
          <input
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-1 py-1 text-base outline-none"
            defaultValue={query}
            id="catalog-search"
            name="q"
            placeholder="Buscar por nombre, descripción o etiqueta…"
            type="search"
          />
        </div>
        <label className="sr-only" htmlFor="catalog-category">
          Categoría
        </label>
        <select
          className="border-border bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"
          defaultValue={category}
          id="catalog-category"
          name="category"
        >
          {filters.map((filter) => (
            <option key={filter.slug || 'all'} value={filter.slug}>
              {filter.name}
            </option>
          ))}
        </select>
        <Button type="submit">Buscar</Button>
      </form>

      <nav
        aria-label="Filtrar por categoría"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {filters.map((filter) => (
          <Link
            aria-current={category === filter.slug ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-ring shrink-0 rounded-full px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2',
              category === filter.slug
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
            )}
            href={getCatalogHref({ query, category: filter.slug })}
            key={filter.slug || 'all'}
          >
            {filter.name}
          </Link>
        ))}
      </nav>

      <p className="text-muted-foreground text-sm">
        {total
          ? `${firstResult}–${lastResult} de ${total} ${total === 1 ? 'creación' : 'creaciones'}`
          : '0 creaciones'}
      </p>

      {costumes.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {costumes.map((costume) => (
            <CostumeCard key={costume.slug} costume={costume} />
          ))}
        </div>
      ) : (
        <div className="bg-secondary/40 flex flex-col items-center gap-3 rounded-3xl py-16 text-center">
          <p className="font-heading text-xl font-medium">
            {total
              ? 'Esta página no tiene creaciones'
              : 'No se encontraron creaciones'}
          </p>
          <p className="text-muted-foreground max-w-xs text-sm">
            {total
              ? 'Vuelve a la primera página para explorar las creaciones disponibles.'
              : 'Prueba con una búsqueda o categoría distinta — o escríbenos para pedir una pieza personalizada.'}
          </p>
          <Link
            className={cn(
              buttonVariants({ variant: 'default' }),
              'mt-2 rounded-full',
            )}
            href={total ? getCatalogHref({ query, category }) : '/costumes'}
          >
            {total ? 'Volver a la primera página' : 'Restablecer filtros'}
          </Link>
        </div>
      )}

      {pageItems.length > 0 && (
        <Pagination aria-label="Paginación del catálogo">
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={getCatalogHref({ query, category, page: page - 1 })}
                  text="Anterior"
                />
              </PaginationItem>
            )}
            {pageItems.map((item) =>
              typeof item === 'object' ? (
                <PaginationItem key={`ellipsis-${item.after}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={getCatalogHref({ query, category, page: item })}
                    isActive={item === page}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href={getCatalogHref({ query, category, page: page + 1 })}
                  text="Siguiente"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
