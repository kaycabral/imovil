/**
 * True when `error` (or the `pg` error Drizzle wraps in `cause`) is a Postgres
 * unique violation (SQLSTATE 23505), optionally on a specific constraint.
 */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  for (let current: unknown = error; current instanceof Error; current = current.cause) {
    if ('code' in current && current.code === '23505') {
      return (
        constraint === undefined || ('constraint' in current && current.constraint === constraint)
      )
    }
  }
  return false
}
