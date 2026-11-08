export const sessionDate = new Date()

export function parseLocalDate(value) {
  if (typeof value !== 'string') return null
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = parseLocalDate(value)
  if (!date) return 'No due date'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = start.getDay() || 7
  start.setDate(start.getDate() - weekday + 1)
  return start
}

export function shortDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}
