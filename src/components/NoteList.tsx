import { Note } from '../lib/types'
import { excerpt } from '../lib/markdown'
import { relativeTime } from '../lib/storage'

interface Props {
  notes: Note[]
  activeId: string | null
  query: string
  sort: string
  trashMode: boolean
  onQuery: (q: string) => void
  onSort: (s: string) => void
  onSelect: (id: string) => void
  onNew: () => void
  onRestore: (id: string) => void
  onPurge: (id: string) => void
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function NoteList({
  notes,
  activeId,
  query,
  sort,
  trashMode,
  onQuery,
  onSort,
  onSelect,
  onNew,
  onRestore,
  onPurge,
}: Props) {
  return (
    <section className="list">
      <div className="list-top">
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
          />
          {query && (
            <button className="search-clear" onClick={() => onQuery('')}>
              ×
            </button>
          )}
        </div>
        <button className="new-btn" onClick={onNew} title="New note (N)">
          +
        </button>
      </div>

      <div className="list-meta">
        <span>
          {notes.length} {trashMode ? 'in trash' : notes.length === 1 ? 'note' : 'notes'}
        </span>
        <select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort notes">
          <option value="updated">Recently edited</option>
          <option value="created">Recently created</option>
          <option value="title">Title A–Z</option>
          <option value="words">Longest</option>
        </select>
      </div>

      <div className="list-scroll">
        {notes.length === 0 && (
          <div className="list-empty">
            {trashMode ? 'Trash is empty ✨' : query ? 'No matches.' : 'No notes yet — create one!'}
          </div>
        )}
        {notes.map((n) => (
          <article
            key={n.id}
            className={`card card--${n.color} ${n.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(n.id)}
          >
            <div className="card-top">
              <h3>{highlight(n.title || 'Untitled note', query)}</h3>
              <div className="card-flags">
                {n.pinned && <span title="Pinned">📌</span>}
                {n.favorite && <span title="Favourite">★</span>}
              </div>
            </div>
            <p className="card-ex">{excerpt(n.body) || 'Empty note'}</p>
            <div className="card-foot">
              <span className="card-time">{relativeTime(n.updatedAt)}</span>
              {n.tags.slice(0, 3).map((t) => (
                <span className="chip" key={t}>
                  #{t}
                </span>
              ))}
            </div>
            {trashMode && (
              <div className="card-trash-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRestore(n.id)
                  }}
                >
                  Restore
                </button>
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPurge(n.id)
                  }}
                >
                  Delete forever
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
