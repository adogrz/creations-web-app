import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminForm } from '@/components/admin/admin-form'
import { getCostumeBySlug } from '@/lib/queries'
import prisma from '@/lib/db'

export const metadata: Metadata = {
  title: 'Editar disfraz — Estudio Creations',
}

export default async function EditCostumePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [costume, categories] = await Promise.all([
    getCostumeBySlug(slug),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  if (!costume) {
    notFound()
  }

  // Mapear al formato del formulario
  const mappedCostume = {
    id: costume.id,
    name: costume.name,
    slug: costume.slug,
    categoryId: costume.categoryId,
    categorySlug: costume.category?.slug || '',
    audience:
      costume.audience === 'KIDS'
        ? 'Kids'
        : costume.audience === 'ADULTS'
          ? 'Adults'
          : 'All ages',
    description: costume.description,
    price: costume.price,
    creationTime: costume.estimatedTime,
    tags: costume.tags,
    images: costume.images.map((img) => ({
      id: img.id,
      url: img.url,
      key: img.key,
      alt: img.alt,
    })),
    featured: costume.featured,
    published: costume.published,
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-foreground font-serif text-2xl sm:text-3xl">
          Editar disfraz
        </h1>
        <p className="text-muted-foreground mt-1">
          Actualiza los detalles de {costume.name}.
        </p>
      </div>
      <AdminForm costume={mappedCostume} categories={categories} />
    </div>
  )
}
