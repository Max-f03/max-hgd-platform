export function formatCurrency(
  amount: number,
  currency: string = "FCFA"
): string {
  return `${amount.toLocaleString("fr-FR")} ${currency}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"

  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}
