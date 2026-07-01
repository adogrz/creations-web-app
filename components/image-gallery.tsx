'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ImageGallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const [active, setActive] = useState(0)
  const gallery = images.length > 0 ? images : ['/placeholder.svg']

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/10">
        <Image
          src={gallery[active] || '/placeholder.svg'}
          alt={`${alt} — view ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-3">
          {gallery.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={active === index}
              className={cn(
                'relative aspect-square w-20 overflow-hidden rounded-2xl bg-muted ring-1 transition-all sm:w-24',
                active === index
                  ? 'ring-2 ring-primary'
                  : 'ring-foreground/10 hover:ring-primary/40',
              )}
            >
              <Image
                src={image || '/placeholder.svg'}
                alt=""
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
