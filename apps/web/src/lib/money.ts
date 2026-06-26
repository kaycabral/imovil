const brlCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const brlCurrencyRounded = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

/**
 * Valores monetários são persistidos em centavos (inteiro) para evitar imprecisão de ponto flutuante.
 * Este helper converte e formata para exibição em pt-BR.
 */
export function formatBRLFromCents(cents: number): string {
  return brlCurrency.format((cents ?? 0) / 100)
}

/** Versão sem casas decimais (arredonda para real mais próximo). Útil em cards compactos. */
export function formatBRLFromCentsRounded(cents: number): string {
  return brlCurrencyRounded.format((cents ?? 0) / 100)
}
