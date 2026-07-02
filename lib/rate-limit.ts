// Rate Limiter simple en memoria para el endpoint de login.
// IP -> { count: intentos, blockedUntil: timestamp_bloqueo }

type AttemptRecord = {
  count: number;
  blockedUntil: number;
};

const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Verifica si una dirección IP está bloqueada para iniciar sesión
 * @param ip Dirección IP del cliente
 * @returns objeto con success=true si está libre, o success=false y blockedUntil si está bloqueado
 */
export function checkRateLimit(ip: string): { success: boolean; blockedUntil?: number } {
  const record = loginAttempts.get(ip);
  if (!record) {
    return { success: true };
  }

  const now = Date.now();
  if (record.blockedUntil > now) {
    return { success: false, blockedUntil: record.blockedUntil };
  }

  // Si el tiempo de bloqueo ya pasó, limpiamos el registro perezosamente
  if (record.blockedUntil > 0) {
    loginAttempts.delete(ip);
  }

  return { success: true };
}

/**
 * Registra un intento de inicio de sesión fallido
 * @param ip Dirección IP del cliente
 */
export function recordFailedAttempt(ip: string): { attemptsLeft: number; blockedUntil?: number } {
  const record = loginAttempts.get(ip);
  const now = Date.now();

  if (!record) {
    loginAttempts.set(ip, { count: 1, blockedUntil: 0 });
    return { attemptsLeft: MAX_ATTEMPTS - 1 };
  }

  // Si ya pasó el bloqueo, reiniciamos a 1 intento fallido
  if (record.blockedUntil > 0 && record.blockedUntil <= now) {
    loginAttempts.set(ip, { count: 1, blockedUntil: 0 });
    return { attemptsLeft: MAX_ATTEMPTS - 1 };
  }

  const newCount = record.count + 1;
  if (newCount >= MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(ip, { count: newCount, blockedUntil });
    return { attemptsLeft: 0, blockedUntil };
  }

  loginAttempts.set(ip, { count: newCount, blockedUntil: 0 });
  return { attemptsLeft: MAX_ATTEMPTS - newCount };
}

/**
 * Limpia los intentos fallidos al iniciar sesión con éxito
 * @param ip Dirección IP del cliente
 */
export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}
