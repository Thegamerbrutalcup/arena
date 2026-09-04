import { AppState, DEFAULT_SETTINGS, Note } from './types'

const KEY = 'inkling.state.v1'

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const todayKey = (d: Date = new Date()) => dayKey(d)

export function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function countWords(text: string) {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).length
}

export function emptyState(): AppState {
  return {
    version: 1,
    notes: [],
    activity: {},
    settings: { ...DEFAULT_SETTINGS },
    lifetimeWords: 0,
    freezes: 0,
    frozenDays: [],
  }
}

export function welcomeNotes(): Note[] {
  const now = Date.now()
  return [
    {
      id: uid(),
      title: 'Welcome to Inkling 👋',
      body: `# Welcome!

This is your private notebook. Everything is stored **locally in your browser** — no account, no server, no snooping.

## Try this
- Hit **N** (or the *New note* button) to start writing
- Press **⌘K / Ctrl+K** for the command palette
- Use \`#tags\` in the tag bar to organise notes
- Toggle **split view** to preview Markdown live

## Markdown works
1. Lists, **bold**, *italic*, ~~strikethrough~~
2. \`inline code\` and fenced blocks
3. > Blockquotes
4. - [ ] task lists

\`\`\`js
const streak = days.filter(hasWriting).length
console.log('keep going', streak)
\`\`\`

Say hi to your buddy in the corner — it reacts when you type. 🫧`,
      tags: ['guide'],
      color: 'violet',
      pinned: true,
      favorite: false,
      trashed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid(),
      title: 'Daily journal',
      body: `## ${new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}

Three things worth remembering today:

1. 
2. 
3. `,
      tags: ['journal'],
      color: 'blue',
      pinned: false,
      favorite: true,
      trashed: false,
      createdAt: now - 1000,
      updatedAt: now - 1000,
    },
  ]
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const s = emptyState()
      s.notes = welcomeNotes()
      return s
    }
    const parsed = JSON.parse(raw) as AppState
    return {
      ...emptyState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      activity: parsed.activity || {},
      notes: (parsed.notes || []).map((n) => ({
        ...n,
        tags: n.tags || [],
        color: n.color || 'default',
      })),
    }
  } catch {
    const s = emptyState()
    s.notes = welcomeNotes()
    return s
  }
}

let saveTimer: number | undefined
export function saveState(state: AppState) {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Could not persist state', e)
    }
  }, 250)
}

export function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
