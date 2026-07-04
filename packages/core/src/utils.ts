/** Type guard that checks whether a value is a non-null object (record). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Returns the string value if it is a string, or `undefined` otherwise. */
export function getString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

/** Returns the boolean value if it is a boolean, or `undefined` otherwise. */
export function getBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}
