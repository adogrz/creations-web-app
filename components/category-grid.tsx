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
  { span: 'md:col-span-2', aspect: 'aspect-[1.8/1] sm:aspect-[2.1/1]' },
]

export async function CategoryGrid({ className }: { className?: string }) {
  // Consultar categorías incluyendo el conteo de disfraces publicados
  const categoriesWithCounts = await prisma.category.findMany({
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
                'bg-muted ring-foreground/5 relative w-full overflow-hidden rounded-[2rem] ring-1',
                config.aspect,
              )}
            >
              <Image
                src={category.image || '/placeholder.svg'}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-102"
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
