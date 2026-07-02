'use client'

import { useSearchParams } from 'next/navigation'
import { loginAction } from '@/lib/admin-auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export function LoginForm() {
  const searchParams = useSearchParams()
  const hasError = searchParams.get('error') === '1'

  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/5 shadow-xs">
      <form action={loginAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresa la contraseña"
              className="pl-9"
              required
            />
          </div>
          {hasError && (
            <p role="alert" className="text-xs text-destructive">
              Contraseña incorrecta. Intenta de nuevo.
            </p>
          )}
        </div>

        <Button type="submit" className="w-full rounded-full" size="lg">
          Entrar al estudio
        </Button>
      </form>
    </div>
  )
}
