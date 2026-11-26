export function formatCurrency(amount: number): string {
  const num = Number.isFinite(amount) ? amount : 0
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  // Thresholds sit just below the unit so rounding never shows "$1000K" or "$1000.00M".
  // parseFloat drops trailing zeros: $12M, $2.5M, $39.31M.
  if (abs >= 999_995_000) return `${sign}$${parseFloat((abs / 1e9).toFixed(2))}B`
  if (abs >= 999_500) return `${sign}$${parseFloat((abs / 1e6).toFixed(2))}M`
  if (abs >= 1000) return `${sign}$${(abs / 1e3).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

export function formatPercentage(percentage: number): string {
  const num = Number.isFinite(percentage) ? percentage : 0
  return `${num.toFixed(2)}%`
}
