'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/db'
import { verifySession } from '@/lib/auth'

const settingsSchema = z.object({
  whatsappNumber: z.string().min(1, 'El número de WhatsApp es requerido').regex(/^\d+$/, 'El número de WhatsApp solo debe contener dígitos'),
  messengerHandle: z.string().min(1, 'El usuario de Messenger es requerido'),
  instagramHandle: z.string().transform(val => val.trim() === '' ? null : val).nullable().optional(),
})

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  const isValid = await verifySession(session?.value)
  if (!isValid) {
    throw new Error('No autorizado')
  }
}

export async function updateSettingsAction(prevState: any, formData: FormData) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  const rawData = {
    whatsappNumber: formData.get('whatsappNumber'),
    messengerHandle: formData.get('messengerHandle'),
    instagramHandle: formData.get('instagramHandle'),
  }

  const parsed = settingsSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  try {
    await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        whatsappNumber: parsed.data.whatsappNumber,
        messengerHandle: parsed.data.messengerHandle,
        instagramHandle: parsed.data.instagramHandle || null,
      },
      create: {
        id: 'singleton',
        whatsappNumber: parsed.data.whatsappNumber,
        messengerHandle: parsed.data.messengerHandle,
        instagramHandle: parsed.data.instagramHandle || null,
      },
    })

    revalidatePath('/')
    revalidatePath('/costumes')
    revalidatePath('/costumes/[slug]')

    return { success: true }
  } catch (error) {
    console.error('Error al actualizar settings:', error)
    return { error: 'Error interno del servidor al guardar configuraciones' }
  }
}
