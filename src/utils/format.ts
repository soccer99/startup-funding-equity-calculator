export function formatCurrency(amount: number): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`
  }
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`
  }
  return `$${num.toFixed(0)}`
}

export function formatPercentage(percentage: number): string {
  const num = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0
  return `${num.toFixed(2)}%`
}
