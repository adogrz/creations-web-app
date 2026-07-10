import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { cn } from '@/lib/utils'

const layoutConfigs = [
  { span: 'md:col-span-2', aspect: 'aspect-[1.8/1] sm:aspect-[2.1/1]' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
]

const HOME_CATEGORY_LIMIT = 5

export async function CategoryGrid({ className }: { className?: string }) {
  // Consultar categorías incluyendo el conteo de disfraces publicados
  let categoriesWithCounts: any[] = []
  try {
    categoriesWithCounts = await prisma.category.findMany({
      where: {
        costumes: {
          some: { published: true },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: HOME_CATEGORY_LIMIT,
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
    console.error('Error al obtener categorías con conteos en el Grid:', error)
  }

  if (categoriesWithCounts.length === 0) {
    return (
      <div
        className={cn(
          'bg-secondary/40 flex flex-col items-center gap-3 rounded-3xl py-16 text-center',
          className,
        )}
        role="status"
      >
        <p className="font-heading text-xl font-medium">
          Aún no hay categorías disponibles
        </p>
        <p className="text-muted-foreground max-w-xs text-sm">
          Vuelve pronto para descubrir nuevas creaciones.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {categoriesWithCounts.map((category, index) => {
        const count = category._count.costumes
        const config = layoutConfigs[index % layoutConfigs.length]

        return (
          <Link
            key={category.slug}
            href={`/costumes?category=${category.slug}`}
            className={cn('group flex flex-col', config.span)}
          >
            <div
              className={cn(
                'bg-muted ring-foreground/5 relative w-full overflow-hidden rounded-4xl ring-1',
                config.aspect,
              )}
            >
              <Image
                src={category.image || '/placeholder.svg'}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-102"
              />
            </div>
            <div className="mt-3.5 flex items-start justify-between gap-4 px-2">
              <div className="min-w-0">
                <h3 className="font-heading text-foreground group-hover:text-primary text-lg font-medium transition-colors">
                  {category.name}
                </h3>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {category.description}
                </p>
              </div>
              <span className="text-primary shrink-0 text-xs font-semibold tabular-nums">
                {count} {count === 1 ? 'creación' : 'creaciones'}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
