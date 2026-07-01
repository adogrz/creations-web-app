import Image from 'next/image'
import { Sparkles, Heart, Scissors } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'

export function HomeHero() {
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pt-20">
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

        <div className="relative">
          <div className="relative aspect-4/3 overflow-hidden rounded-[2.5rem] rounded-tr-none ring-1 ring-foreground/10 lg:aspect-square">
            <Image
              src="/images/hero-studio.png"
              alt="Un taller de disfraces hechos a mano con creaciones coloridas y telas"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-full bg-primary text-primary-foreground size-24 flex-col items-center justify-center text-center shadow-lg sm:flex border border-primary-foreground/10 ring-8 ring-background">
            <p className="font-serif italic text-2xl font-bold leading-none tabular-nums">
              100+
            </p>
            <p className="text-[9px] uppercase tracking-wider font-semibold opacity-90 mt-1">
              creados
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
