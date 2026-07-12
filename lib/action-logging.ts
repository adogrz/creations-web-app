export function logActionOutcome(
  action: string,
  outcome: 'success' | 'failure',
  failureClass?: string,
  error?: unknown,
) {
  const diagnostic =
    error && typeof error === 'object'
      ? {
          error_name: error.constructor?.name,
          ...('code' in error &&
          (typeof error.code === 'string' || typeof error.code === 'number')
            ? { error_code: error.code }
            : {}),
        }
      : {}
  console.info(
    JSON.stringify({
      event: 'admin_action_outcome',
      action,
      outcome,
      ...(failureClass ? { failure_class: failureClass } : {}),
      ...diagnostic,
    }),
  )
}
