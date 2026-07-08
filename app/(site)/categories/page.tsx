import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import prisma from '@/lib/db'

export const metadata: Metadata = {
  title: 'Categorías',
  description:
    'Explora nuestras categorías de disfraces hechos a mano: fantasía, cosplay, época, personajes infantiles y más confecciones a medida.',
  alternates: {
    canonical: '/categories',
  },
  openGraph: {
    type: 'website',
    url: '/categories',
    title: 'Categorías de Disfraces | Creations',
    description:
      'Explora nuestras categorías de disfraces hechos a mano: fantasía, cosplay, época, personajes infantiles y más confecciones a medida.',
  },
}

export default async function CategoriesPage() {
  let categoriesWithCounts: any[] = []
  try {
    categoriesWithCounts = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            costumes: {
              where: { published: true },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error('Error al obtener categorías con conteos en build:', error)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Categorías
        </h1>
        <p className="text-muted-foreground mt-3 text-lg text-pretty">
          Desde cuentos de hadas hasta ciencia ficción, encuentra el estilo que
          despierte tu imaginación.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesWithCounts.map((category) => {
          const count = category._count.costumes
          return (
            <Link
              key={category.slug}
              href={`/costumes?category=${category.slug}`}
              className="group flex flex-col"
            >
              <div className="bg-muted ring-foreground/5 relative aspect-16/10 overflow-hidden rounded-[2.5rem] rounded-tr-none ring-1">
                <Image
                  src={category.image || '/placeholder.svg'}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-102"
                />
              </div>
              <div className="mt-4 flex flex-col gap-1 px-2">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-heading text-foreground group-hover:text-primary text-xl font-medium transition-colors duration-200">
                    {category.name}
                  </h2>
                  <ArrowUpRight
                    className="text-muted-foreground/60 group-hover:text-primary mt-1 size-4 shrink-0 transition-[color] duration-200"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                  {category.description}
                </p>
                <span className="text-primary/80 mt-1.5 text-xs font-semibold tabular-nums">
                  {count} {count === 1 ? 'creación' : 'creaciones'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
