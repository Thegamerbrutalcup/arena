import { HeatCell } from '../lib/streak'

interface Props {
  grid: HeatCell[][]
  goal: number
}

function level(words: number, goal: number) {
  if (words <= 0) return 0
  const r = words / Math.max(goal, 1)
  if (r < 0.25) return 1
  if (r < 0.6) return 2
  if (r < 1) return 3
  return 4
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Heatmap({ grid, goal }: Props) {
  // Month labels: show when the first day of a column starts a new month.
  const labels = grid.map((col, i) => {
    const first = col[0].date
    const prev = i > 0 ? grid[i - 1][0].date : null
    return !prev || prev.getMonth() !== first.getMonth() ? MONTHS[first.getMonth()] : ''
  })

  return (
    <div className="heat">
      <div className="heat-months">
        {labels.map((l, i) => (
          <span key={i} className="heat-month">
            {l}
          </span>
        ))}
      </div>
      <div className="heat-grid">
        {grid.map((col, i) => (
          <div className="heat-col" key={i}>
            {col.map((c) => (
              <div
                key={c.key}
                className={`heat-cell l${c.future ? 0 : level(c.words, goal)} ${c.future ? 'future' : ''}`}
                title={
                  c.future
                    ? ''
                    : `${c.date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })} — ${c.words} word${c.words === 1 ? '' : 's'}`
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-legend">
        <span>less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`heat-cell l${l}`} />
        ))}
        <span>more</span>
      </div>
    </div>
  )
}
