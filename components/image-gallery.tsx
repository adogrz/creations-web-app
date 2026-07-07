'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ShareCostumeButton } from '@/components/share-costume-button'
import type { Image as GalleryImage } from '@/lib/types'

export function ImageGallery({
  images,
  alt,
}: {
  images: GalleryImage[]
  alt: string
}) {
  const [active, setActive] = useState(0)
  const gallery =
    images.length > 0
      ? images
      : [{ url: '/placeholder.svg', alt: 'Placeholder', id: 'placeholder' }]

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted ring-foreground/10 relative aspect-4/5 overflow-hidden rounded-3xl ring-1">
        <Image
          src={gallery[active]?.url || '/placeholder.svg'}
          alt={gallery[active]?.alt || `${alt} — view ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute top-3 right-3">
          <ShareCostumeButton />
        </div>
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-3">
          {gallery.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={active === index}
              className={cn(
                'bg-muted relative aspect-square w-20 overflow-hidden rounded-2xl ring-1 transition-all sm:w-24',
                active === index
                  ? 'ring-primary ring-2'
                  : 'ring-foreground/10 hover:ring-primary/40',
              )}
            >
              <Image
                src={image.url || '/placeholder.svg'}
                alt={image.alt || ''}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
