import prisma from '@/lib/db'
import {
  canFeatureCostume,
  isStaleWrite,
  orderedImages,
  resolveCategoryImage,
  type UploadedImage,
} from '@/lib/catalog-safeguards'

export const CATALOG_MUTATION_ERRORS = {
  categoryNotFound: 'CATEGORY_NOT_FOUND',
  costumeNotFound: 'COSTUME_NOT_FOUND',
  staleCategory: 'STALE_CATEGORY',
  staleCostume: 'STALE_COSTUME',
  featuredLimit: 'FEATURED_LIMIT',
} as const

// Must match the cleanup job's session lock; xact locks prevent reference commits
// after cleanup has checked a candidate.
export const CATALOG_IMAGE_REFERENCE_ADVISORY_LOCK_KEY = '482912076143587201'

async function lockImageReferences(tx: {
  $executeRawUnsafe: (query: string) => Promise<unknown>
}) {
  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(${CATALOG_IMAGE_REFERENCE_ADVISORY_LOCK_KEY})`,
  )
}

export function isTransactionConflict(error: unknown) {
  return (
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2034') ||
    (error instanceof Error &&
      error.message.includes('TransactionWriteConflict'))
  )
}

export async function createCategory(input: {
  id?: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  imageKey?: string | null
}) {
  return prisma.$transaction(async (tx) => {
    await lockImageReferences(tx)
    return tx.category.create({ data: input })
  })
}

export async function updateCategory(input: {
  id: string
  expectedUpdatedAt: Date
  name: string
  slug: string
  description?: string | null
  imageProvided: boolean
  imageKeyProvided: boolean
  image: string | null
  imageKey: string | null
}) {
  return prisma.$transaction(
    async (tx) => {
      await lockImageReferences(tx)
      const current = await tx.category.findUnique({
        where: { id: input.id },
        select: { image: true, imageKey: true, updatedAt: true },
      })
      if (!current) throw new Error(CATALOG_MUTATION_ERRORS.categoryNotFound)
      if (isStaleWrite(input.expectedUpdatedAt, current.updatedAt)) {
        throw new Error(CATALOG_MUTATION_ERRORS.staleCategory)
      }

      const image = resolveCategoryImage(
        input.imageProvided,
        input.imageKeyProvided,
        input.image,
        input.imageKey,
        current,
      )
      const updated = await tx.category.updateMany({
        where: { id: input.id, updatedAt: input.expectedUpdatedAt },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          image: image.image,
          imageKey: image.imageKey,
        },
      })
      if (updated.count === 0) {
        throw new Error(CATALOG_MUTATION_ERRORS.staleCategory)
      }
    },
    { isolationLevel: 'Serializable' },
  )
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } })
}

export async function createCostume(input: {
  id?: string
  name: string
  slug: string
  description?: string | null
  price: number
  estimatedTime: string
  audience: 'KIDS' | 'ADULTS' | 'ALL'
  tags: string[]
  published: boolean
  featured: boolean
  categoryId: string
  images: UploadedImage[]
}) {
  return prisma.$transaction(
    async (tx) => {
      await lockImageReferences(tx)
      if (input.featured && input.published) {
        const featuredCount = await tx.costume.count({
          where: { featured: true, published: true },
        })
        if (!canFeatureCostume(featuredCount)) {
          throw new Error(CATALOG_MUTATION_ERRORS.featuredLimit)
        }
      }

      const costume = await tx.costume.create({
        data: {
          id: input.id,
          name: input.name,
          slug: input.slug,
          description: input.description,
          price: input.price,
          estimatedTime: input.estimatedTime,
          audience: input.audience,
          tags: input.tags,
          published: input.published,
          featured: input.featured,
          categoryId: input.categoryId,
        },
      })
      await tx.image.createMany({
        data: orderedImages(input.images).map((image) => ({
          url: image.url,
          key: image.key,
          alt: image.alt || input.name,
          order: image.order,
          costumeId: costume.id,
        })),
      })
      return costume
    },
    { isolationLevel: 'Serializable' },
  )
}

export async function updateCostume(input: {
  id: string
  expectedUpdatedAt: Date
  name: string
  slug: string
  description?: string | null
  price: number
  estimatedTime: string
  audience: 'KIDS' | 'ADULTS' | 'ALL'
  tags: string[]
  published: boolean
  featured: boolean
  categoryId: string
  images: UploadedImage[]
}) {
  return prisma.$transaction(
    async (tx) => {
      await lockImageReferences(tx)
      const current = await tx.costume.findUnique({
        where: { id: input.id },
        select: { slug: true, updatedAt: true },
      })
      if (!current) throw new Error(CATALOG_MUTATION_ERRORS.costumeNotFound)
      if (isStaleWrite(input.expectedUpdatedAt, current.updatedAt)) {
        throw new Error(CATALOG_MUTATION_ERRORS.staleCostume)
      }

      if (input.featured && input.published) {
        const featuredCount = await tx.costume.count({
          where: { featured: true, published: true, id: { not: input.id } },
        })
        if (!canFeatureCostume(featuredCount)) {
          throw new Error(CATALOG_MUTATION_ERRORS.featuredLimit)
        }
      }

      if (current.slug !== input.slug) {
        await tx.slugRedirect.deleteMany({ where: { oldSlug: input.slug } })
        await tx.slugRedirect.upsert({
          where: { oldSlug: current.slug },
          update: { costumeId: input.id },
          create: { oldSlug: current.slug, costumeId: input.id },
        })
      }

      const updated = await tx.costume.updateMany({
        where: { id: input.id, updatedAt: input.expectedUpdatedAt },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          price: input.price,
          estimatedTime: input.estimatedTime,
          audience: input.audience,
          tags: input.tags,
          published: input.published,
          featured: input.featured,
          categoryId: input.categoryId,
        },
      })
      if (updated.count === 0) {
        throw new Error(CATALOG_MUTATION_ERRORS.staleCostume)
      }

      await tx.image.deleteMany({ where: { costumeId: input.id } })
      await tx.image.createMany({
        data: orderedImages(input.images).map((image) => ({
          url: image.url,
          key: image.key,
          alt: image.alt || input.name,
          order: image.order,
          costumeId: input.id,
        })),
      })
      return { oldSlug: current.slug }
    },
    { isolationLevel: 'Serializable' },
  )
}

export async function deleteCostume(id: string) {
  return prisma.costume.delete({ where: { id } })
}
