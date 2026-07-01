'use client'

import { useState } from 'react'
import { Check, Phone, MessageCircle, Instagram, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Settings = {
  whatsappNumber: string
  messengerHandle: string
  instagramHandle: string
}

const defaults: Settings = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '50376772999',
  messengerHandle: process.env.NEXT_PUBLIC_MESSENGER_HANDLE ?? 'creaciones1.sv',
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? 'creations.sv_',
}

function load(): Settings {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = localStorage.getItem('creations_settings')
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function AdminSettingsForm() {
  const [values, setValues] = useState<Settings>(load)
  const [saved, setSaved] = useState(false)

  function handleChange(key: keyof Settings, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem('creations_settings', JSON.stringify(values))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* WhatsApp */}
      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <Phone className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-base font-medium">WhatsApp</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="whatsapp-number">Número de teléfono</Label>
          <Input
            id="whatsapp-number"
            type="tel"
            value={values.whatsappNumber}
            onChange={(e) => handleChange('whatsappNumber', e.target.value)}
            placeholder="50376772999"
          />
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            Solo números, con código de país. Ej: 50376772999
          </p>
        </div>
      </div>

      {/* Messenger */}
      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-base font-medium">Messenger / Facebook</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="messenger-handle">Username o ID de la página</Label>
          <Input
            id="messenger-handle"
            value={values.messengerHandle}
            onChange={(e) => handleChange('messengerHandle', e.target.value)}
            placeholder="creaciones1.sv"
          />
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            El username de tu página de Facebook. Ej: creaciones1.sv
          </p>
        </div>
      </div>

      {/* Instagram */}
      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <Instagram className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-base font-medium">Instagram</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instagram-handle">Username</Label>
          <Input
            id="instagram-handle"
            value={values.instagramHandle}
            onChange={(e) => handleChange('instagramHandle', e.target.value)}
            placeholder="creations.sv_"
          />
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            Sin el @. Ej: creations.sv_
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Los cambios se aplican al sitio inmediatamente.
        </p>
        <Button type="submit" className="rounded-full shrink-0">
          {saved ? (
            <>
              <Check className="size-4" />
              Guardado
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  )
}
