'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, PlusCircle, Shirt, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin', label: 'Panel', icon: LayoutGrid, exact: true },
  { href: '/admin/costumes', label: 'Disfraces', icon: Shirt, exact: false },
  { href: '/admin/costumes/new', label: 'Nuevo', icon: PlusCircle, exact: false },
]

export function AdminNav() {
  const pathname = usePathname()
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-sidebar p-5 md:flex" aria-label="Admin sidebar">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-heading text-sm font-bold">
            C
          </span>
          <span className="font-heading text-lg font-semibold">Studio</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Admin sidebar navigation">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[color,background-color]',
                isActive(item.href, item.exact)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-[color,background-color]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al sitio
        </Link>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-md md:hidden" aria-label="Admin bottom navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-[color]',
              isActive(item.href, item.exact)
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
