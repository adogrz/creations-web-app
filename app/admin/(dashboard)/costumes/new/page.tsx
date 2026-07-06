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
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Nuevo disfraz</h1>
        <p className="mt-1 text-muted-foreground">Añade una nueva creación a tu catálogo.</p>
      </div>
      <AdminForm categories={categories} />
    </div>
  )
}
