import { useEffect, useMemo, useRef, useState } from 'react'
import { Note, NoteColor } from '../lib/types'
import { renderMarkdown } from '../lib/markdown'
import { countWords, relativeTime } from '../lib/storage'

interface Props {
  note: Note | null
  splitView: boolean
  fontSize: number
  saving: boolean
  onChange: (patch: Partial<Note>) => void
  onToggleSplit: () => void
  onDelete: () => void
  onExport: () => void
  onTyping: () => void
}

const COLORS: NoteColor[] = ['default', 'violet', 'blue', 'green', 'amber', 'rose']

export default function Editor({
  note,
  splitView,
  fontSize,
  saving,
  onChange,
  onToggleSplit,
  onDelete,
  onExport,
  onTyping,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [tagDraft, setTagDraft] = useState('')
  const [zen, setZen] = useState(false)

  useEffect(() => setTagDraft(''), [note?.id])

  const html = useMemo(() => (note ? renderMarkdown(note.body) : ''), [note?.body, note?.id])
  const words = note ? countWords(note.body) : 0
  const chars = note?.body.length ?? 0
  const mins = Math.max(1, Math.round(words / 200))

  if (!note) {
    return (
      <section className="editor editor--empty">
        <div className="empty-state">
          <div className="empty-glyph">✍️</div>
          <h2>No note selected</h2>
          <p>
            Pick a note on the left, or press <kbd>N</kbd> to start a fresh one.
          </p>
        </div>
      </section>
    )
  }

  /** Wrap or prefix the current selection in the textarea. */
  const surround = (before: string, after = before, placeholder = 'text') => {
    const ta = taRef.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    const value = ta.value
    const sel = value.slice(s, e) || placeholder
    const next = value.slice(0, s) + before + sel + after + value.slice(e)
    onChange({ body: next })
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = s + before.length
      ta.selectionEnd = s + before.length + sel.length
    })
  }

  const prefixLines = (prefix: string | ((i: number) => string)) => {
    const ta = taRef.current
    if (!ta) return
    const value = ta.value
    const s = value.lastIndexOf('\n', ta.selectionStart - 1) + 1
    const e = value.indexOf('\n', ta.selectionEnd)
    const end = e === -1 ? value.length : e
    const block = value.slice(s, end)
    const out = block
      .split('\n')
      .map((l, i) => (typeof prefix === 'string' ? prefix : prefix(i)) + l)
      .join('\n')
    onChange({ body: value.slice(0, s) + out + value.slice(end) })
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = s
      ta.selectionEnd = s + out.length
    })
  }

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, '').toLowerCase()
    if (t && !note.tags.includes(t)) onChange({ tags: [...note.tags, t] })
    setTagDraft('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      surround('**', '**', 'bold')
    } else if (mod && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      surround('*', '*', 'italic')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      surround('  ', '', '')
    } else if (e.key === 'Enter') {
      // Continue lists automatically.
      const ta = e.currentTarget
      const upto = ta.value.slice(0, ta.selectionStart)
      const line = upto.slice(upto.lastIndexOf('\n') + 1)
      const m = line.match(/^(\s*)(- \[ \] |- \[x\] |[-*+] |(\d+)\. )/)
      if (m) {
        if (line.trim() === m[2].trim()) return // empty item: let it break out
        e.preventDefault()
        const bullet = m[3] ? `${Number(m[3]) + 1}. ` : m[2].replace('[x]', '[ ]')
        const insert = '\n' + m[1] + bullet
        const pos = ta.selectionStart
        const next = ta.value.slice(0, pos) + insert + ta.value.slice(ta.selectionEnd)
        onChange({ body: next })
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = pos + insert.length
        })
      }
    }
  }

  return (
    <section className={`editor ${zen ? 'editor--zen' : ''}`}>
      <header className="editor-bar">
        <div className="tools">
          <button onClick={() => prefixLines('# ')} title="Heading">H</button>
          <button onClick={() => surround('**', '**', 'bold')} title="Bold (⌘B)"><b>B</b></button>
          <button onClick={() => surround('*', '*', 'italic')} title="Italic (⌘I)"><i>I</i></button>
          <button onClick={() => surround('~~', '~~', 'strike')} title="Strikethrough"><s>S</s></button>
          <span className="tool-div" />
          <button onClick={() => prefixLines('- ')} title="Bullet list">•</button>
          <button onClick={() => prefixLines((i) => `${i + 1}. `)} title="Numbered list">1.</button>
          <button onClick={() => prefixLines('- [ ] ')} title="Task list">☑</button>
          <button onClick={() => prefixLines('> ')} title="Quote">❝</button>
          <span className="tool-div" />
          <button onClick={() => surround('`', '`', 'code')} title="Inline code">{'</>'}</button>
          <button onClick={() => surround('\n```\n', '\n```\n', 'code block')} title="Code block">▤</button>
          <button onClick={() => surround('[', '](https://)', 'link')} title="Link">🔗</button>
        </div>

        <div className="editor-actions">
          <span className={`save-dot ${saving ? 'saving' : ''}`} title={saving ? 'Saving…' : 'Saved'} />
          <button className="ghost" onClick={() => setZen((z) => !z)} title="Focus mode">
            {zen ? '⤢' : '⤡'}
          </button>
          <button className={`ghost ${splitView ? 'on' : ''}`} onClick={onToggleSplit} title="Split preview">
            ◧
          </button>
          <button
            className={`ghost ${note.favorite ? 'on' : ''}`}
            onClick={() => onChange({ favorite: !note.favorite })}
            title="Favourite"
          >
            {note.favorite ? '★' : '☆'}
          </button>
          <button
            className={`ghost ${note.pinned ? 'on' : ''}`}
            onClick={() => onChange({ pinned: !note.pinned })}
            title="Pin"
          >
            📌
          </button>
          <button className="ghost" onClick={onExport} title="Export as Markdown">⭳</button>
          <button className="ghost danger" onClick={onDelete} title="Move to trash">🗑</button>
        </div>
      </header>

      <div className="editor-head">
        <input
          className="title-input"
          value={note.title}
          placeholder="Untitled note"
          onChange={(e) => {
            onChange({ title: e.target.value })
            onTyping()
          }}
        />
        <div className="meta-row">
          <div className="tag-bar">
            {note.tags.map((t) => (
              <span className="tag" key={t}>
                #{t}
                <button onClick={() => onChange({ tags: note.tags.filter((x) => x !== t) })}>×</button>
              </span>
            ))}
            <input
              className="tag-input"
              value={tagDraft}
              placeholder="+ tag"
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag()
                }
                if (e.key === 'Backspace' && !tagDraft && note.tags.length) {
                  onChange({ tags: note.tags.slice(0, -1) })
                }
              }}
              onBlur={addTag}
            />
          </div>
          <div className="color-dots">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`dot dot--${c} ${note.color === c ? 'sel' : ''}`}
                onClick={() => onChange({ color: c })}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`editor-body ${splitView ? 'split' : ''}`}>
        <textarea
          ref={taRef}
          className="writer"
          style={{ fontSize }}
          value={note.body}
          spellCheck
          placeholder="Start writing… Markdown supported."
          onChange={(e) => {
            onChange({ body: e.target.value })
            onTyping()
          }}
          onKeyDown={onKeyDown}
        />
        {splitView && (
          <div className="preview markdown" style={{ fontSize }} dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>

      <footer className="editor-foot">
        <span>{words} words</span>
        <span>{chars} chars</span>
        <span>{mins} min read</span>
        <span className="spacer" />
        <span>edited {relativeTime(note.updatedAt)}</span>
      </footer>
    </section>
  )
}
