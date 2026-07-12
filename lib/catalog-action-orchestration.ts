export type ActionResult =
  { success: true; error?: never } | { success?: false; error: string }

export type ActionFailure = {
  error: string
  failureClass: string
}

type ActionDependencies<Input, Output = void> = {
  action: string
  authorize: () => Promise<boolean>
  unauthorized: ActionFailure
  parse: () => ActionFailure | { data: NonNullable<Input> }
  mutate: (data: NonNullable<Input>) => Promise<ActionFailure | Output>
  complete: (output: Output) => void
  onError: (error: unknown) => ActionFailure
  log: (
    action: string,
    outcome: 'success' | 'failure',
    failureClass?: string,
    error?: unknown,
  ) => void
}

type ParseResult<Input> = ActionFailure | { data: NonNullable<Input> }

function isActionFailure(result: unknown): result is ActionFailure {
  return (
    typeof result === 'object' && result !== null && 'failureClass' in result
  )
}

function hasParseFailure<Input>(
  result: ParseResult<Input>,
): result is ActionFailure {
  return isActionFailure(result)
}

export async function executeCatalogAction<Input, Output = void>(
  dependencies: ActionDependencies<Input, Output>,
): Promise<ActionResult> {
  const fail = (failure: ActionFailure, error?: unknown): ActionResult => {
    dependencies.log(
      dependencies.action,
      'failure',
      failure.failureClass,
      error,
    )
    return { error: failure.error }
  }

  try {
    if (!(await dependencies.authorize()))
      return fail(dependencies.unauthorized)
  } catch {
    return fail(dependencies.unauthorized)
  }

  const parsed = dependencies.parse()
  if (hasParseFailure(parsed)) return fail(parsed)

  let output: Output
  try {
    const mutationFailure = await dependencies.mutate(parsed.data)
    if (isActionFailure(mutationFailure)) return fail(mutationFailure)
    output = mutationFailure as Output
  } catch (error) {
    return fail(dependencies.onError(error), error)
  }

  try {
    dependencies.complete(output)
  } catch (error) {
    dependencies.log(dependencies.action, 'failure', 'completion', error)
  }

  dependencies.log(dependencies.action, 'success')
  return { success: true }
}

// These action-specific entry points keep Server Action modules as production
// adapters while allowing the exact orchestration path to run in Node checks.
export function executeCategoryAction<Input, Output = void>(
  dependencies: ActionDependencies<Input, Output>,
) {
  return executeCatalogAction(dependencies)
}

export function executeCostumeAction<Input, Output = void>(
  dependencies: ActionDependencies<Input, Output>,
) {
  return executeCatalogAction(dependencies)
}
