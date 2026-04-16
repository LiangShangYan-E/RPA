export async function copyToClipboard(text) {
  const v = text == null ? '' : String(text)
  if (!v) return false

  // Prefer async clipboard API when available (requires secure context).
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(v)
      return true
    }
  } catch {
    // fall through to legacy approach
  }

  // Fallback: use a temporary textarea + execCommand('copy') for wider compatibility.
  try {
    const el = document.createElement('textarea')
    el.value = v
    el.setAttribute('readonly', 'true')
    el.style.position = 'fixed'
    el.style.top = '0'
    el.style.left = '-9999px'
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'

    document.body.appendChild(el)
    el.focus()
    el.select()
    el.setSelectionRange(0, el.value.length)

    const ok = document.execCommand && document.execCommand('copy')
    document.body.removeChild(el)
    return Boolean(ok)
  } catch {
    return false
  }
}

