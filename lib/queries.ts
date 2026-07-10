import prisma from '@/lib/db'
import { getCostumePageQuery } from '@/lib/catalog-query'

const DEFAULT_SETTINGS = {
  id: 'singleton',
  whatsappNumber: '50376772999',
  messengerHandle: 'creaciones1.sv',
  instagramHandle: 'creations.sv_',
}

/**
 * Obtiene todas las categorías de la base de datos, ordenadas alfabéticamente
 */
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
}

/**
 * Obtiene la configuración de contacto única (Settings)
 */
export async function getSettings() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    })
    return settings || { ...DEFAULT_SETTINGS, updatedAt: new Date() }
  } catch (error) {
    console.error('Error al obtener settings:', error)
    return { ...DEFAULT_SETTINGS, updatedAt: new Date() }
  }
}

/**
 * Obtiene la lista de disfraces con filtros opcionales (por defecto solo publicados)
 */
export async function getCostumes(options?: {
  categoryId?: string
  categorySlug?: string
  featured?: boolean
  published?: boolean
  limit?: number
}) {
  const publishedFilter =
    options?.published !== undefined ? options.published : true

  const where: any = {}

  if (publishedFilter !== null) {
    where.published = publishedFilter
  }
  if (options?.categoryId) {
    where.categoryId = options.categoryId
  }
  if (options?.categorySlug) {
    where.category = { slug: options.categorySlug }
  }
  if (options?.featured !== undefined) {
    where.featured = options.featured
  }

  return prisma.costume.findMany({
    where,
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
  })
}

/**
 * Obtiene un disfraz detallado por su slug
 */
export async function getCostumeBySlug(slug: string) {
  return prisma.costume.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
      category: true,
    },
  })
}

/**
 * Obtiene los disfraces destacados (máximo 10)
 */
export async function getFeaturedCostumes(limit = 10) {
  return getCostumes({ featured: true, published: true, limit })
}

export async function getCostumePage(options: {
  query?: string
  categorySlug?: string
  page: number
  pageSize: number
}) {
  const { skip, take, where } = getCostumePageQuery(options)

  const [total, costumes] = await prisma.$transaction([
    prisma.costume.count({ where }),
    prisma.costume.findMany({
      where,
      include: {
        images: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
          take: 1,
        },
        category: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
  ])

  return { costumes, total }
}

/**
 * Obtiene disfraces relacionados (mismo tipo de categoría, excluyendo el actual)
 */
export async function getRelatedCostumes(options: {
  costumeId: string
  categoryId: string
  limit?: number
}) {
  const limit = options.limit ?? 4
  return prisma.costume.findMany({
    where: {
      categoryId: options.categoryId,
      id: { not: options.costumeId },
      published: true,
    },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
