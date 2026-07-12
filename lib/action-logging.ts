export function logActionOutcome(
  action: string,
  outcome: 'success' | 'failure',
  failureClass?: string,
  error?: unknown,
  details: Record<string, unknown> = {},
) {
  const safeMessage =
    error instanceof Error
      ? error.message
          .replace(/https?:\/\/\S+/gi, '[redacted-url]')
          .slice(0, 500)
      : undefined
  const diagnostic =
    error && typeof error === 'object'
      ? {
          error_name: error.constructor?.name,
          ...('code' in error &&
          (typeof error.code === 'string' || typeof error.code === 'number')
            ? { error_code: error.code }
            : {}),
          ...(safeMessage ? { error_message: safeMessage } : {}),
        }
      : {}
  console.info(
    JSON.stringify({
      event: 'admin_action_outcome',
      action,
      outcome,
      ...(failureClass ? { failure_class: failureClass } : {}),
      ...diagnostic,
      ...details,
    }),
  )
}
