/**
 * Gera iniciais (1 ou 2 caracteres em maiúsculas) a partir de um nome ou email.
 * Usado em Avatar fallback e badges redondos de usuário.
 */
export function initials(primary: string | null, fallback: string | null = null): string {
  const source = primary?.trim() || fallback?.trim() || ''
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  if (a && b) return (a + b).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}
