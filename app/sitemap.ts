import type { MetadataRoute } from 'next'
import prisma from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'https://creations.adogrz.com'

  let costumes: { slug: string; updatedAt: Date }[] = []
  let categories: { slug: string; updatedAt: Date }[] = []

  try {
    // Obtener disfraces publicados y categorías de la base de datos
    const [dbCostumes, dbCategories] = await Promise.all([
      prisma.costume.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ])
    costumes = dbCostumes
    categories = dbCategories
  } catch (error) {
    console.error('Error al generar sitemap.ts:', error)
  }

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/costumes`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  const costumeUrls = costumes.map((c) => ({
    url: `${baseUrl}/costumes/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/costumes?category=${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticUrls, ...costumeUrls, ...categoryUrls]
}
