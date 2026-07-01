import { Sparkles, Heart, Scissors } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'

export function HomeHero() {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-12 sm:px-6 sm:pb-8 lg:pb-8 lg:pt-20">
        <div className="flex flex-col gap-6">
          <span className="font-serif italic text-primary text-base tracking-wide sm:text-lg">
            Un pequeño taller de disfraces artesanales
          </span>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-7xl">
            Disfraces hechos <span className="font-serif italic font-medium text-primary">a mano</span>, con <span className="font-serif italic font-medium text-primary">amor</span>.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground text-pretty sm:max-w-md sm:text-lg">
            Creations es un pequeño taller que confecciona disfraces únicos para
            niños y adultos. Explora nuestro trabajo y escríbenos para dar vida al
            disfraz de tus sueños.
          </p>
          <SearchBar className="max-w-lg" />
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Heart className="size-4 text-primary" aria-hidden="true" />
              Hecho con dedicación
            </span>
            <span className="flex items-center gap-2">
              <Scissors className="size-4 text-primary" aria-hidden="true" />
              Ajuste a medida
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Niños y adultos
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
