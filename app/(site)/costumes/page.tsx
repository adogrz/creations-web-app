import type { Metadata } from 'next'
import { CatalogView } from '@/components/catalog-view'
import { normalizeCatalogSearchParams } from '@/lib/catalog-query'
import { getCategories, getCostumePage } from '@/lib/queries'

const PAGE_SIZE = 12

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Explora nuestro catálogo completo de disfraces hechos a mano. Diseños exclusivos y personalizados para niños y adultos en El Salvador.',
  alternates: {
    canonical: '/costumes',
  },
  openGraph: {
    type: 'website',
    url: '/costumes',
    title: 'Catálogo de Disfraces | Creations',
    description:
      'Explora nuestro catálogo completo de disfraces hechos a mano. Diseños exclusivos y personalizados para niños y adultos en El Salvador.',
  },
}

export default async function CostumesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[]
    category?: string | string[]
    page?: string | string[]
  }>
}) {
  const params = await searchParams
  const categories = await getCategories()
  const { category, page, query } = normalizeCatalogSearchParams(
    params,
    categories.map((item) => item.slug),
  )
  const { costumes, total } = await getCostumePage({
    query,
    categorySlug: category || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          El catálogo
        </h1>
        <p className="text-muted-foreground mt-3 text-lg text-pretty">
          Cada disfraz se confecciona a mano bajo pedido. Explora para
          inspirarte, luego escríbenos para hacer el tuyo.
        </p>
      </header>
      <CatalogView
        costumes={costumes}
        categories={categories}
        query={query}
        category={category}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </div>
  )
}
