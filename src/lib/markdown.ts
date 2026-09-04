import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true, breaks: true })

export function renderMarkdown(md: string): string {
  const raw = marked.parse(md || '', { async: false }) as string
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target'],
  })
}

/** Pull out a short plain-text excerpt for list previews. */
export function excerpt(md: string, len = 110) {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > len ? text.slice(0, len).trimEnd() + '…' : text
}
