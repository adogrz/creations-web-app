'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareCostumeButtonProps {
  className?: string
}

export function ShareCostumeButton({ className }: ShareCostumeButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: typeof window !== 'undefined' ? window.location.href : '',
        })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    // Fallback: copy to clipboard
    try {
      const url = typeof window !== 'undefined' ? window.location.href : ''
      if (url) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
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
        'bg-background/80 text-foreground ring-foreground/10 hover:bg-background flex size-9 items-center justify-center rounded-full shadow-sm ring-1 backdrop-blur-sm transition-colors',
        className,
      )}
    >
      {copied ? (
        <Check className="text-primary size-4" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
