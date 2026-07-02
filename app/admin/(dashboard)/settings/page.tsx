import type { Metadata } from 'next'
import { AdminSettingsForm } from '@/components/admin/admin-settings-form'

export const metadata: Metadata = {
  title: 'Configuración — Estudio Creations',
}

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona los datos de contacto que se usan en el sitio.
        </p>
      </div>
      <AdminSettingsForm />
    </div>
  )
}
