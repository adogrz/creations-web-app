"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type ActionState = {
  success?: boolean;
  error?: string;
};

/**
 * Server Action para procesar el inicio de sesión del administrador
 */
export async function loginAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  // 1. Verificar si la IP está bloqueada por rate limit
  const limitCheck = checkRateLimit(ip);
  if (!limitCheck.success) {
    const minutesLeft = Math.ceil((limitCheck.blockedUntil! - Date.now()) / (60 * 1000));
    return {
      success: false,
      error: `Demasiados intentos fallidos. Tu IP está bloqueada. Intenta de nuevo en ${minutesLeft} minutos.`,
    };
  }

  // 2. Validar entrada
  const password = formData.get("password");
  const validation = loginSchema.safeParse({ password });
  if (!validation.success) {
    return {
      success: false,
      error: "La contraseña es obligatoria.",
    };
  }

  // 3. Verificar contraseña contra env var
  const adminPassword = process.env.ADMIN_PASSWORD || "creations2024";
  const inputPassword = validation.data.password;

  if (inputPassword !== adminPassword) {
    // Registrar intento fallido
    const failResult = recordFailedAttempt(ip);
    if (failResult.blockedUntil) {
      return {
        success: false,
        error: "Contraseña incorrecta. Has superado el límite de intentos y tu IP ha sido bloqueada por 15 minutos.",
      };
    }
    return {
      success: false,
      error: `Contraseña incorrecta. Te quedan ${failResult.attemptsLeft} intentos.`,
    };
  }

  // 4. Login exitoso - Resetear rate limiter
  resetRateLimit(ip);

  // 5. Crear sesión (15 días de expiración)
  const expTime = Date.now() + 15 * 24 * 60 * 60 * 1000;
  const sessionValue = await createSession(expTime);

  const cookieStore = await cookies();
  cookieStore.set("admin-session", sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 15,
  });

  // Redirigir fuera de cualquier bloque try-catch
  redirect("/admin");
}

/**
 * Server Action para cerrar sesión
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-session");
  redirect("/admin/login");
}
