import type { Metadata } from 'next'
import { CatalogView } from '@/components/catalog-view'
import { getCategories, getCostumes } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Catálogo — Creations',
  description: 'Explora nuestro catálogo completo de disfraces hechos a mano.',
}

export default async function CostumesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams
  const initialQuery = params.q ?? ''

  const categories = await getCategories()
  const costumes = await getCostumes({ published: true })

  const initialCategory =
    params.category && categories.some((c) => c.slug === params.category)
      ? params.category
      : 'all'

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
        initialQuery={initialQuery}
        initialCategory={initialCategory}
      />
    </div>
  )
}
