'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { verifySession } from '@/lib/auth'
import {
  costumeRevalidationPaths,
  parseUploadedImages,
} from '@/lib/catalog-safeguards'
import { logActionOutcome } from '@/lib/action-logging'
import {
  executeCostumeAction,
  type ActionFailure,
  type ActionResult,
} from '@/lib/catalog-action-orchestration'
import {
  CATALOG_MUTATION_ERRORS,
  createCostume,
  deleteCostume,
  isTransactionConflict,
  updateCostume,
} from '@/lib/catalog-mutations'
import prisma from '@/lib/db'

const STALE_COSTUME_ERROR =
  'El disfraz fue actualizado por otra sesión. Recarga e inténtalo de nuevo.'

const costumeSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es muy largo'),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  price: z.coerce.number().int().min(0, 'El precio debe ser mayor o igual a 0'),
  estimatedTime: z.string().min(1, 'El tiempo estimado es requerido'),
  audience: z.enum(['KIDS', 'ADULTS', 'ALL']),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  published: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  tags: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    )
    .default([]),
})

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  const isValid = await verifySession(session?.value)
  return isValid
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

const unauthorized: ActionFailure = {
  error: 'No autorizado',
  failureClass: 'unauthorized',
}

function revalidateCostumePaths() {
  revalidatePath('/')
  revalidatePath('/costumes')
  revalidatePath('/costumes/[slug]', 'page')
  revalidatePath('/admin')
}

export async function createCostumeAction(
  formData: FormData,
): Promise<ActionResult> {
  return executeCostumeAction({
    action: 'create-costume',
    authorize: checkAuth,
    unauthorized,
    parse: () => {
      const parsed = costumeSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        estimatedTime: formData.get('estimatedTime'),
        audience: formData.get('audience'),
        categoryId: formData.get('categoryId'),
        published: formData.get('published') === 'true',
        featured: formData.get('featured') === 'true',
        tags: formData.get('tags') || '',
      })
      if (!parsed.success) {
        return {
          error: parsed.error.issues[0]?.message || 'Datos inválidos',
          failureClass: 'validation',
        }
      }
      const imagesResult = parseUploadedImages(formData.get('images'))
      if ('error' in imagesResult) {
        return { error: imagesResult.error, failureClass: 'validation' }
      }
      if (imagesResult.images.length === 0) {
        return {
          error: 'Debes añadir al menos una imagen',
          failureClass: 'validation',
        }
      }
      return {
        data: {
          id: (formData.get('id') as string | null) || undefined,
          ...parsed.data,
          slug: slugify(parsed.data.name),
          images: imagesResult.images,
        },
      }
    },
    mutate: async (data) => {
      if (await prisma.costume.findUnique({ where: { slug: data.slug } })) {
        return {
          error: 'Ya existe un disfraz con un nombre similar',
          failureClass: 'conflict',
        }
      }
      await createCostume(data)
    },
    complete: revalidateCostumePaths,
    onError: (error) => {
      if (
        error instanceof Error &&
        error.message === CATALOG_MUTATION_ERRORS.featuredLimit
      ) {
        return {
          error: 'Límite alcanzado: máximo 10 disfraces destacados',
          failureClass: 'conflict',
        }
      }
      if (isTransactionConflict(error)) {
        return { error: STALE_COSTUME_ERROR, failureClass: 'conflict' }
      }
      return {
        error: 'Error interno del servidor al crear el disfraz',
        failureClass: 'database',
      }
    },
    log: logActionOutcome,
  })
}

export async function updateCostumeAction(
  formData: FormData,
): Promise<ActionResult> {
  return executeCostumeAction({
    action: 'update-costume',
    authorize: checkAuth,
    unauthorized,
    parse: () => {
      const id = formData.get('id') as string
      const expectedUpdatedAt = new Date(formData.get('updatedAt') as string)
      if (!id) {
        return {
          error: 'ID de disfraz no proporcionado',
          failureClass: 'validation',
        }
      }
      if (Number.isNaN(expectedUpdatedAt.getTime())) {
        return { error: 'Datos inválidos', failureClass: 'validation' }
      }
      const parsed = costumeSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        estimatedTime: formData.get('estimatedTime'),
        audience: formData.get('audience'),
        categoryId: formData.get('categoryId'),
        published: formData.get('published') === 'true',
        featured: formData.get('featured') === 'true',
        tags: formData.get('tags') || '',
      })
      if (!parsed.success) {
        return {
          error: parsed.error.issues[0]?.message || 'Datos inválidos',
          failureClass: 'validation',
        }
      }
      const imagesResult = parseUploadedImages(formData.get('images'))
      if ('error' in imagesResult) {
        return { error: imagesResult.error, failureClass: 'validation' }
      }
      if (imagesResult.images.length === 0) {
        return {
          error: 'Debes añadir al menos una imagen',
          failureClass: 'validation',
        }
      }
      return {
        data: {
          id,
          expectedUpdatedAt,
          ...parsed.data,
          slug: slugify(parsed.data.name),
          images: imagesResult.images,
        },
      }
    },
    mutate: async (
      data,
    ): Promise<ActionFailure | { oldSlug: string; slug: string }> => {
      if (
        await prisma.costume.findFirst({
          where: { slug: data.slug, id: { not: data.id } },
        })
      ) {
        return {
          error: 'Ya existe otro disfraz con un nombre similar',
          failureClass: 'conflict',
        }
      }
      const { oldSlug } = await updateCostume(data)
      return { oldSlug, slug: data.slug }
    },
    complete: ({ oldSlug, slug }) => {
      revalidateCostumePaths()
      costumeRevalidationPaths(oldSlug, slug).forEach((path) =>
        revalidatePath(path),
      )
    },
    onError: (error) => {
      if (
        error instanceof Error &&
        error.message === CATALOG_MUTATION_ERRORS.featuredLimit
      ) {
        return {
          error: 'Límite alcanzado: máximo 10 disfraces destacados',
          failureClass: 'conflict',
        }
      }
      if (
        error instanceof Error &&
        (error.message === CATALOG_MUTATION_ERRORS.staleCostume ||
          isTransactionConflict(error))
      ) {
        return { error: STALE_COSTUME_ERROR, failureClass: 'conflict' }
      }
      if (
        error instanceof Error &&
        error.message === CATALOG_MUTATION_ERRORS.costumeNotFound
      ) {
        return { error: 'Disfraz no encontrado', failureClass: 'not_found' }
      }
      return {
        error: 'Error interno del servidor al actualizar el disfraz',
        failureClass: 'database',
      }
    },
    log: logActionOutcome,
  })
}

export async function deleteCostumeAction(id: string): Promise<ActionResult> {
  return executeCostumeAction({
    action: 'delete-costume',
    authorize: checkAuth,
    unauthorized,
    parse: () => ({ data: id }),
    mutate: deleteCostume,
    complete: revalidateCostumePaths,
    onError: () => ({
      error: 'Error interno del servidor al eliminar el disfraz',
      failureClass: 'database',
    }),
    log: logActionOutcome,
  })
}
