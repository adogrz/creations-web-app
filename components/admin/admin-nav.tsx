'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  PlusCircle,
  Shirt,
  ArrowLeft,
  FolderOpen,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin', label: 'Panel', icon: LayoutGrid, exact: true },
  { href: '/admin/costumes', label: 'Disfraces', icon: Shirt, exact: false },
  {
    href: '/admin/categories',
    label: 'Categorías',
    icon: FolderOpen,
    exact: false,
  },
  {
    href: '/admin/costumes/new',
    label: 'Nuevo',
    icon: PlusCircle,
    exact: false,
  },
  { href: '/admin/settings', label: 'Config.', icon: Settings, exact: false },
]

export function AdminNav() {
  const pathname = usePathname()
  const isActive = (href: string, exact: boolean) => {
    const matches = exact ? pathname === href : pathname.startsWith(href)
    if (!matches) return false

    // Check if there is another item that also matches and has a longer href
    const hasBetterMatch = items.some((item) => {
      if (item.href === href) return false
      const itemMatches = item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href)
      return itemMatches && item.href.length > href.length
    })

    return !hasBetterMatch
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="border-border bg-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r p-5 md:flex"
        aria-label="Admin sidebar"
      >
        <Link href="/admin" className="flex items-center gap-2">
          <div className="bg-primary flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
            <Image
              src="/creations-logo.webp"
              alt="Creations logo"
              width={32}
              height={32}
              className="size-full object-cover"
            />
          </div>
          <span className="font-heading text-lg font-semibold">Studio</span>
        </Link>

        <nav
          className="mt-8 flex flex-col gap-1"
          aria-label="Admin sidebar navigation"
        >
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
      </aside>

      {/* Mobile bottom nav — includes all items + back + logout */}
      <nav
        className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md md:hidden"
        aria-label="Admin bottom navigation"
      >
        <div className="flex">
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
        </div>
      </nav>
    </>
  )
}
