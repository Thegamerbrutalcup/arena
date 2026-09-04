import { AppState } from './types'
import { addDays, dayKey } from './storage'

export interface StreakInfo {
  current: number
  longest: number
  activeToday: boolean
  /** days since the last active day (0 = today) */
  gap: number
  totalActiveDays: number
}

function isActive(state: AppState, key: string) {
  const a = state.activity[key]
  if (a && a.words > 0) return true
  return state.frozenDays.includes(key)
}

export function computeStreak(state: AppState, now = new Date()): StreakInfo {
  const today = dayKey(now)
  const activeToday = isActive(state, today)

  // Anchor at today if written, else yesterday (grace period until midnight).
  let cursor = activeToday ? new Date(now) : addDays(now, -1)
  let current = 0
  while (isActive(state, dayKey(cursor))) {
    current++
    cursor = addDays(cursor, -1)
  }

  const keys = Object.keys(state.activity)
    .filter((k) => state.activity[k].words > 0)
    .concat(state.frozenDays)
  const uniq = Array.from(new Set(keys)).sort()

  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const k of uniq) {
    if (prev && dayKey(addDays(new Date(prev.replace(/-/g, '/')), 1)) === k) run++
    else run = 1
    longest = Math.max(longest, run)
    prev = k
  }
  longest = Math.max(longest, current)

  let gap = 0
  let probe = new Date(now)
  while (gap < 400 && !isActive(state, dayKey(probe))) {
    gap++
    probe = addDays(probe, -1)
  }

  return { current, longest, activeToday, gap, totalActiveDays: uniq.length }
}

export interface HeatCell {
  key: string
  words: number
  date: Date
  future: boolean
}

/** Grid of weeks x 7 days ending today, GitHub-contribution style. */
export function heatmap(state: AppState, weeks = 26, now = new Date()): HeatCell[][] {
  const end = new Date(now)
  // Move to the end of the current week (Saturday) so columns line up.
  const endOfWeek = addDays(end, 6 - end.getDay())
  const cells: HeatCell[][] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const col: HeatCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(endOfWeek, -(w * 7) + d - 6)
      const key = dayKey(date)
      col.push({
        key,
        date,
        words: state.activity[key]?.words ?? 0,
        future: date.getTime() > now.getTime(),
      })
    }
    cells.push(col)
  }
  return cells
}

export interface LevelInfo {
  level: number
  title: string
  into: number
  need: number
  pct: number
}

const TITLES = [
  'Blank Page',
  'Scribbler',
  'Note Taker',
  'Journalist',
  'Essayist',
  'Wordsmith',
  'Chronicler',
  'Archivist',
  'Loremaster',
  'Ink Legend',
]

/** Level curve: level n requires 250 * n^1.35 cumulative-ish words. */
export function levelFor(words: number): LevelInfo {
  let level = 1
  let need = 250
  let remaining = words
  while (remaining >= need && level < 99) {
    remaining -= need
    level++
    need = Math.round(250 * Math.pow(level, 1.15))
  }
  const title = TITLES[Math.min(TITLES.length - 1, level <= 1 ? 0 : Math.floor(level / 2))]
  return {
    level,
    title,
    into: remaining,
    need,
    pct: Math.min(100, (remaining / need) * 100),
  }
}

export function wordsToday(state: AppState, now = new Date()) {
  return state.activity[dayKey(now)]?.words ?? 0
}
