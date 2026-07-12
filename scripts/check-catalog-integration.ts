import assert from 'node:assert/strict'
import {
  CATALOG_MUTATION_ERRORS,
  createCategory,
  createCostume,
  deleteCategory,
  deleteCostume,
  isTransactionConflict,
  updateCategory,
  updateCostume,
} from '../lib/catalog-mutations'
import {
  executeCategoryAction,
  executeCostumeAction,
} from '../lib/catalog-action-orchestration'
import prisma from '../lib/db'
import { getCostumeBySlug } from '../lib/queries'

if (
  process.env.NODE_ENV !== 'test' ||
  process.env.INTEGRATION_TEST_DATABASE !== '1'
) {
  throw new Error(
    'Refusing database integration check: set NODE_ENV=test and INTEGRATION_TEST_DATABASE=1.',
  )
}

const run = crypto.randomUUID()
let categoryId: string | undefined
const categoryIds = new Set<string>()

function costumeInput(
  index: string,
  overrides: Partial<{ featured: boolean; published: boolean }> = {},
) {
  return {
    name: `integration-${run}-${index}`,
    slug: `integration-${run}-${index}`,
    description: null,
    price: 1,
    estimatedTime: '1 day',
    audience: 'ALL' as const,
    tags: [],
    published: overrides.published ?? true,
    featured: overrides.featured ?? false,
    categoryId: categoryId!,
    images: [
      {
        url: `https://invalid.example/${run}-${index}-b`,
        key: `${run}-${index}-b`,
      },
      {
        url: `https://invalid.example/${run}-${index}-a`,
        key: `${run}-${index}-a`,
      },
    ],
  }
}

function isExpectedFeaturedConflict(error: unknown) {
  return (
    (error instanceof Error &&
      error.message === CATALOG_MUTATION_ERRORS.featuredLimit) ||
    isTransactionConflict(error)
  )
}

async function checkActionOrchestration() {
  const logs: unknown[] = []
  const successCalls = { parse: 0, mutate: 0, complete: 0 }
  const dependencies = {
    action: 'integration-action',
    unauthorized: { error: 'Unauthorized', failureClass: 'unauthorized' },
    log: (
      action: string,
      outcome: 'success' | 'failure',
      failureClass?: string,
    ) =>
      logs.push(
        failureClass ? [action, outcome, failureClass] : [action, outcome],
      ),
  }

  assert.deepEqual(
    await executeCategoryAction({
      ...dependencies,
      authorize: async () => true,
      parse: () => {
        successCalls.parse += 1
        return { data: 'parsed' }
      },
      mutate: async (data) => {
        successCalls.mutate += 1
        assert.equal(data, 'parsed')
      },
      complete: () => {
        successCalls.complete += 1
      },
      onError: () => ({ error: 'Database error', failureClass: 'database' }),
    }),
    { success: true },
  )
  assert.deepEqual(successCalls, { parse: 1, mutate: 1, complete: 1 })
  assert.deepEqual(logs, [['integration-action', 'success']])

  logs.length = 0
  assert.deepEqual(
    await executeCategoryAction({
      ...dependencies,
      authorize: async () => false,
      parse: () => ({ data: 'not-called' }),
      mutate: async () => undefined,
      complete: () => undefined,
      onError: () => ({ error: 'Database error', failureClass: 'database' }),
    }),
    { error: 'Unauthorized' },
  )
  assert.deepEqual(logs, [['integration-action', 'failure', 'unauthorized']])

  logs.length = 0
  assert.deepEqual(
    await executeCategoryAction({
      ...dependencies,
      authorize: async () => true,
      parse: () => ({ error: 'Invalid data', failureClass: 'validation' }),
      mutate: async () => undefined,
      complete: () => undefined,
      onError: () => ({ error: 'Database error', failureClass: 'database' }),
    }),
    { error: 'Invalid data' },
  )
  assert.deepEqual(logs, [['integration-action', 'failure', 'validation']])

  logs.length = 0
  assert.deepEqual(
    await executeCategoryAction({
      ...dependencies,
      authorize: async () => true,
      parse: () => ({ data: 'parsed' }),
      mutate: async () => {
        throw new Error('database unavailable')
      },
      complete: () =>
        assert.fail('completion must not run after a mutation error'),
      onError: () => ({ error: 'Database error', failureClass: 'database' }),
    }),
    { error: 'Database error' },
  )
  assert.deepEqual(logs, [['integration-action', 'failure', 'database']])

  logs.length = 0
  assert.deepEqual(
    await executeCategoryAction({
      ...dependencies,
      authorize: async () => true,
      parse: () => ({ data: 'saved' }),
      mutate: async () => undefined,
      complete: () => {
        throw new Error('revalidation unavailable')
      },
      onError: () => ({ error: 'Database error', failureClass: 'database' }),
    }),
    { success: true },
  )
  assert.deepEqual(logs, [
    ['integration-action', 'failure', 'completion'],
    ['integration-action', 'success'],
  ])
}

async function main() {
  try {
    await checkActionOrchestration()

    const categoryInput = {
      name: `integration-${run}`,
      slug: `integration-${run}`,
      image: 'https://invalid.example/category',
      imageKey: `${run}-category`,
    }
    let category: Awaited<ReturnType<typeof createCategory>> | undefined
    const categoryLogs: unknown[] = []
    const categoryCreateRevalidations: string[] = []
    assert.deepEqual(
      await executeCategoryAction({
        action: 'create-category',
        authorize: async () => true,
        unauthorized: { error: 'Unauthorized', failureClass: 'unauthorized' },
        parse: () => ({ data: categoryInput }),
        mutate: async (data) => {
          category = await createCategory(data)
        },
        complete: () => categoryCreateRevalidations.push('/categories'),
        onError: () => ({ error: 'Database error', failureClass: 'database' }),
        log: (...event: unknown[]) => categoryLogs.push(event),
      }),
      { success: true },
    )
    assert.ok(category)
    assert.deepEqual(categoryCreateRevalidations, ['/categories'])
    assert.deepEqual(categoryLogs, [['create-category', 'success']])
    categoryId = category.id
    categoryIds.add(category.id)

    const replacementCategoryImage = {
      image: `https://invalid.example/${run}-category-replacement`,
      imageKey: `${run}-category-replacement`,
    }
    await updateCategory({
      id: category.id,
      expectedUpdatedAt: category.updatedAt,
      name: category.name,
      slug: category.slug,
      imageProvided: true,
      imageKeyProvided: true,
      ...replacementCategoryImage,
    })
    const replacedCategory = await prisma.category.findUniqueOrThrow({
      where: { id: category.id },
      select: { image: true, imageKey: true, updatedAt: true },
    })
    assert.deepEqual(
      {
        image: replacedCategory.image,
        imageKey: replacedCategory.imageKey,
      },
      replacementCategoryImage,
    )

    const categoryToDelete = await createCategory({
      name: `integration-delete-category-${run}`,
      slug: `integration-delete-category-${run}`,
    })
    categoryIds.add(categoryToDelete.id)
    const categoryDeleteLogs: unknown[] = []
    const categoryRevalidations: string[] = []
    const logCategoryDelete = (
      action: string,
      outcome: 'success' | 'failure',
      failureClass?: string,
    ) =>
      categoryDeleteLogs.push(
        failureClass ? [action, outcome, failureClass] : [action, outcome],
      )
    assert.deepEqual(
      await executeCategoryAction({
        action: 'delete-category',
        authorize: async () => true,
        unauthorized: { error: 'Unauthorized', failureClass: 'unauthorized' },
        parse: () => ({ data: categoryToDelete.id }),
        mutate: deleteCategory,
        complete: () => categoryRevalidations.push('/categories'),
        onError: () => ({ error: 'Database error', failureClass: 'database' }),
        log: logCategoryDelete,
      }),
      { success: true },
    )
    assert.deepEqual(categoryRevalidations, ['/categories'])
    assert.deepEqual(categoryDeleteLogs, [['delete-category', 'success']])
    assert.equal(
      await prisma.category.findUnique({ where: { id: categoryToDelete.id } }),
      null,
    )
    assert.deepEqual(
      await executeCategoryAction({
        action: 'delete-category',
        authorize: async () => true,
        unauthorized: { error: 'Unauthorized', failureClass: 'unauthorized' },
        parse: () => ({ data: categoryToDelete.id }),
        mutate: deleteCategory,
        complete: () => categoryRevalidations.push('/unexpected'),
        onError: () => ({ error: 'Database error', failureClass: 'database' }),
        log: logCategoryDelete,
      }),
      { error: 'Database error' },
    )
    assert.deepEqual(categoryRevalidations, ['/categories'])
    assert.deepEqual(categoryDeleteLogs, [
      ['delete-category', 'success'],
      ['delete-category', 'failure', 'database'],
    ])
    categoryIds.delete(categoryToDelete.id)

    await updateCategory({
      id: category.id,
      expectedUpdatedAt: replacedCategory.updatedAt,
      name: category.name,
      slug: category.slug,
      imageProvided: true,
      imageKeyProvided: true,
      image: null,
      imageKey: null,
    })
    assert.deepEqual(
      await prisma.category.findUniqueOrThrow({
        where: { id: category.id },
        select: { image: true, imageKey: true },
      }),
      { image: null, imageKey: null },
    )
    await assert.rejects(
      updateCategory({
        id: category.id,
        expectedUpdatedAt: category.updatedAt,
        name: category.name,
        slug: category.slug,
        imageProvided: false,
        imageKeyProvided: false,
        image: null,
        imageKey: null,
      }),
      { message: CATALOG_MUTATION_ERRORS.staleCategory },
    )

    const unpublished = await createCostume(
      costumeInput('unpublished', { published: false }),
    )
    const costumeDeleteLogs: unknown[] = []
    const costumeRevalidations: string[] = []
    assert.deepEqual(
      await executeCostumeAction({
        action: 'delete-costume',
        authorize: async () => true,
        unauthorized: { error: 'Unauthorized', failureClass: 'unauthorized' },
        parse: () => ({ data: unpublished.id }),
        mutate: deleteCostume,
        complete: () => costumeRevalidations.push('/costumes'),
        onError: () => ({ error: 'Database error', failureClass: 'database' }),
        log: (...event: unknown[]) => costumeDeleteLogs.push(event),
      }),
      { success: true },
    )
    assert.deepEqual(costumeRevalidations, ['/costumes'])
    assert.deepEqual(costumeDeleteLogs, [['delete-costume', 'success']])
    assert.equal(
      await prisma.costume.findUnique({ where: { id: unpublished.id } }),
      null,
    )
    const unpublishedForChecks = await createCostume(
      costumeInput('unpublished-checks', { published: false }),
    )
    assert.equal(await getCostumeBySlug(unpublishedForChecks.slug), null)
    assert.equal(
      (await getCostumeBySlug(unpublishedForChecks.slug, true))?.id,
      unpublishedForChecks.id,
    )
    assert.deepEqual(
      (
        await prisma.costume.findUniqueOrThrow({
          where: { id: unpublishedForChecks.id },
          include: { images: { orderBy: { order: 'asc' } } },
        })
      ).images.map((image) => image.key),
      [`${run}-unpublished-checks-b`, `${run}-unpublished-checks-a`],
    )
    const replacementImages = [
      {
        url: `https://invalid.example/${run}-replacement-second`,
        key: `${run}-replacement-second`,
      },
      {
        url: `https://invalid.example/${run}-replacement-first`,
        key: `${run}-replacement-first`,
      },
    ]
    await updateCostume({
      ...costumeInput('unpublished-checks'),
      id: unpublishedForChecks.id,
      expectedUpdatedAt: unpublishedForChecks.updatedAt,
      images: replacementImages,
    })
    assert.deepEqual(
      (
        await prisma.costume.findUniqueOrThrow({
          where: { id: unpublishedForChecks.id },
          include: { images: { orderBy: { order: 'asc' } } },
        })
      ).images.map((image) => image.key),
      [`${run}-replacement-second`, `${run}-replacement-first`],
    )
    await assert.rejects(
      updateCostume({
        ...costumeInput('unpublished'),
        id: unpublishedForChecks.id,
        expectedUpdatedAt: unpublishedForChecks.updatedAt,
      }),
      { message: CATALOG_MUTATION_ERRORS.staleCostume },
    )

    const featuredCount = await prisma.costume.count({
      where: { featured: true, published: true },
    })
    assert.ok(
      featuredCount <= 9,
      'featured published count already exceeds the nine-fixture baseline',
    )
    for (let index = featuredCount; index < 9; index++) {
      await createCostume(costumeInput(`featured-${index}`, { featured: true }))
    }

    const concurrent = await Promise.allSettled([
      createCostume({
        ...costumeInput('concurrent-a', { featured: true }),
      }),
      createCostume({
        ...costumeInput('concurrent-b', { featured: true }),
      }),
    ])
    const successfulCreates = concurrent.filter(
      (result) => result.status === 'fulfilled',
    )
    const failedCreates = concurrent.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    assert.equal(successfulCreates.length, 1)
    assert.equal(failedCreates.length, 1)
    assert.ok(
      isExpectedFeaturedConflict(failedCreates[0].reason),
      `unexpected concurrent result: ${
        failedCreates[0].reason instanceof Error
          ? `${failedCreates[0].reason.name}: ${failedCreates[0].reason.message}`
          : String(failedCreates[0].reason)
      }`,
    )
    assert.equal(
      await prisma.costume.count({
        where: { featured: true, published: true },
      }),
      10,
    )

    console.info('catalog integration checks passed')
  } finally {
    try {
      const ids = [...categoryIds]
      await prisma.costume.deleteMany({ where: { categoryId: { in: ids } } })
      await prisma.category.deleteMany({ where: { id: { in: ids } } })
    } finally {
      await prisma.$disconnect()
    }
  }
}

void main()
