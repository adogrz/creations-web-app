import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, LogOut } from 'lucide-react'
import { AdminNav } from '@/components/admin/admin-nav'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/app/admin/actions/auth-actions'

export const metadata: Metadata = {
  title: 'Estudio — Creations Admin',
  description: 'Administra tu catálogo de disfraces artesanales.',
}

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-dvh">
      <AdminNav />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header visible en todas las pantallas */}
        <header className="border-border bg-background flex h-14 items-center justify-between border-b px-4">
          {/* Logo visible solo en móvil */}
          <Link href="/admin" className="flex items-center gap-2 md:hidden">
            <div className="bg-primary flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <Image
                src="/creations-logo.webp"
                alt="Creations logo"
                width={28}
                height={28}
                className="size-full object-cover"
              />
            </div>
            <span className="font-heading text-base font-semibold">
              Estudio
            </span>
          </Link>

          {/* Espaciador oculto en móvil, visible en escritorio */}
          <div className="hidden md:block" />

          {/* Acciones del panel */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-muted-foreground hover:bg-muted hover:text-foreground border-border flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-[color,background-color]"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Volver al sitio
            </Link>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                className="text-muted-foreground hover:bg-muted hover:text-foreground border-border flex h-auto items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-[color,background-color]"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </header>
        <div className="flex-1 p-4 pb-28 sm:p-6 md:pb-6">{children}</div>
      </div>
    </div>
  )
}
