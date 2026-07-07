'use client'

import { useActionState, useState } from 'react'
import { loginAction } from '@/app/admin/actions/auth-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="bg-card ring-foreground/5 rounded-2xl p-6 shadow-xs ring-1">
      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Ingresa la contraseña"
              className="pr-9 pl-9"
              required
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-md focus-visible:ring-1 focus-visible:outline-none"
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {state?.error && (
            <p role="alert" className="text-destructive text-xs font-medium">
              {state.error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full rounded-full"
          size="lg"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
              Ingresando...
            </>
          ) : (
            'Entrar al estudio'
          )}
        </Button>
      </form>
    </div>
  )
}
