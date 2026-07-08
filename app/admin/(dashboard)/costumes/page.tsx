import { AdminTable } from '@/components/admin/admin-table'
import prisma from '@/lib/db'

export default async function AdminCostumesPage() {
  const costumes = await prisma.costume.findMany({
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  // Mapear disfraces al formato esperado por el componente
  const mappedCostumes = costumes.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    categorySlug: c.category.slug,
    categoryName: c.category.name,
    audience:
      c.audience === 'KIDS'
        ? 'Kids'
        : c.audience === 'ADULTS'
          ? 'Adults'
          : 'All ages',
    description: c.description,
    price: c.price,
    creationTime: c.estimatedTime,
    tags: c.tags,
    images: c.images.map((img) => img.url),
    imageKeys: c.images.map((img) => img.key),
    featured: c.featured,
    published: c.published,
  }))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Disfraces
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visualiza, edita y elimina disfraces de tu catálogo.
        </p>
      </div>
      <AdminTable
        initialCostumes={mappedCostumes}
        initialCategories={categories}
      />
    </div>
  )
}
