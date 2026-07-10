import Link from 'next/link'
import { ArrowRight, Palette, Ruler, MessageCircleHeart } from 'lucide-react'
import { HomeHero } from '@/components/home-hero'
import { CategoryGrid } from '@/components/category-grid'
import { CostumeCard } from '@/components/costume-card'
import { ContactButtons } from '@/components/contact-buttons'
import { getFeaturedCostumes, getSettings } from '@/lib/queries'

export const dynamic = 'force-dynamic'

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

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    getFeaturedCostumes(4),
    getSettings(),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${process.env.NEXT_PUBLIC_BASE_URL || 'https://creations.adogrz.com'}/#organization`,
    name: 'Creations',
    image: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://creations.adogrz.com'}/creations-logo.webp`,
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://creations.adogrz.com',
    telephone: settings.whatsappNumber,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'SV',
      addressLocality: 'El Salvador',
    },
    description:
      'Catálogo visual de disfraces personalizados hechos a mano para niños y adultos en El Salvador.',
    priceRange: '$$',
    sameAs: [
      `https://m.me/${settings.messengerHandle}`,
      settings.instagramHandle
        ? `https://instagram.com/${settings.instagramHandle}`
        : '',
    ].filter(Boolean),
  }

  return (
    <div className="flex flex-col gap-10 pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHero />

      {/* Categories */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Buscar por categoría
            </h2>
            <p className="text-muted-foreground mt-2 text-pretty">
              Encuentra el estilo ideal para tu próxima celebración.
            </p>
          </div>
          <Link
            href="/categories"
            className="text-primary flex shrink-0 items-center gap-1 font-serif text-sm font-medium italic hover:underline"
          >
            Ver todas
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
            <p className="text-muted-foreground mt-2 text-pretty">
              Una selección exclusiva de nuestras piezas favoritas.
            </p>
          </div>
          <Link
            href="/costumes"
            className="text-primary hidden shrink-0 items-center gap-1 font-serif text-sm font-medium italic hover:underline sm:flex"
          >
            Ver catálogo
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((costume) => (
              <CostumeCard key={costume.slug} costume={costume} />
            ))}
          </div>
        ) : (
          <div
            className="bg-secondary/40 flex flex-col items-center gap-3 rounded-3xl py-16 text-center"
            role="status"
          >
            <p className="font-heading text-xl font-medium">
              Aún no hay creaciones destacadas
            </p>
            <p className="text-muted-foreground max-w-xs text-sm">
              Explora el catálogo para descubrir todas las creaciones.
            </p>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="bg-secondary/50 rounded-[2rem] p-8 sm:p-12">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Cómo funciona
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full">
                    <step.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-muted-foreground text-sm">
                    Paso {i + 1}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-medium">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="bg-primary/5 ring-primary/10 flex flex-col items-center gap-6 rounded-[2.5rem] px-6 py-12 text-center ring-1 sm:py-16">
          <h2 className="font-heading max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            ¿Tienes un disfraz en mente? Hagámoslo realidad.
          </h2>
          <p className="text-muted-foreground max-w-md text-sm text-pretty">
            Envíanos un mensaje por WhatsApp o Messenger y te ayudaremos a dar
            vida a tu idea.
          </p>
          <ContactButtons settings={settings} className="w-full max-w-md" />
        </div>
      </section>
    </div>
  )
}
