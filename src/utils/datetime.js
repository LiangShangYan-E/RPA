const pad2 = (value) => String(value).padStart(2, '0')

const formatDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`

export const formatLocalDateTime = (value) => {
  if (!value) return ''
  if (value instanceof Date) return formatDate(value)

  const raw = String(value).trim()
  if (!raw) return ''

  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return raw

  return formatDate(parsed)
}

export const formatUtcStringToLocal = (value) => {
  if (!value) return ''
  const raw = String(value).trim()
  if (!raw) return ''

  // 仅处理无时区信息的时间串，按 UTC 解释后再转本地
  const hasTimezone = /([zZ]|[+\-]\d{2}:?\d{2})$/.test(raw)
  if (hasTimezone) return formatLocalDateTime(raw)

  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw
  const normalizedTz = normalized.replace(/([+\-]\d{2})(\d{2})$/, '$1:$2')
  const utcDate = new Date(`${normalizedTz}Z`)
  if (Number.isNaN(utcDate.getTime())) return formatLocalDateTime(raw)

  return formatDate(utcDate)
}

