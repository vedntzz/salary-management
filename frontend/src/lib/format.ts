// One locale everywhere so every currency reads with the same separators.
const LOCALE = 'en-US'

export function formatCount(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value)
}

// ISO code, never a symbol: "$" alone can't tell USD from CAD, AUD or SGD.
export function formatMoney(amount: number, currency: string): string {
  return `${formatCount(amount)} ${currency}`
}
