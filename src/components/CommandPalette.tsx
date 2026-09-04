import { useEffect, useMemo, useRef, useState } from 'react'

export interface Command {
  id: string
  label: string
  hint?: string
  icon?: string
  run: () => void
}

interface Props {
  open: boolean
  commands: Command[]
  onClose: () => void
}

export default function CommandPalette({ open, commands, onClose }: Props) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return commands.slice(0, 12)
    return commands
      .filter((c) => (c.label + ' ' + (c.hint || '')).toLowerCase().includes(s))
      .slice(0, 12)
  }, [q, commands])

  useEffect(() => setI(0), [q])

  if (!open) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setI((v) => (v + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setI((v) => (v - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[i]?.run()
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command or search notes…"
          className="palette-input"
        />
        <div className="palette-list">
          {results.length === 0 && <div className="palette-empty">Nothing found</div>}
          {results.map((c, idx) => (
            <button
              key={c.id}
              className={`palette-item ${idx === i ? 'active' : ''}`}
              onMouseEnter={() => setI(idx)}
              onClick={() => {
                c.run()
                onClose()
              }}
            >
              <span className="palette-icon">{c.icon ?? '›'}</span>
              <span className="palette-label">{c.label}</span>
              {c.hint && <span className="palette-hint">{c.hint}</span>}
            </button>
          ))}
        </div>
        <div className="palette-foot">
          <kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> select · <kbd>esc</kbd> close
        </div>
      </div>
    </div>
  )
}
