import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/admin-nav'

export const metadata: Metadata = {
  title: 'Estudio — Creations Admin',
  description: 'Administra tu catálogo de disfraces artesanales.',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-muted/30">
      <AdminNav />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground">
              C
            </span>
            <span className="font-heading text-base font-semibold">Estudio</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground">
            Ver sitio
          </Link>
        </header>
        <div className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</div>
      </div>
    </div>
  )
}
