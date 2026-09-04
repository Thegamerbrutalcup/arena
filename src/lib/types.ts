export type NoteColor =
  | 'default'
  | 'violet'
  | 'blue'
  | 'green'
  | 'amber'
  | 'rose'

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  color: NoteColor
  pinned: boolean
  favorite: boolean
  trashed: boolean
  createdAt: number
  updatedAt: number
}

export interface DayStat {
  /** words written that day (net positive keystroke-derived word deltas) */
  words: number
  /** number of distinct notes touched */
  notes: number
}

export interface Settings {
  theme: 'dark' | 'light'
  accent: string
  dailyGoal: number
  petName: string
  petEnabled: boolean
  splitView: boolean
  fontSize: number
}

export interface AppState {
  version: number
  notes: Note[]
  /** map of YYYY-MM-DD -> stats */
  activity: Record<string, DayStat>
  settings: Settings
  /** total words ever written, drives pet level */
  lifetimeWords: number
  /** streak freezes available — earned every 7-day streak */
  freezes: number
  /** days that were saved by a freeze */
  frozenDays: string[]
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accent: '#8b7cf6',
  dailyGoal: 200,
  petName: 'Blob',
  petEnabled: true,
  splitView: false,
  fontSize: 16,
}
