import type { Metadata } from 'next'
import { CategoriesManager } from '@/components/admin/categories-manager'

export const metadata: Metadata = {
  title: 'Categorías — Estudio Creations',
}

export default function AdminCategoriesPage() {
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
      <CategoriesManager />
    </div>
  )
}
