'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useEffect, useTransition } from 'react'
import {
  Search,
  Pencil,
  Trash2,
  PlusCircle,
  Eye,
  EyeOff,
  Star,
  Loader2,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { deleteCostumeAction } from '@/app/admin/actions/costume-actions'
import { toast } from 'sonner'

type CostumeItem = {
  id: string
  name: string
  slug: string
  categorySlug: string
  categoryName: string
  audience: string
  description: string | null
  price: number
  creationTime: string
  tags: string[]
  images: string[]
  imageKeys: string[]
  featured: boolean
  published: boolean
}

type CategoryItem = {
  id: string
  name: string
  slug: string
}

export function AdminTable({
  initialCostumes,
  initialCategories,
}: {
  initialCostumes: CostumeItem[]
  initialCategories: CategoryItem[]
}) {
  const router = useRouter()
  const [list, setList] = useState(initialCostumes)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setList(initialCostumes)
  }, [initialCostumes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return list.filter((c) => {
      const matchesQuery = !q || c.name.toLowerCase().includes(q)
      const matchesCategory =
        categoryFilter === 'all' || c.categorySlug === categoryFilter
      return matchesQuery && matchesCategory
    })
  }, [list, query, categoryFilter])

  async function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteCostumeAction(id)
      if (res.success) {
        toast.success('Disfraz eliminado exitosamente')
        router.refresh()
      } else {
        toast.error(res.error || 'Error al eliminar el disfraz')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="border-border bg-background focus-within:ring-ring flex h-10 w-full items-center gap-2 rounded-full border pl-4 transition-all focus-within:border-transparent focus-within:ring-2 sm:h-8 sm:w-64">
            <Search
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar disfraces…"
              aria-label="Buscar disfraces"
              className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoría"
            className="border-border bg-background text-foreground focus:ring-ring h-10 w-full cursor-pointer rounded-full border px-3 text-sm outline-none focus:ring-2 sm:h-8 sm:w-auto"
          >
            <option value="all">Todas las categorías</option>
            {initialCategories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/costumes/new" />}
          className="h-10 w-full justify-center rounded-full px-4 text-sm sm:h-8 sm:w-auto sm:px-3 sm:text-xs"
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
            key={costume.id}
            className="bg-card ring-foreground/5 flex items-center gap-3 rounded-xl p-3 shadow-xs ring-1"
          >
            <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={costume.images[0] || '/placeholder.svg'}
                alt={costume.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-snug font-medium">
                {costume.name}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {costume.categoryName} ·{' '}
                <span className="text-primary font-semibold tabular-nums">
                  Desde ${costume.price}
                </span>
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {costume.published ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    <Eye className="size-2.5" />
                    Publicado
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                    <EyeOff className="size-2.5" />
                    Borrador
                  </span>
                )}
                {costume.featured && (
                  <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                    <Star className="size-2.5" />
                    Destacado
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                size="default"
                variant="outline"
                className="size-10 justify-center rounded-full p-0"
                nativeButton={false}
                render={<Link href={`/admin/costumes/${costume.slug}/edit`} />}
                aria-label={`Editar ${costume.name}`}
                disabled={isPending}
              >
                <Pencil aria-hidden="true" className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      size="default"
                      variant="destructive"
                      className="size-10 justify-center rounded-full p-0"
                      aria-label={`Eliminar ${costume.name}`}
                      disabled={isPending}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto eliminará permanentemente el disfraz &ldquo;
                      {costume.name}&rdquo;. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(costume.id)}
                      variant="destructive"
                    >
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
      <div className="bg-card ring-foreground/5 hidden overflow-hidden rounded-2xl shadow-xs ring-1 sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-left">
              <th className="p-4 font-medium">Disfraz</th>
              <th className="p-4 font-medium">Categoría</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium">Destacado</th>
              <th className="p-4 font-medium">Precio</th>
              <th className="p-4 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((costume) => (
              <tr
                key={costume.id}
                className="border-border border-b last:border-0"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-lg">
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
                  <Badge variant="secondary">{costume.categoryName}</Badge>
                </td>
                <td className="p-4">
                  {costume.published ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      <Eye className="size-3" />
                      Publicado
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                      <EyeOff className="size-3" />
                      Borrador
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {costume.featured ? (
                    <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                      <Star className="size-3" />
                      Sí
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="text-muted-foreground p-4 tabular-nums">
                  Desde ${costume.price}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label={`Editar ${costume.name}`}
                      nativeButton={false}
                      render={
                        <Link href={`/admin/costumes/${costume.slug}/edit`} />
                      }
                      disabled={isPending}
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
                            disabled={isPending}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto eliminará permanentemente el disfraz &ldquo;
                            {costume.name}&rdquo;. Esta acción no se puede
                            deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(costume.id)}
                            variant="destructive"
                          >
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
            'bg-card ring-foreground/5 flex flex-col items-center gap-2 rounded-2xl py-12 text-center shadow-xs ring-1',
          )}
        >
          <p className="font-heading text-lg font-medium">
            No se encontraron disfraces
          </p>
          <p className="text-muted-foreground text-sm">
            Prueba con una búsqueda distinta o añade un nuevo disfraz.
          </p>
        </div>
      )}
    </div>
  )
}
