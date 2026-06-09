export function formatDateTime(iso: string, locale = 'de-DE'): string {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateRange(start: string, end: string, locale = 'de-DE'): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }

  const startLabel = startDate.toLocaleDateString(locale, dateOptions)
  const endLabel = endDate.toLocaleDateString(locale, dateOptions)

  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`
}
