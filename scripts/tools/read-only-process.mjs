function failureMessage(command, result) {
  const output = String(result.stderr || result.stdout || '').trim()
  if (output)
    return output
  if (result.error instanceof Error)
    return result.error.message
  if (result.signal)
    return `${command} terminated by ${result.signal}`
  return `${command} exited ${String(result.status)}`
}

/**
 * Check-in probes are read-only, so a process the host killed can retry once
 * without duplicating a mutation. An ordinary nonzero exit stays final.
 */
export function runReadOnlyProcess(spawn, command, args, options = {}) {
  let result = spawn(command, args, options)
  if (result.status === null)
    result = spawn(command, args, options)
  if (result.status !== 0)
    throw new Error(failureMessage(command, result).slice(0, 800))
  return String(result.stdout).trim()
}
