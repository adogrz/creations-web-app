'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/db'
import { verifySession } from '@/lib/auth'
import { deleteImageAction } from './upload-actions'

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre es muy largo'),
  description: z.string().max(200, 'La descripción es muy larga').optional().nullable(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
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

export async function createCategoryAction(formData: FormData) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const image = formData.get('image') as string
  const imageKey = formData.get('imageKey') as string

  const parsed = categorySchema.safeParse({ name, description, image, imageKey })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const slug = slugify(parsed.data.name)

  const id = formData.get('id') as string | null

  try {
    // Verificar duplicado de slug
    const exists = await prisma.category.findUnique({
      where: { slug }
    })
    if (exists) {
      return { error: 'Ya existe una categoría con un nombre similar' }
    }

    await prisma.category.create({
      data: {
        id: id || undefined,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        image: parsed.data.image,
        imageKey: parsed.data.imageKey,
      }
    })

    revalidatePath('/')
    revalidatePath('/categories')
    revalidatePath('/costumes')
    revalidatePath('/admin/categories')

    return { success: true }
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return { error: 'Error interno del servidor al crear la categoría' }
  }
}

export async function updateCategoryAction(id: string, formData: FormData) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const image = formData.get('image') as string
  const imageKey = formData.get('imageKey') as string

  const parsed = categorySchema.safeParse({ name, description, image, imageKey })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const slug = slugify(parsed.data.name)

  try {
    // Verificar duplicado de slug (excluyendo la actual)
    const exists = await prisma.category.findFirst({
      where: {
        slug,
        id: { not: id }
      }
    })
    if (exists) {
      return { error: 'Ya existe otra categoría con un nombre similar' }
    }

    // Obtener la categoría actual para verificar si cambió la imagen
    const current = await prisma.category.findUnique({
      where: { id }
    })

    // Si cambió la imagen y existía una anterior, borrar la anterior de R2
    if (current?.imageKey && parsed.data.imageKey && current.imageKey !== parsed.data.imageKey) {
      await deleteImageAction(current.imageKey)
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        image: parsed.data.image || current?.image,
        imageKey: parsed.data.imageKey || current?.imageKey,
      }
    })

    revalidatePath('/')
    revalidatePath('/categories')
    revalidatePath('/costumes')
    revalidatePath('/admin/categories')

    return { success: true }
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    return { error: 'Error interno del servidor al actualizar la categoría' }
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  try {
    // Validación crítica: verificar si tiene disfraces asociados
    const count = await prisma.costume.count({
      where: { categoryId: id }
    })
    if (count > 0) {
      return { error: 'No se puede eliminar una categoría que tiene disfraces asociados' }
    }

    const current = await prisma.category.findUnique({
      where: { id }
    })

    // Borrar la imagen de R2 si existe
    if (current?.imageKey) {
      await deleteImageAction(current.imageKey)
    }

    await prisma.category.delete({
      where: { id }
    })

    revalidatePath('/')
    revalidatePath('/categories')
    revalidatePath('/costumes')
    revalidatePath('/admin/categories')

    return { success: true }
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return { error: 'Error interno del servidor al eliminar la categoría' }
  }
}
