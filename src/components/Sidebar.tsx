import Pet, { Mood } from './Pet'
import Heatmap from './Heatmap'
import ProgressRing from './ProgressRing'
import { HeatCell, LevelInfo, StreakInfo } from '../lib/streak'

export type View = 'all' | 'favorites' | 'pinned' | 'trash'

interface Props {
  petName: string
  mood: Mood
  say: string | null
  level: LevelInfo
  streak: StreakInfo
  grid: HeatCell[][]
  goal: number
  today: number
  totalNotes: number
  lifetimeWords: number
  freezes: number
  view: View
  tags: [string, number][]
  activeTag: string | null
  counts: Record<View, number>
  onPet: () => void
  onView: (v: View) => void
  onTag: (t: string | null) => void
  onOpenSettings: () => void
  onOpenPalette: () => void
}

export default function Sidebar({
  petName,
  mood,
  say,
  level,
  streak,
  grid,
  goal,
  today,
  totalNotes,
  lifetimeWords,
  freezes,
  view,
  tags,
  activeTag,
  counts,
  onPet,
  onView,
  onTag,
  onOpenSettings,
  onOpenPalette,
}: Props) {
  const goalPct = Math.min(100, (today / Math.max(goal, 1)) * 100)

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
            <rect x="4" y="3" width="24" height="26" rx="6" fill="var(--accent)" opacity="0.18" />
            <rect x="4" y="3" width="24" height="26" rx="6" stroke="var(--accent)" strokeWidth="1.6" fill="none" />
            <path d="M10 11h12M10 16h12M10 21h7" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="brand-text">
          <strong>Inkling</strong>
          <span>notes · streaks · buddy</span>
        </div>
        <Pet name={petName} mood={mood} level={level.level} say={say} onPet={onPet} size={42} />
      </div>

      <div className="streak-card">
        <div className="streak-main">
          <div className={`flame ${streak.current > 0 ? 'lit' : ''}`}>
            <span className="flame-glyph">{streak.current > 0 ? '🔥' : '🕯️'}</span>
            <div>
              <strong>{streak.current}</strong>
              <span>day streak</span>
            </div>
          </div>
          <ProgressRing
            pct={goalPct}
            size={76}
            stroke={7}
            label={`${today}`}
            sub={`/ ${goal}`}
          />
        </div>
        <div className="streak-sub">
          <div>
            <b>{streak.longest}</b>
            <span>best</span>
          </div>
          <div>
            <b>{streak.totalActiveDays}</b>
            <span>active days</span>
          </div>
          <div title="Earned every 7 days — auto-protects a missed day">
            <b>❄ {freezes}</b>
            <span>freezes</span>
          </div>
        </div>
        {!streak.activeToday && (
          <div className="streak-warn">
            {streak.current > 0
              ? `Write ${goal} words to keep your ${streak.current}-day streak alive`
              : 'Write today to start a streak'}
          </div>
        )}
      </div>

      <div className="level-card">
        <div className="level-top">
          <span className="level-badge">Lv {level.level}</span>
          <span className="level-title">{level.title}</span>
        </div>
        <div className="level-bar">
          <div style={{ width: `${level.pct}%` }} />
        </div>
        <div className="level-foot">
          <span>
            {level.into} / {level.need} XP
          </span>
          <span>{lifetimeWords.toLocaleString()} words total</span>
        </div>
      </div>

      <Heatmap grid={grid} goal={goal} />

      <nav className="nav">
        {(
          [
            ['all', 'All notes', '🗒'],
            ['favorites', 'Favourites', '★'],
            ['pinned', 'Pinned', '📌'],
            ['trash', 'Trash', '🗑'],
          ] as [View, string, string][]
        ).map(([id, label, icon]) => (
          <button
            key={id}
            className={`nav-item ${view === id && !activeTag ? 'active' : ''}`}
            onClick={() => {
              onTag(null)
              onView(id)
            }}
          >
            <span className="nav-icon">{icon}</span>
            {label}
            <span className="nav-count">{counts[id]}</span>
          </button>
        ))}
      </nav>

      {tags.length > 0 && (
        <div className="tags-section">
          <div className="section-title">Tags</div>
          <div className="tag-cloud">
            {tags.map(([t, n]) => (
              <button
                key={t}
                className={`tag-pill ${activeTag === t ? 'active' : ''}`}
                onClick={() => onTag(activeTag === t ? null : t)}
              >
                #{t} <span>{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-foot">
        <span className="foot-stat">{totalNotes} notes stored locally</span>
        <div className="foot-actions">
          <button onClick={onOpenPalette} title="Command palette (⌘K)">⌘K</button>
          <button onClick={onOpenSettings} title="Settings">⚙</button>
        </div>
      </div>
    </aside>
  )
}
