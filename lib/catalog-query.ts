import type { Prisma } from '@/generated/client'

const MAX_QUERY_LENGTH = 100
const MAX_PAGE = 10_000

type CatalogSearchParams = {
  category?: string | string[]
  page?: string | string[]
  q?: string | string[]
}

function getSearchParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

export function normalizeCatalogSearchParams(
  searchParams: CatalogSearchParams,
  categorySlugs: string[],
) {
  const pageValue = getSearchParam(searchParams.page)
  const parsedPage = /^[1-9]\d*$/.test(pageValue) ? Number(pageValue) : 1
  const category = getSearchParam(searchParams.category)

  return {
    query: getSearchParam(searchParams.q).trim().slice(0, MAX_QUERY_LENGTH),
    category: categorySlugs.includes(category) ? category : '',
    page:
      Number.isSafeInteger(parsedPage) && parsedPage <= MAX_PAGE
        ? parsedPage
        : 1,
  }
}

export function getCostumePageQuery(options: {
  query?: string
  categorySlug?: string
  page: number
  pageSize: number
}) {
  const where: Prisma.CostumeWhereInput = { published: true }

  if (options.categorySlug) {
    where.category = { slug: options.categorySlug }
  }

  if (options.query) {
    where.OR = [
      { name: { contains: options.query, mode: 'insensitive' } },
      { description: { contains: options.query, mode: 'insensitive' } },
      { tags: { has: options.query } },
    ]
  }

  return {
    skip: (options.page - 1) * options.pageSize,
    take: options.pageSize,
    where,
  }
}
