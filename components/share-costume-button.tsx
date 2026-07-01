'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareCostumeButtonProps {
  costumeName: string
  costumeUrl: string
  className?: string
}

export function ShareCostumeButton({ costumeName, costumeUrl, className }: ShareCostumeButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: costumeName,
          text: `Mira este disfraz en Creations: ${costumeName}`,
          url: costumeUrl,
        })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(costumeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Compartir disfraz"
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm ring-1 ring-foreground/10 transition-colors hover:bg-background',
        className,
      )}
    >
      {copied ? (
        <Check className="size-4 text-primary" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
