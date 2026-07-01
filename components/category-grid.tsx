import Link from 'next/link'
import Image from 'next/image'
import { categories, costumes } from '@/lib/data'
import { cn } from '@/lib/utils'

const layoutConfigs = [
  { span: 'md:col-span-2', aspect: 'aspect-[1.8/1] sm:aspect-[2.1/1]' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
  { span: 'md:col-span-1', aspect: 'aspect-square' },
  { span: 'md:col-span-2', aspect: 'aspect-[1.8/1] sm:aspect-[2.1/1]' },
]

export function CategoryGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {categories.map((category, index) => {
        const count = costumes.filter(
          (c) => c.categorySlug === category.slug,
        ).length
        const config = layoutConfigs[index % layoutConfigs.length]

        return (
          <Link
            key={category.slug}
            href={`/costumes?category=${category.slug}`}
            className={cn('group flex flex-col', config.span)}
          >
            <div className={cn('relative w-full overflow-hidden rounded-[2rem] bg-muted ring-1 ring-foreground/5', config.aspect)}>
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
                <h3 className="font-heading text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {category.description}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-primary tabular-nums">
                {count} {count === 1 ? 'creation' : 'creations'}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
