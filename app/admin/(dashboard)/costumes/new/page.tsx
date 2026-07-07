import type { Metadata } from 'next'
import { AdminForm } from '@/components/admin/admin-form'
import prisma from '@/lib/db'

export const metadata: Metadata = {
  title: 'Nuevo disfraz — Estudio Creations',
}

export default async function NewCostumePage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-foreground font-serif text-2xl sm:text-3xl">
          Nuevo disfraz
        </h1>
        <p className="text-muted-foreground mt-1">
          Añade una nueva creación a tu catálogo.
        </p>
      </div>
      <AdminForm categories={categories} />
    </div>
  )
}
