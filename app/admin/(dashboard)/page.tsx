import { Shirt, LayoutGrid, Star, Sparkles } from 'lucide-react'
import { AdminTable } from '@/components/admin/admin-table'
import prisma from '@/lib/db'

export default async function AdminDashboardPage() {
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
    shortDescription: c.shortDescription,
    priceMin: c.priceMin,
    priceMax: c.priceMax,
    priceRange:
      c.priceMin === c.priceMax
        ? `$${c.priceMin}`
        : `$${c.priceMin} – $${c.priceMax}`,
    creationTime: c.estimatedTime,
    tags: c.tags,
    images: c.images.map((img) => img.url),
    imageKeys: c.images.map((img) => img.key),
    featured: c.featured,
    published: c.published,
  }))

  const stats = [
    { icon: Shirt, label: 'Total disfraces', value: costumes.length },
    { icon: LayoutGrid, label: 'Categorías', value: categories.length },
    {
      icon: Star,
      label: 'Destacados',
      value: costumes.filter((c) => c.featured && c.published).length,
    },
    {
      icon: Sparkles,
      label: 'Para niños',
      value: costumes.filter((c) => c.audience !== 'ADULTS').length,
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Panel de control
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Administra tu catálogo de disfraces.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card ring-foreground/5 flex items-center gap-4 rounded-xl p-3.5 shadow-xs ring-1"
          >
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <stat.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-xl leading-none font-semibold tabular-nums">
                {stat.value}
              </p>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-heading mb-4 text-lg font-medium">
          Todos los disfraces
        </h2>
        <AdminTable
          initialCostumes={mappedCostumes}
          initialCategories={categories}
        />
      </div>
    </div>
  )
}
