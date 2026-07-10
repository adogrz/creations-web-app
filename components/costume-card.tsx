import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Costume } from '@/lib/types'

export function CostumeCard({ costume }: { costume: Costume }) {
  const priceDisplay = `Desde $${costume.price}`

  return (
    <Link
      href={`/costumes/${costume.slug}`}
      className="group flex flex-col transition-[color] duration-300"
    >
      <div className="bg-muted ring-foreground/5 relative aspect-4/5 overflow-hidden rounded-4xl ring-1">
        <Image
          src={costume.images[0]?.url || '/placeholder.svg'}
          alt={costume.images[0]?.alt || costume.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-102"
        />
        <div className="absolute top-4 left-4">
          <Badge
            variant="secondary"
            className="bg-background/70 border-none px-3 py-1 text-xs backdrop-blur-sm"
          >
            {costume.category?.name}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-2 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-foreground group-hover:text-primary text-lg leading-snug font-medium text-balance transition-colors duration-200">
            {costume.name}
          </h3>
          <ArrowUpRight
            className="text-muted-foreground/60 group-hover:text-primary mt-1 size-4 shrink-0 transition-[color] duration-200"
            aria-hidden="true"
          />
        </div>
        {costume.description && (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {costume.description}
          </p>
        )}
        <div className="text-primary flex items-center justify-between pt-1 text-xs font-semibold">
          <span className="tabular-nums">{priceDisplay}</span>
          <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            {costume.audience === 'KIDS'
              ? 'Niños'
              : costume.audience === 'ADULTS'
                ? 'Adultos'
                : 'Todo público'}
          </span>
        </div>
      </div>
    </Link>
  )
}
