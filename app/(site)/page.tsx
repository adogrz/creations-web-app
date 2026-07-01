import Link from 'next/link'
import { ArrowRight, Palette, Ruler, MessageCircleHeart } from 'lucide-react'
import { HomeHero } from '@/components/home-hero'
import { CategoryGrid } from '@/components/category-grid'
import { CostumeCard } from '@/components/costume-card'
import { ContactButtons } from '@/components/contact-buttons'
import { costumes } from '@/lib/data'

const steps = [
  {
    icon: Palette,
    title: 'Cuéntanos tu idea',
    text: 'Dinos el personaje, los colores y el estilo que estás imaginando.',
  },
  {
    icon: Ruler,
    title: 'Diseño y medidas',
    text: 'Esbozamos el diseño del disfraz y tomamos medidas para un ajuste ideal y cómodo.',
  },
  {
    icon: MessageCircleHeart,
    title: 'Confección y entrega',
    text: 'Cada pieza se cose a mano y se termina con hermosos detalles llenos de amor.',
  },
]

export default function HomePage() {
  const featured = costumes.filter((c) => c.featured).slice(0, 4)

  return (
    <div className="flex flex-col gap-28 pb-4">
      <HomeHero />

      {/* Categories */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Buscar por categoría
            </h2>
            <p className="mt-2 text-muted-foreground text-pretty">
              Encuentra el estilo ideal para tu próxima celebración.
            </p>
          </div>
          <Link
            href="/categories"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex font-serif italic"
          >
            Ver todo
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* Featured */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Creaciones destacadas
            </h2>
            <p className="mt-2 text-muted-foreground text-pretty">
              Una selección exclusiva de nuestras piezas favoritas.
            </p>
          </div>
          <Link
            href="/costumes"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex font-serif italic"
          >
            Ver catálogo
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((costume) => (
            <CostumeCard key={costume.slug} costume={costume} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="rounded-[2rem] bg-secondary/50 p-8 sm:p-12">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Cómo funciona
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <step.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-sm text-muted-foreground">
                    Paso {i + 1}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-medium">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-primary/5 px-6 py-12 text-center ring-1 ring-primary/10 sm:py-16">
          <h2 className="max-w-xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            ¿Tienes un disfraz en mente? Hagámoslo realidad.
          </h2>
          <p className="max-w-md text-muted-foreground text-pretty text-sm">
            Envíanos un mensaje por WhatsApp o Messenger y te ayudaremos a dar vida
            a tu idea.
          </p>
          <ContactButtons className="w-full max-w-md" />
        </div>
      </section>
    </div>
  )
}
