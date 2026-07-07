import type { Metadata } from 'next'
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Acceso — Estudio Creations',
}

export default function LoginPage() {
  return (
    <main className="bg-muted/30 flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="bg-primary border-background mx-auto mb-4 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 shadow-sm">
            <Image
              src="/creations-logo.webp"
              alt="Creations logo"
              width={96}
              height={96}
              className="size-full object-cover"
            />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Estudio Creations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Accede para administrar el catálogo.
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
