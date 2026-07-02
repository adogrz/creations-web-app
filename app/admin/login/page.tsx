import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Acceso — Estudio Creations',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground">
            C
          </span>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Estudio Creations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accede para administrar el catálogo.</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
