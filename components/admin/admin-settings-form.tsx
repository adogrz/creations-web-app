'use client'

import { useActionState, useEffect, useState } from 'react'
import { Phone, MessageCircle, Info, Loader2 } from 'lucide-react'
import { InstagramIcon } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateSettingsAction } from '@/app/admin/actions/settings-actions'
import { toast } from 'sonner'

type Settings = {
  whatsappNumber: string
  messengerHandle: string
  instagramHandle: string | null
}

export function AdminSettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [whatsapp, setWhatsapp] = useState(initialSettings.whatsappNumber)
  const [messenger, setMessenger] = useState(initialSettings.messengerHandle)
  const [instagram, setInstagram] = useState(initialSettings.instagramHandle || '')

  // Sincronizar el estado interno si las configuraciones del servidor cambian
  useEffect(() => {
    setWhatsapp(initialSettings.whatsappNumber)
    setMessenger(initialSettings.messengerHandle)
    setInstagram(initialSettings.instagramHandle || '')
  }, [initialSettings])

  const [state, formAction, isPending] = useActionState(updateSettingsAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success('Configuraciones guardadas exitosamente')
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* WhatsApp */}
      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/5 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <Phone className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-base font-medium">WhatsApp</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="whatsappNumber">Número de teléfono</Label>
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="50376772999"
            required
            disabled={isPending}
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
          <Label htmlFor="messengerHandle">Username o ID de la página</Label>
          <Input
            id="messengerHandle"
            name="messengerHandle"
            value={messenger}
            onChange={(e) => setMessenger(e.target.value)}
            placeholder="creaciones1.sv"
            required
            disabled={isPending}
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
          <InstagramIcon className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-base font-medium">Instagram</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instagramHandle">Username</Label>
          <Input
            id="instagramHandle"
            name="instagramHandle"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="creations.sv_"
            disabled={isPending}
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
        <Button type="submit" className="rounded-full shrink-0" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  )
}
