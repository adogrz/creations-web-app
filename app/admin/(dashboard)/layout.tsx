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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-muted/30">
      <AdminNav />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header visible en todas las pantallas */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
          {/* Logo visible solo en móvil */}
          <Link href="/admin" className="flex items-center gap-2 md:hidden">
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
              <Image
                src="/creations-logo.webp"
                alt="Creations logo"
                width={28}
                height={28}
                className="object-cover size-full"
              />
            </div>
            <span className="font-heading text-base font-semibold">Estudio</span>
          </Link>
          
          {/* Espaciador oculto en móvil, visible en escritorio */}
          <div className="hidden md:block" />

          {/* Acciones del panel */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-[color,background-color] border border-border"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Volver al sitio
            </Link>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-[color,background-color] border border-border h-auto"
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
