export function getCatalogHref({
  query,
  category,
  page = 1,
}: {
  query: string
  category: string
  page?: number
}) {
  const searchParams = new URLSearchParams()
  if (query) searchParams.set('q', query)
  if (category) searchParams.set('category', category)
  if (page > 1) searchParams.set('page', String(page))

  const search = searchParams.toString()
  return search ? `/costumes?${search}` : '/costumes'
}

type PageItem = number | { after: number; type: 'ellipsis' }

export function getPageItems(totalPages: number, page: number): PageItem[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((left, right) => left - right)

  return sorted.flatMap<PageItem>((item, index) =>
    index > 0 && item - sorted[index - 1] > 1
      ? [{ type: 'ellipsis', after: item }, item]
      : [item],
  )
}
