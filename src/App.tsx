import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar, { View } from './components/Sidebar'
import NoteList from './components/NoteList'
import Editor from './components/Editor'
import CommandPalette, { Command } from './components/CommandPalette'
import SettingsModal from './components/SettingsModal'
import { Mood } from './components/Pet'
import { AppState, Note, Settings } from './lib/types'
import {
  addDays,
  countWords,
  dayKey,
  download,
  emptyState,
  loadState,
  saveState,
  todayKey,
  uid,
} from './lib/storage'
import { computeStreak, heatmap, levelFor, wordsToday } from './lib/streak'

const IDLE_MS = 45_000

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [view, setView] = useState<View>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('updated')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastTyped, setLastTyped] = useState(() => Date.now())
  const [now, setNow] = useState(Date.now())
  const [say, setSay] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const celebrated = useRef(false)

  /* ---------------------------------------------------------------- persist */
  useEffect(() => {
    saveState(state)
    setSaving(true)
    const t = setTimeout(() => setSaving(false), 400)
    return () => clearTimeout(t)
  }, [state])

  /* ------------------------------------------------------------ theme vars */
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = state.settings.theme
    root.style.setProperty('--accent', state.settings.accent)
  }, [state.settings.theme, state.settings.accent])

  /* ------------------------------------------------------------- heartbeat */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])

  // Re-render shortly after typing stops so the buddy's mood settles promptly.
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 2400)
    return () => clearTimeout(t)
  }, [lastTyped])

  /* --------------------------------------------------------- derived stats */
  const streak = useMemo(() => computeStreak(state, new Date(now)), [state, now])
  const level = useMemo(() => levelFor(state.lifetimeWords), [state.lifetimeWords])
  const grid = useMemo(() => heatmap(state, 26, new Date(now)), [state, now])
  const today = wordsToday(state, new Date(now))
  const earnedFreezes = Math.floor(streak.longest / 7)
  const freezesLeft = Math.max(0, earnedFreezes - state.frozenDays.length)

  /* ------------------------------------------- auto-apply a streak freeze */
  useEffect(() => {
    const y = dayKey(addDays(new Date(), -1))
    const twoAgo = dayKey(addDays(new Date(), -2))
    const yesterdayActive = (state.activity[y]?.words ?? 0) > 0 || state.frozenDays.includes(y)
    const dayBeforeActive =
      (state.activity[twoAgo]?.words ?? 0) > 0 || state.frozenDays.includes(twoAgo)
    if (!yesterdayActive && dayBeforeActive && freezesLeft > 0) {
      setState((s) =>
        s.frozenDays.includes(y) ? s : { ...s, frozenDays: [...s.frozenDays, y] },
      )
      setToast('❄ A streak freeze saved yesterday for you!')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  /* ------------------------------------------------------------ note CRUD */
  const notes = state.notes
  const active = notes.find((n) => n.id === activeId) ?? null

  useEffect(() => {
    if (!activeId) {
      const first = notes.filter((n) => !n.trashed).sort((a, b) => b.updatedAt - a.updatedAt)[0]
      if (first) setActiveId(first.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newNote = useCallback(() => {
    const n: Note = {
      id: uid(),
      title: '',
      body: '',
      tags: activeTag ? [activeTag] : [],
      color: 'default',
      pinned: false,
      favorite: false,
      trashed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setState((s) => ({ ...s, notes: [n, ...s.notes] }))
    setActiveId(n.id)
    setView('all')
    setQuery('')
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('.title-input')
      el?.focus()
    }, 40)
  }, [activeTag])

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setState((s) => {
      const prev = s.notes.find((n) => n.id === id)
      if (!prev) return s
      let activity = s.activity
      let lifetime = s.lifetimeWords

      if (patch.body !== undefined) {
        const delta = countWords(patch.body) - countWords(prev.body)
        if (delta > 0) {
          const k = todayKey()
          const cur = activity[k] ?? { words: 0, notes: 0 }
          activity = { ...activity, [k]: { words: cur.words + delta, notes: cur.notes } }
          lifetime += delta
        }
      }

      return {
        ...s,
        lifetimeWords: lifetime,
        activity,
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
        ),
      }
    })
  }, [])

  const trashNote = (id: string) => {
    updateNote(id, { trashed: true, pinned: false })
    setToast('Moved to trash')
    const rest = notes.filter((n) => !n.trashed && n.id !== id)
    setActiveId(rest[0]?.id ?? null)
  }

  const restoreNote = (id: string) => updateNote(id, { trashed: false })
  const purgeNote = (id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }))
    if (activeId === id) setActiveId(null)
  }

  const patchSettings = (patch: Partial<Settings>) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))

  /* -------------------------------------------------------------- filters */
  const visible = useMemo(() => {
    let list = notes.filter((n) => (view === 'trash' ? n.trashed : !n.trashed))
    if (view === 'favorites') list = list.filter((n) => n.favorite)
    if (view === 'pinned') list = list.filter((n) => n.pinned)
    if (activeTag) list = list.filter((n) => n.tags.includes(activeTag))
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q)),
      )
    }
    const cmp: Record<string, (a: Note, b: Note) => number> = {
      updated: (a, b) => b.updatedAt - a.updatedAt,
      created: (a, b) => b.createdAt - a.createdAt,
      title: (a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'),
      words: (a, b) => countWords(b.body) - countWords(a.body),
    }
    list = [...list].sort(cmp[sort] ?? cmp.updated)
    if (view !== 'trash') list.sort((a, b) => Number(b.pinned) - Number(a.pinned))
    return list
  }, [notes, view, activeTag, query, sort])

  const tags = useMemo(() => {
    const m = new Map<string, number>()
    notes.filter((n) => !n.trashed).forEach((n) => n.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [notes])

  const counts = useMemo(
    () => ({
      all: notes.filter((n) => !n.trashed).length,
      favorites: notes.filter((n) => !n.trashed && n.favorite).length,
      pinned: notes.filter((n) => !n.trashed && n.pinned).length,
      trash: notes.filter((n) => n.trashed).length,
    }),
    [notes],
  )

  /* ------------------------------------------------------------- pet brain */
  const isTyping = now - lastTyped < 2200 || Date.now() - lastTyped < 2200
  const idle = Date.now() - lastTyped > IDLE_MS
  const goalHit = today >= state.settings.dailyGoal
  const hour = new Date().getHours()

  const mood: Mood = useMemo(() => {
    if (isTyping) return 'writing'
    if (goalHit && !idle) return 'celebrate'
    if (!streak.activeToday && streak.current > 0 && hour >= 17) return 'worried'
    if (idle) return 'sleepy'
    if (today > 0) return 'happy'
    return 'idle'
  }, [isTyping, goalHit, idle, streak.activeToday, streak.current, hour, today])

  const petName = state.settings.petName || 'Blob'

  const speak = useCallback((msg: string, ms = 4200) => {
    setSay(msg)
    window.setTimeout(() => setSay((s) => (s === msg ? null : s)), ms)
  }, [])

  // Celebrate hitting the daily goal, once per day.
  useEffect(() => {
    if (goalHit && !celebrated.current) {
      celebrated.current = true
      speak(`Goal smashed! ${state.settings.dailyGoal} words 🎉`, 6000)
      setToast(`🎉 Daily goal reached — ${streak.current + (streak.activeToday ? 0 : 1)} day streak!`)
    }
  }, [goalHit, speak, state.settings.dailyGoal, streak.current, streak.activeToday])

  // Ambient chatter.
  useEffect(() => {
    if (!state.settings.petEnabled) return
    const lines = () => {
      const left = Math.max(0, state.settings.dailyGoal - today)
      const pool = [
        `${left > 0 ? `${left} words to go today` : 'Daily goal done ✅'}`,
        streak.current > 1 ? `${streak.current} days in a row — don't break it!` : 'Day one is the hardest',
        `Lv.${level.level} ${level.title}`,
        'Tip: ⌘K opens the command palette',
        'Tip: press N for a new note',
        notes.filter((n) => !n.trashed).length > 4 ? 'Tip: tag notes to find them fast' : 'Write anything — even one line counts',
        hour < 11 ? 'Morning pages? ☕' : hour > 21 ? 'Late-night thoughts hit different 🌙' : 'What are you thinking about?',
      ]
      return pool[Math.floor(Math.random() * pool.length)]
    }
    const t = setInterval(() => {
      if (Math.random() < 0.55) speak(lines())
    }, 26_000)
    return () => clearInterval(t)
  }, [state.settings.petEnabled, state.settings.dailyGoal, today, streak.current, level, notes, hour, speak])

  const petMe = () => {
    const lines = [
      `${petName} is happy! 💜`,
      'boop!',
      `${today} words today — nice`,
      streak.current > 0 ? `🔥 ${streak.current} day streak` : 'Let’s start a streak today',
      'I sit here and believe in you',
      `Lv.${level.level} · ${level.into}/${level.need} XP`,
    ]
    speak(lines[Math.floor(Math.random() * lines.length)], 3000)
  }

  /* -------------------------------------------------------- import/export */
  const exportAll = () => {
    download(`inkling-backup-${todayKey()}.json`, JSON.stringify(state, null, 2))
    setToast('Backup downloaded')
  }

  const exportNote = () => {
    if (!active) return
    const name = (active.title || 'untitled').replace(/[^\w\- ]+/g, '').trim() || 'untitled'
    download(`${name}.md`, `# ${active.title}\n\n${active.body}`, 'text/markdown')
  }

  const importBackup = (file: File) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result)) as AppState
        if (!Array.isArray(data.notes)) throw new Error('bad file')
        setState({ ...emptyState(), ...data, settings: { ...state.settings, ...data.settings } })
        setToast('Backup restored')
        setSettingsOpen(false)
      } catch {
        setToast('That file did not look like an Inkling backup')
      }
    }
    r.readAsText(file)
  }

  const resetAll = () => {
    if (!confirm('Delete all notes, streaks and settings? This cannot be undone.')) return
    setState(emptyState())
    setActiveId(null)
    setToast('Everything reset')
  }

  /* ------------------------------------------------------------- commands */
  const commands: Command[] = useMemo(() => {
    const base: Command[] = [
      { id: 'new', label: 'New note', hint: 'N', icon: '✚', run: newNote },
      {
        id: 'theme',
        label: `Switch to ${state.settings.theme === 'dark' ? 'light' : 'dark'} theme`,
        icon: '◐',
        run: () => patchSettings({ theme: state.settings.theme === 'dark' ? 'light' : 'dark' }),
      },
      {
        id: 'split',
        label: `${state.settings.splitView ? 'Hide' : 'Show'} live preview`,
        icon: '◧',
        run: () => patchSettings({ splitView: !state.settings.splitView }),
      },
      { id: 'settings', label: 'Open settings', icon: '⚙', run: () => setSettingsOpen(true) },
      { id: 'export', label: 'Export backup (.json)', icon: '⭳', run: exportAll },
      { id: 'exportmd', label: 'Export current note (.md)', icon: '📄', run: exportNote },
      { id: 'fav', label: 'Show favourites', icon: '★', run: () => setView('favorites') },
      { id: 'trash', label: 'Open trash', icon: '🗑', run: () => setView('trash') },
      { id: 'pet', label: `Pet ${petName}`, icon: '🫧', run: petMe },
    ]
    const noteCmds: Command[] = notes
      .filter((n) => !n.trashed)
      .slice(0, 40)
      .map((n) => ({
        id: 'go' + n.id,
        label: n.title || 'Untitled note',
        hint: 'note',
        icon: '›',
        run: () => {
          setView('all')
          setActiveTag(null)
          setActiveId(n.id)
        },
      }))
    return [...base, ...noteCmds]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, state.settings, newNote, petName, active])

  /* ------------------------------------------------------------ shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setPaletteOpen(false)
        setSettingsOpen(false)
      } else if (!typing && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        newNote()
      } else if (!typing && e.key === '/') {
        e.preventDefault()
        searchRef.current?.querySelector('input')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newNote])

  /* ----------------------------------------------------------------- view */
  return (
    <div className="app">
      <Sidebar
        petName={petName}
        mood={mood}
        say={state.settings.petEnabled ? say : null}
        level={level}
        streak={streak}
        grid={grid}
        goal={state.settings.dailyGoal}
        today={today}
        totalNotes={counts.all}
        lifetimeWords={state.lifetimeWords}
        freezes={freezesLeft}
        view={view}
        tags={tags}
        activeTag={activeTag}
        counts={counts}
        onPet={petMe}
        onView={setView}
        onTag={(t) => {
          setActiveTag(t)
          if (t) setView('all')
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div ref={searchRef} className="list-col">
        <NoteList
          notes={visible}
          activeId={activeId}
          query={query}
          sort={sort}
          trashMode={view === 'trash'}
          onQuery={setQuery}
          onSort={setSort}
          onSelect={setActiveId}
          onNew={newNote}
          onRestore={restoreNote}
          onPurge={purgeNote}
        />
      </div>

      <Editor
        note={active}
        splitView={state.settings.splitView}
        fontSize={state.settings.fontSize}
        saving={saving}
        onChange={(patch) => active && updateNote(active.id, patch)}
        onToggleSplit={() => patchSettings({ splitView: !state.settings.splitView })}
        onDelete={() => active && trashNote(active.id)}
        onExport={exportNote}
        onTyping={() => setLastTyped(Date.now())}
      />

      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        settings={state.settings}
        onChange={patchSettings}
        onClose={() => setSettingsOpen(false)}
        onExportAll={exportAll}
        onImport={importBackup}
        onReset={resetAll}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
