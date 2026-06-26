/**
 * Máscara de celular/telefone brasileiro.
 * - Até 10 dígitos → `(DD) XXXX-XXXX` (fixo)
 * - 11 dígitos → `(DD) XXXXX-XXXX` (celular)
 * Aceita input parcial — formata conforme o usuário digita.
 */
export function formatPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
