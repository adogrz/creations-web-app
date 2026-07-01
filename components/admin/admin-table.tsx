'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Search, Pencil, Trash2, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { costumes as initialCostumes, getCategoryName } from '@/lib/data'
import { cn } from '@/lib/utils'

export function AdminTable() {
  const [list, setList] = useState(initialCostumes)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) => c.name.toLowerCase().includes(q))
  }, [list, query])

  function handleDelete(slug: string) {
    setList((prev) => prev.filter((c) => c.slug !== slug))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background h-10 sm:h-8 pl-4 w-full sm:w-72 transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar disfraces…"
            aria-label="Buscar disfraces"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/costumes/new" />}
          className="rounded-full h-10 w-full sm:h-8 sm:w-auto justify-center px-4 sm:px-3 text-sm sm:text-xs"
          data-icon="inline-start"
        >
          <PlusCircle aria-hidden="true" />
          Añadir disfraz
        </Button>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {filtered.map((costume) => (
          <div
            key={costume.slug}
            className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/5 shadow-xs"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={costume.images[0] || '/placeholder.svg'}
                alt={costume.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm leading-snug">{costume.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getCategoryName(costume.categorySlug)} · <span className="tabular-nums font-semibold text-primary">{costume.priceRange}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                size="default"
                variant="outline"
                className="rounded-full size-10 justify-center p-0"
                nativeButton={false}
                render={<Link href={`/admin/costumes/${costume.slug}/edit`} />}
                aria-label={`Editar ${costume.name}`}
              >
                <Pencil aria-hidden="true" className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      size="default"
                      variant="destructive"
                      className="rounded-full size-10 justify-center p-0"
                      aria-label={`Eliminar ${costume.name}`}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto eliminará permanentemente el disfraz &ldquo;{costume.name}&rdquo;. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(costume.slug)} variant="destructive">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5 shadow-xs sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-4 font-medium">Disfraz</th>
              <th className="p-4 font-medium">Categoría</th>
              <th className="p-4 font-medium">Público</th>
              <th className="p-4 font-medium">Precio</th>
              <th className="p-4 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((costume) => (
              <tr
                key={costume.slug}
                className="border-b border-border last:border-0"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={costume.images[0] || '/placeholder.svg'}
                        alt={costume.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{costume.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="secondary">
                    {getCategoryName(costume.categorySlug)}
                  </Badge>
                </td>
                <td className="p-4 text-muted-foreground">
                  {costume.audience === 'Kids' ? 'Niños' : costume.audience === 'Adults' ? 'Adultos' : 'Todo público'}
                </td>
                <td className="p-4 text-muted-foreground tabular-nums">
                  {costume.priceRange}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label={`Editar ${costume.name}`}
                      nativeButton={false}
                      render={<Link href={`/admin/costumes/${costume.slug}/edit`} />}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="destructive"
                            aria-label={`Eliminar ${costume.name}`}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto eliminará permanentemente el disfraz &ldquo;{costume.name}&rdquo;. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(costume.slug)} variant="destructive">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div
          className={cn(
            'flex flex-col items-center gap-2 rounded-2xl bg-card py-12 text-center ring-1 ring-foreground/5 shadow-xs',
          )}
        >
          <p className="font-heading text-lg font-medium">No se encontraron disfraces</p>
          <p className="text-sm text-muted-foreground">
            Prueba con una búsqueda distinta o añade un nuevo disfraz.
          </p>
        </div>
      )}
    </div>
  )
}
