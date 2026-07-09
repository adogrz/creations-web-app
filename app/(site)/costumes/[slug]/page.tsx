import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect, RedirectType } from 'next/navigation'
import { ArrowLeft, Clock, Tag, Wallet, Users, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ImageGallery } from '@/components/image-gallery'
import { ContactButtons } from '@/components/contact-buttons'
import { CostumeCard } from '@/components/costume-card'
import {
  getCostumeBySlug,
  getRelatedCostumes,
  getSettings,
} from '@/lib/queries'
import prisma from '@/lib/db'

export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const list = await prisma.costume.findMany({
      where: { published: true },
      select: { slug: true },
    })
    return list.map((costume) => ({ slug: costume.slug }))
  } catch (error) {
    console.warn(
      'Advertencia: Base de datos no disponible durante la compilación en CI. Las páginas se generarán bajo demanda (on-demand/ISR) en producción.',
    )
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const costume = await getCostumeBySlug(slug)
  if (!costume) {
    const redirectRecord = await prisma.slugRedirect.findUnique({
      where: { oldSlug: slug },
      include: { costume: { select: { slug: true } } },
    })
    if (redirectRecord?.costume?.slug) {
      redirect(`/costumes/${redirectRecord.costume.slug}`, RedirectType.replace)
    }
    return { title: 'Disfraz no encontrado' }
  }
  const imageUrls = costume.images.map((img) => img.url)
  const descriptionText =
    costume.description ||
    `Disfraz personalizado de ${costume.name} hecho a mano.`
  return {
    title: costume.name,
    description: descriptionText,
    alternates: {
      canonical: `/costumes/${costume.slug}`,
    },
    openGraph: {
      type: 'article',
      url: `/costumes/${costume.slug}`,
      title: `${costume.name} | Creations`,
      description: descriptionText,
      images: imageUrls.map((url) => ({ url, alt: costume.name })),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${costume.name} | Creations`,
      description: descriptionText,
      images: imageUrls,
    },
  }
}

export default async function CostumeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const costume = await getCostumeBySlug(slug)
  if (!costume) {
    const redirectRecord = await prisma.slugRedirect.findUnique({
      where: { oldSlug: slug },
      include: { costume: { select: { slug: true } } },
    })
    if (redirectRecord?.costume?.slug) {
      redirect(`/costumes/${redirectRecord.costume.slug}`, RedirectType.replace)
    }
    notFound()
  }

  const [related, settings] = await Promise.all([
    getRelatedCostumes({
      costumeId: costume.id,
      categoryId: costume.categoryId,
      limit: 3,
    }),
    getSettings(),
  ])

  const getAudienceName = (aud: string) => {
    if (aud === 'KIDS') return 'Niños'
    if (aud === 'ADULTS') return 'Adultos'
    return 'Todas las edades'
  }

  const priceDisplay = `Desde $${costume.price}`

  const details = [
    { icon: Wallet, label: 'Precio base', value: priceDisplay },
    {
      icon: Clock,
      label: 'Tiempo de confección',
      value: costume.estimatedTime,
    },
    {
      icon: Users,
      label: 'Ideal para',
      value: getAudienceName(costume.audience),
    },
    {
      icon: Tag,
      label: 'Categoría',
      value: costume.category?.name || 'General',
    },
  ]

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'https://creations.adogrz.com'
  const imageUrls = costume.images.map((img) => img.url)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: costume.name,
    image: imageUrls.length > 0 ? imageUrls : [`${baseUrl}/placeholder.svg`],
    description:
      costume.description ||
      `Disfraz personalizado de ${costume.name} hecho a mano.`,
    brand: {
      '@type': 'Brand',
      name: 'Creations',
    },
    offers: {
      '@type': 'Offer',
      price: costume.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/PreOrder',
      url: `${baseUrl}/costumes/${costume.slug}`,
    },
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/costumes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Volver al catálogo
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ImageGallery
          images={costume.images}
          alt={costume.name}
          costumeSlug={costume.slug}
        />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              {costume.category?.name}
            </Badge>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {costume.name}
            </h1>
            {costume.description && (
              <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
                {costume.description}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {details.map((d) => (
              <div
                key={d.label}
                className="bg-secondary/50 flex items-start gap-3 rounded-2xl p-4"
              >
                <span className="bg-background text-primary ring-foreground/10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ring-1">
                  <d.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-muted-foreground text-xs leading-tight">
                    {d.label}
                  </dt>
                  <dd className="warp-break-words leading-snug font-medium">
                    {d.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2">
            {(costume.tags || []).map((tag) => (
              <span
                key={tag}
                className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">
              <Info className="size-4" />
            </span>
            <div className="text-xs leading-normal text-amber-800 dark:text-amber-300">
              <strong className="mb-0.5 block font-semibold">
                Nota sobre el precio:
              </strong>
              El precio indicado es una referencia inicial. Dado que realizamos
              confecciones personalizadas a medida, el costo final varía según
              la talla y la cantidad de material requerido. Asimismo, los
              diseños son adaptables si deseas añadir detalles o accesorios
              específicos.
            </div>
          </div>

          <div className="bg-primary/5 ring-primary/15 rounded-3xl p-5 ring-1">
            <p className="text-muted-foreground mb-4 text-sm">
              ¿Te encanta esta pieza? Escríbenos para ordenarla o solicitar tu
              propia versión personalizada.
            </p>
            <ContactButtons
              settings={settings}
              costumeUrl={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/costumes/${costume.slug}`}
              costumeSlug={costume.slug}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            También podría interesarte
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <CostumeCard key={c.slug} costume={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
