import { useEffect, useMemo, useRef, useState } from 'react'

export type Mood = 'happy' | 'idle' | 'writing' | 'sleepy' | 'worried' | 'celebrate'

interface Props {
  name: string
  mood: Mood
  level: number
  size?: number
  /** message to show in the speech bubble, null hides it */
  say?: string | null
  onPet?: () => void
}

const MOOD_TINT: Record<Mood, [string, string]> = {
  happy: ['#a78bfa', '#6d28d9'],
  idle: ['#8b7cf6', '#4f46e5'],
  writing: ['#38bdf8', '#2563eb'],
  sleepy: ['#94a3b8', '#475569'],
  worried: ['#fbbf24', '#d97706'],
  celebrate: ['#fb7185', '#db2777'],
}

interface Particle {
  id: number
  x: number
  glyph: string
}

export default function Pet({ name, mood, level, size = 44, say, onPet }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pupil, setPupil] = useState({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)
  const [bounce, setBounce] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const pid = useRef(0)

  // Eyes track the cursor.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy) || 1
      const max = 2.6
      const k = Math.min(1, dist / 240)
      setPupil({ x: (dx / dist) * max * k, y: (dy / dist) * max * k })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Random blinking.
  useEffect(() => {
    let t: number
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 130)
        loop()
      }, 1800 + Math.random() * 4200)
    }
    loop()
    return () => window.clearTimeout(t)
  }, [])

  // Little hop when the mood changes to something exciting.
  useEffect(() => {
    if (mood === 'celebrate' || mood === 'happy') {
      setBounce(true)
      const t = window.setTimeout(() => setBounce(false), 700)
      return () => window.clearTimeout(t)
    }
  }, [mood])

  const [from, to] = MOOD_TINT[mood]
  const gradId = useMemo(() => 'petg' + Math.random().toString(36).slice(2, 7), [])

  const pop = (glyph: string) => {
    const id = pid.current++
    setParticles((p) => [...p, { id, x: (Math.random() - 0.5) * 26, glyph }])
    window.setTimeout(() => setParticles((p) => p.filter((q) => q.id !== id)), 1000)
  }

  const handleClick = () => {
    pop(mood === 'sleepy' ? '💤' : ['💜', '✨', '🫧', '💫'][Math.floor(Math.random() * 4)])
    setBounce(true)
    window.setTimeout(() => setBounce(false), 620)
    onPet?.()
  }

  const eyeY = mood === 'sleepy' ? 30 : 28
  const closed = blink || mood === 'sleepy'

  return (
    <div className="pet-wrap" style={{ width: size, height: size }}>
      {say && (
        <div className="pet-bubble" role="status">
          {say}
        </div>
      )}

      <div className="pet-particles">
        {particles.map((p) => (
          <span key={p.id} style={{ left: `calc(50% + ${p.x}px)` }}>
            {p.glyph}
          </span>
        ))}
      </div>

      <button
        ref={ref}
        className={`pet ${bounce ? 'pet--bounce' : ''} pet--${mood}`}
        style={{ width: size, height: size }}
        onClick={handleClick}
        title={`${name} · Lv.${level} — click to pet`}
        aria-label={`${name}, your writing buddy, level ${level}`}
      >
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={from} />
              <stop offset="1" stopColor={to} />
            </linearGradient>
            <radialGradient id={gradId + 'sh'} cx="0.5" cy="0.25" r="0.7">
              <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* antenna */}
          <g className="pet-antenna">
            <path d="M32 10 C32 4 38 4 38 1" stroke={to} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="38.5" cy="1.5" r="3" fill={from} className="pet-antenna-tip" />
          </g>

          {/* body */}
          <path
            className="pet-body"
            d="M32 8c14 0 24 9.5 24 23 0 12.5-8.6 22-24 27C16.6 53 8 43.5 8 31 8 17.5 18 8 32 8z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M32 8c14 0 24 9.5 24 23 0 12.5-8.6 22-24 27C16.6 53 8 43.5 8 31 8 17.5 18 8 32 8z"
            fill={`url(#${gradId}sh)`}
          />

          {/* cheeks */}
          {(mood === 'happy' || mood === 'celebrate') && (
            <>
              <ellipse cx="16" cy="35" rx="4" ry="2.6" fill="#fff" opacity="0.28" />
              <ellipse cx="48" cy="35" rx="4" ry="2.6" fill="#fff" opacity="0.28" />
            </>
          )}

          {/* eyes */}
          {closed ? (
            <>
              <path d={`M18 ${eyeY} q5 4 10 0`} stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <path d={`M36 ${eyeY} q5 4 10 0`} stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="23" cy={eyeY} rx="5.4" ry="5.8" fill="#fff" />
              <ellipse cx="41" cy={eyeY} rx="5.4" ry="5.8" fill="#fff" />
              <circle cx={23 + pupil.x} cy={eyeY + pupil.y} r="2.7" fill="#14151d" />
              <circle cx={41 + pupil.x} cy={eyeY + pupil.y} r="2.7" fill="#14151d" />
              <circle cx={24.2 + pupil.x} cy={eyeY - 1.6 + pupil.y} r="0.95" fill="#fff" />
              <circle cx={42.2 + pupil.x} cy={eyeY - 1.6 + pupil.y} r="0.95" fill="#fff" />
            </>
          )}

          {/* mouth */}
          {mood === 'worried' ? (
            <path d="M26 43 q6 -4 12 0" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          ) : mood === 'writing' ? (
            <ellipse cx="32" cy="42" rx="3.2" ry="3.8" fill="#fff" opacity="0.9" className="pet-mouth-o" />
          ) : mood === 'sleepy' ? (
            <path d="M28 42 h8" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M25 40 q7 7 14 0" stroke="#fff" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          )}
        </svg>

        {mood === 'sleepy' && <span className="pet-z">z</span>}
        {mood === 'writing' && <span className="pet-quill">✎</span>}
      </button>
    </div>
  )
}
