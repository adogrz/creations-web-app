import type { Metadata } from 'next'
import { CategoriesManager } from '@/components/admin/categories-manager'
import prisma from '@/lib/db'

export const metadata: Metadata = {
  title: 'Categorías — Estudio Creations',
}

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { costumes: true }
      }
    }
  })

  // Mapear al formato que espera el componente (con conteo pre-calculado)
  const mappedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    image: c.image || '',
    imageKey: c.imageKey || '',
    costumeCount: c._count.costumes,
  }))

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Categorías
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las categorías del catálogo. No puedes borrar una categoría que tenga disfraces asociados.
        </p>
      </div>
      <CategoriesManager initialCategories={mappedCategories} />
    </div>
  )
}
