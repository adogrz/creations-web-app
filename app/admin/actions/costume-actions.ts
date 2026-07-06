'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/db'
import { verifySession } from '@/lib/auth'
import { deleteImageAction } from './upload-actions'

const costumeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  shortDescription: z.string().min(1, 'La descripción corta es requerida'),
  description: z.string().min(1, 'La descripción completa es requerida'),
  priceMin: z.coerce.number().int().min(0, 'El precio mínimo debe ser mayor o igual a 0'),
  priceMax: z.coerce.number().int().min(0, 'El precio máximo debe ser mayor o igual a 0'),
  estimatedTime: z.string().min(1, 'El tiempo estimado es requerido'),
  audience: z.enum(['KIDS', 'ADULTS', 'ALL']),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  published: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  tags: z.string().transform(val => 
    val.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
  ).default(''),
})

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  const isValid = await verifySession(session?.value)
  if (!isValid) {
    throw new Error('No autorizado')
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createCostumeAction(formData: FormData) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  const rawData = {
    name: formData.get('name'),
    shortDescription: formData.get('shortDescription'),
    description: formData.get('description'),
    priceMin: formData.get('priceMin'),
    priceMax: formData.get('priceMax'),
    estimatedTime: formData.get('estimatedTime'),
    audience: formData.get('audience'),
    categoryId: formData.get('categoryId'),
    published: formData.get('published') === 'true',
    featured: formData.get('featured') === 'true',
    tags: formData.get('tags') || '',
  }

  const parsed = costumeSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const imagesRaw = formData.get('images') as string
  const imagesList = JSON.parse(imagesRaw || '[]') as { url: string; key: string; alt?: string }[]

  if (imagesList.length === 0) {
    return { error: 'Debes añadir al menos una imagen' }
  }

  const slug = slugify(parsed.data.name)

  try {
    // Verificar duplicado de slug
    const exists = await prisma.costume.findUnique({ where: { slug } })
    if (exists) {
      return { error: 'Ya existe un disfraz con un nombre similar' }
    }

    // Verificar límite de destacados si corresponde
    if (parsed.data.featured && parsed.data.published) {
      const featuredCount = await prisma.costume.count({
        where: { featured: true, published: true }
      })
      if (featuredCount >= 10) {
        return { error: 'Límite alcanzado: máximo 10 disfraces destacados' }
      }
    }

    const id = formData.get('id') as string | null

    // Guardar en base de datos mediante transacción
    await prisma.$transaction(async (tx) => {
      const costume = await tx.costume.create({
        data: {
          id: id || undefined,
          name: parsed.data.name,
          slug,
          shortDescription: parsed.data.shortDescription,
          description: parsed.data.description,
          priceMin: parsed.data.priceMin,
          priceMax: parsed.data.priceMax,
          estimatedTime: parsed.data.estimatedTime,
          audience: parsed.data.audience,
          tags: parsed.data.tags,
          published: parsed.data.published,
          featured: parsed.data.featured,
          categoryId: parsed.data.categoryId,
        }
      })

      // Insertar imágenes asociadas
      await tx.image.createMany({
        data: imagesList.map((img, i) => ({
          url: img.url,
          key: img.key,
          alt: img.alt || parsed.data.name,
          order: i,
          costumeId: costume.id
        }))
      })
    })

    revalidatePath('/')
    revalidatePath('/costumes')
    revalidatePath('/costumes/[slug]')
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error al crear disfraz:', error)
    return { error: 'Error interno del servidor al crear el disfraz' }
  }
}

export async function updateCostumeAction(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) {
    return { error: 'ID de disfraz no proporcionado' }
  }
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  const rawData = {
    name: formData.get('name'),
    shortDescription: formData.get('shortDescription'),
    description: formData.get('description'),
    priceMin: formData.get('priceMin'),
    priceMax: formData.get('priceMax'),
    estimatedTime: formData.get('estimatedTime'),
    audience: formData.get('audience'),
    categoryId: formData.get('categoryId'),
    published: formData.get('published') === 'true',
    featured: formData.get('featured') === 'true',
    tags: formData.get('tags') || '',
  }

  const parsed = costumeSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const imagesRaw = formData.get('images') as string
  const imagesList = JSON.parse(imagesRaw || '[]') as { id?: string; url: string; key: string; alt?: string }[]

  if (imagesList.length === 0) {
    return { error: 'Debes añadir al menos una imagen' }
  }

  const slug = slugify(parsed.data.name)

  try {
    // Verificar duplicado de slug
    const exists = await prisma.costume.findFirst({
      where: {
        slug,
        id: { not: id }
      }
    })
    if (exists) {
      return { error: 'Ya existe otro disfraz con un nombre similar' }
    }

    // Verificar límite de destacados si se activó
    if (parsed.data.featured && parsed.data.published) {
      const featuredCount = await prisma.costume.count({
        where: {
          featured: true,
          published: true,
          id: { not: id }
        }
      })
      if (featuredCount >= 10) {
        return { error: 'Límite alcanzado: máximo 10 disfraces destacados' }
      }
    }

    // Obtener imágenes actuales en la base de datos
    const currentImages = await prisma.image.findMany({
      where: { costumeId: id }
    })

    // Encontrar imágenes que fueron eliminadas del formulario para borrarlas de R2
    const keepKeys = new Set(imagesList.map(img => img.key))
    const deleteImages = currentImages.filter(img => !keepKeys.has(img.key))

    for (const img of deleteImages) {
      await deleteImageAction(img.key)
    }

    // Guardar actualización mediante transacción
    await prisma.$transaction(async (tx) => {
      await tx.costume.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug,
          shortDescription: parsed.data.shortDescription,
          description: parsed.data.description,
          priceMin: parsed.data.priceMin,
          priceMax: parsed.data.priceMax,
          estimatedTime: parsed.data.estimatedTime,
          audience: parsed.data.audience,
          tags: parsed.data.tags,
          published: parsed.data.published,
          featured: parsed.data.featured,
          categoryId: parsed.data.categoryId,
        }
      })

      // Eliminar registros viejos de imágenes en la BD y recrear la galería actualizada
      await tx.image.deleteMany({
        where: { costumeId: id }
      })

      await tx.image.createMany({
        data: imagesList.map((img, i) => ({
          url: img.url,
          key: img.key,
          alt: img.alt || parsed.data.name,
          order: i,
          costumeId: id
        }))
      })
    })

    revalidatePath('/')
    revalidatePath('/costumes')
    revalidatePath('/costumes/[slug]')
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error al actualizar disfraz:', error)
    return { error: 'Error interno del servidor al actualizar el disfraz' }
  }
}

export async function deleteCostumeAction(id: string) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  try {
    const currentImages = await prisma.image.findMany({
      where: { costumeId: id }
    })

    // Borrar imágenes de R2 en paralelo
    await Promise.all(
      currentImages.map(img => deleteImageAction(img.key))
    )

    // Borrar de la base de datos (las imágenes asociadas se borrarán en cascada)
    await prisma.costume.delete({
      where: { id }
    })

    revalidatePath('/')
    revalidatePath('/costumes')
    revalidatePath('/costumes/[slug]')
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error al eliminar disfraz:', error)
    return { error: 'Error interno del servidor al eliminar el disfraz' }
  }
}
