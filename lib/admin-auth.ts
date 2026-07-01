'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'creations2024'
const SESSION_COOKIE = 'admin-session'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string

  if (!password || password !== ADMIN_PASSWORD) {
    redirect('/admin/login?error=1')
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  redirect('/admin')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/admin/login')
}
