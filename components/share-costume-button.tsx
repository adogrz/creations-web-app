'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WhatsAppIcon, MessengerIcon } from '@/components/icons'

interface ShareCostumeButtonProps {
  costumeName: string
  costumeUrl: string
}

export function ShareCostumeButton({ costumeName, costumeUrl }: ShareCostumeButtonProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(costumeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = `Mira este disfraz en Creations: ${costumeName}`
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(costumeUrl)

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    messenger: `https://www.messenger.com/share?link=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 rounded-full sm:w-auto"
        >
          <Share2 className="size-4" />
          Compartir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <WhatsAppIcon className="size-4" />
            <span>Compartir por WhatsApp</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={shareLinks.messenger}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <MessengerIcon className="size-4" />
            <span>Compartir por Messenger</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={shareLinks.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.869 4.332-2.97-.924c-.645-.213-.666-.645.14-1.01l11.6-4.475c.537-.196 1.006.128.832.941z" />
            </svg>
            <span>Compartir por Telegram</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M23.953 4.57a10 10 0 002.856-9.97a9.97 9.97 0 01-2.825.974a4.96 4.96 0 00-8.604 4.514c-4.165-.756-7.864-2.776-10.33-6.574a4.96 4.96 0 001.538 6.62c-.666-.021-1.296-.203-1.84-.52v.06a4.968 4.968 0 003.98 4.864a4.961 4.961 0 01-2.24.084a4.97 4.97 0 004.638 3.45A9.971 9.971 0 012 19.115a14.126 14.126 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985c0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            <span>Compartir en X (Twitter)</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Compartir en Facebook</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopyLink} disabled={!mounted}>
          <div className="flex items-center gap-2 cursor-pointer">
            {mounted && copied ? (
              <>
                <Check className="size-4 text-green-600" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>Copiar enlace</span>
              </>
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
