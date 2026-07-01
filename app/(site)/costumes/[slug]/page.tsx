import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Tag, Wallet, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ImageGallery } from '@/components/image-gallery'
import { ContactButtons } from '@/components/contact-buttons'
import { CostumeCard } from '@/components/costume-card'
import {
  costumes,
  getCostumeBySlug,
  getCategoryName,
  getRelatedCostumes,
} from '@/lib/data'

export function generateStaticParams() {
  return costumes.map((costume) => ({ slug: costume.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const costume = getCostumeBySlug(slug)
  if (!costume) return { title: 'Disfraz no encontrado — Creations' }
  return {
    title: `${costume.name} — Creations`,
    description: costume.shortDescription,
  }
}

export default async function CostumeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const costume = getCostumeBySlug(slug)
  if (!costume) notFound()

  const related = getRelatedCostumes(costume)

  const getAudienceName = (aud: string) => {
    if (aud === 'Kids') return 'Niños'
    if (aud === 'Adults') return 'Adultos'
    return 'Todas las edades'
  }

  const details = [
    { icon: Wallet, label: 'Rango de precios', value: costume.priceRange },
    { icon: Clock, label: 'Tiempo de confección', value: costume.creationTime },
    { icon: Users, label: 'Ideal para', value: getAudienceName(costume.audience) },
    {
      icon: Tag,
      label: 'Categoría',
      value: getCategoryName(costume.categorySlug),
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/costumes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al catálogo
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ImageGallery images={costume.images} alt={costume.name} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              {getCategoryName(costume.categorySlug)}
            </Badge>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {costume.name}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
              {costume.description}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-primary ring-1 ring-foreground/10">
                  <d.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{d.label}</dt>
                  <dd className="truncate font-medium">{d.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2">
            {costume.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="rounded-3xl bg-primary/5 p-5 ring-1 ring-primary/15">
            <p className="mb-4 text-sm text-muted-foreground">
              ¿Te encanta esta pieza? Escríbenos para ordenarla o solicitar tu propia
              versión personalizada.
            </p>
            <ContactButtons costumeName={costume.name} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
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
