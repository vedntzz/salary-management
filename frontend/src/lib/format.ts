// One locale everywhere so every currency reads with the same separators.
const LOCALE = 'en-US'

export function formatSalary(amount: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value)
}
