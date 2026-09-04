import { useRef } from 'react'
import { Settings } from '../lib/types'

interface Props {
  open: boolean
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onClose: () => void
  onExportAll: () => void
  onImport: (file: File) => void
  onReset: () => void
}

const ACCENTS = ['#8b7cf6', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#f472b6']

export default function SettingsModal({
  open,
  settings,
  onChange,
  onClose,
  onExportAll,
  onImport,
  onReset,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  if (!open) return null

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>Settings</h2>
          <button className="ghost" onClick={onClose}>×</button>
        </header>

        <div className="modal-body">
          <label className="field">
            <span>Theme</span>
            <div className="seg">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  className={settings.theme === t ? 'on' : ''}
                  onClick={() => onChange({ theme: t })}
                >
                  {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              ))}
            </div>
          </label>

          <label className="field">
            <span>Accent</span>
            <div className="accents">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  className={`accent-dot ${settings.accent === a ? 'sel' : ''}`}
                  style={{ background: a }}
                  onClick={() => onChange({ accent: a })}
                />
              ))}
            </div>
          </label>

          <label className="field">
            <span>Daily word goal</span>
            <div className="range-row">
              <input
                type="range"
                min={50}
                max={1500}
                step={50}
                value={settings.dailyGoal}
                onChange={(e) => onChange({ dailyGoal: Number(e.target.value) })}
              />
              <b>{settings.dailyGoal}</b>
            </div>
          </label>

          <label className="field">
            <span>Editor font size</span>
            <div className="range-row">
              <input
                type="range"
                min={13}
                max={22}
                value={settings.fontSize}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              />
              <b>{settings.fontSize}px</b>
            </div>
          </label>

          <label className="field">
            <span>Buddy name</span>
            <input
              className="text-input"
              value={settings.petName}
              maxLength={16}
              onChange={(e) => onChange({ petName: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Buddy chatter</span>
            <div className="seg">
              <button className={settings.petEnabled ? 'on' : ''} onClick={() => onChange({ petEnabled: true })}>
                On
              </button>
              <button className={!settings.petEnabled ? 'on' : ''} onClick={() => onChange({ petEnabled: false })}>
                Off
              </button>
            </div>
          </label>

          <div className="field field--col">
            <span>Your data</span>
            <p className="hint">
              Everything lives in this browser's local storage. Export regularly if it matters to you.
            </p>
            <div className="btn-row">
              <button className="btn" onClick={onExportAll}>⭳ Export backup (.json)</button>
              <button className="btn" onClick={() => fileRef.current?.click()}>⭱ Import backup</button>
              <button className="btn danger" onClick={onReset}>Reset everything</button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
                e.target.value = ''
              }}
            />
          </div>

          <div className="field field--col">
            <span>Keyboard shortcuts</span>
            <ul className="shortcuts">
              <li><kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> command palette</li>
              <li><kbd>N</kbd> new note <span className="dim">(outside inputs)</span></li>
              <li><kbd>/</kbd> focus search</li>
              <li><kbd>⌘</kbd> + <kbd>B</kbd> / <kbd>I</kbd> bold / italic</li>
              <li><kbd>Esc</kbd> close dialogs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
