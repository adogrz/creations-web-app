import type { Metadata } from 'next'
import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Acceso — Estudio Creations',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
            <Image
              src="/creations-logo.webp"
              alt="Creations logo"
              width={48}
              height={48}
              className="object-cover size-full"
            />
          </div>
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
