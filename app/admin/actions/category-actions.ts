'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { verifySession } from '@/lib/auth'
import { logActionOutcome } from '@/lib/action-logging'
import {
  executeCategoryAction,
  type ActionFailure,
  type ActionResult,
} from '@/lib/catalog-action-orchestration'
import {
  CATALOG_MUTATION_ERRORS,
  createCategory,
  deleteCategory,
  isTransactionConflict,
  updateCategory,
} from '@/lib/catalog-mutations'
import prisma from '@/lib/db'

const STALE_CATEGORY_ERROR =
  'La categoría fue actualizada por otra sesión. Recarga e inténtalo de nuevo.'

const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre es muy largo'),
  description: z
    .string()
    .max(200, 'La descripción es muy larga')
    .optional()
    .nullable(),
  image: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
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

function revalidateCategoryPaths() {
  revalidatePath('/')
  revalidatePath('/categories')
  revalidatePath('/costumes')
  revalidatePath('/(site)/costumes/[slug]', 'page')
  revalidatePath('/admin/categories')
}

export async function createCategoryAction(
  formData: FormData,
): Promise<ActionResult> {
  return executeCategoryAction({
    action: 'create-category',
    authorize: checkAuth,
    unauthorized,
    parse: () => {
      const parsed = categorySchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        image: formData.get('image'),
        imageKey: formData.get('imageKey'),
      })
      if (!parsed.success) {
        return {
          error: parsed.error.issues[0]?.message || 'Datos inválidos',
          failureClass: 'validation',
        }
      }
      return {
        data: {
          id: (formData.get('id') as string | null) || undefined,
          ...parsed.data,
          slug: slugify(parsed.data.name),
        },
      }
    },
    mutate: async (data) => {
      if (await prisma.category.findUnique({ where: { slug: data.slug } })) {
        return {
          error: 'Ya existe una categoría con un nombre similar',
          failureClass: 'conflict',
        }
      }
      await createCategory(data)
    },
    complete: revalidateCategoryPaths,
    onError: () => ({
      error: 'Error interno del servidor al crear la categoría',
      failureClass: 'database',
    }),
    log: logActionOutcome,
  })
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  return executeCategoryAction({
    action: 'update-category',
    authorize: checkAuth,
    unauthorized,
    parse: () => {
      const expectedUpdatedAt = new Date(formData.get('updatedAt') as string)
      const parsed = categorySchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        image: formData.get('image'),
        imageKey: formData.get('imageKey'),
      })
      if (!parsed.success || Number.isNaN(expectedUpdatedAt.getTime())) {
        return {
          error: parsed.success
            ? 'Datos inválidos'
            : parsed.error.issues[0]?.message || 'Datos inválidos',
          failureClass: 'validation',
        }
      }
      return {
        data: {
          id,
          expectedUpdatedAt,
          ...parsed.data,
          slug: slugify(parsed.data.name),
          imageProvided: formData.has('image'),
          imageKeyProvided: formData.has('imageKey'),
          image: parsed.data.image ?? null,
          imageKey: parsed.data.imageKey ?? null,
        },
      }
    },
    mutate: async (data) => {
      if (
        await prisma.category.findFirst({
          where: { slug: data.slug, id: { not: id } },
        })
      ) {
        return {
          error: 'Ya existe otra categoría con un nombre similar',
          failureClass: 'conflict',
        }
      }
      await updateCategory(data)
    },
    complete: revalidateCategoryPaths,
    onError: (error) => {
      if (
        error instanceof Error &&
        (error.message === CATALOG_MUTATION_ERRORS.staleCategory ||
          isTransactionConflict(error))
      ) {
        return { error: STALE_CATEGORY_ERROR, failureClass: 'conflict' }
      }
      if (
        error instanceof Error &&
        error.message === CATALOG_MUTATION_ERRORS.categoryNotFound
      ) {
        return { error: 'Categoría no encontrada', failureClass: 'not_found' }
      }
      return {
        error: 'Error interno del servidor al actualizar la categoría',
        failureClass: 'database',
      }
    },
    log: logActionOutcome,
  })
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  return executeCategoryAction({
    action: 'delete-category',
    authorize: checkAuth,
    unauthorized,
    parse: () => ({ data: id }),
    mutate: async (categoryId) => {
      if (await prisma.costume.count({ where: { categoryId } })) {
        return {
          error:
            'No se puede eliminar una categoría que tiene disfraces asociados',
          failureClass: 'conflict',
        }
      }
      await deleteCategory(categoryId)
    },
    complete: revalidateCategoryPaths,
    onError: () => ({
      error: 'Error interno del servidor al eliminar la categoría',
      failureClass: 'database',
    }),
    log: logActionOutcome,
  })
}
