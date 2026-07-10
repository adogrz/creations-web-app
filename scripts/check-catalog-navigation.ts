import assert from 'node:assert/strict'
import { getCatalogHref, getPageItems } from '../lib/catalog-navigation'
import {
  getCostumePageQuery,
  normalizeCatalogSearchParams,
} from '../lib/catalog-query'

assert.equal(
  getCatalogHref({ query: 'hada azul', category: 'ninos', page: 2 }),
  '/costumes?q=hada+azul&category=ninos&page=2',
)
assert.equal(getCatalogHref({ query: '', category: '' }), '/costumes')
assert.deepEqual(getPageItems(10, 5), [
  1,
  { type: 'ellipsis', after: 4 },
  4,
  5,
  6,
  { type: 'ellipsis', after: 10 },
  10,
])
assert.deepEqual(
  normalizeCatalogSearchParams(
    { category: 'ninos', page: '10000', q: '  hada azul  ' },
    ['ninos'],
  ),
  { category: 'ninos', page: 10000, query: 'hada azul' },
)
assert.deepEqual(
  normalizeCatalogSearchParams(
    { category: 'invalid', page: '10001', q: ['ignored'] },
    ['ninos'],
  ),
  { category: '', page: 1, query: '' },
)
assert.deepEqual(
  getCostumePageQuery({
    categorySlug: 'ninos',
    page: 2,
    pageSize: 12,
    query: 'hada azul',
  }),
  {
    skip: 12,
    take: 12,
    where: {
      OR: [
        { name: { contains: 'hada azul', mode: 'insensitive' } },
        { description: { contains: 'hada azul', mode: 'insensitive' } },
        { tags: { has: 'hada azul' } },
      ],
      category: { slug: 'ninos' },
      published: true,
    },
  },
)
