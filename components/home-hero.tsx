import { Sparkles, Heart, Scissors } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'

export function HomeHero() {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-6 sm:px-6 sm:pb-8 lg:pt-20 lg:pb-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-7xl">
            Disfraces hechos{' '}
            <span className="text-primary font-serif font-medium italic">
              a mano
            </span>
            , con{' '}
            <span className="text-primary font-serif font-medium italic">
              amor
            </span>
            .
          </h1>
          <p className="text-muted-foreground max-w-lg text-base leading-relaxed text-pretty sm:text-lg">
            Creations es un pequeño taller que confecciona disfraces únicos para
            niños y adultos. Explora nuestro trabajo y escríbenos para dar vida
            al disfraz de tus sueños.
          </p>
          <SearchBar className="mx-auto max-w-lg" />
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm">
            <span className="flex items-center gap-2">
              <Heart className="text-primary size-4" aria-hidden="true" />
              Hecho con dedicación
            </span>
            <span className="flex items-center gap-2">
              <Scissors className="text-primary size-4" aria-hidden="true" />
              Ajuste a medida
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" aria-hidden="true" />
              Niños y adultos
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
