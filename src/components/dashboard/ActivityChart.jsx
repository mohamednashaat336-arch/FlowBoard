import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { localDateKey, sessionDate, shortDate, startOfWeek } from '../../utils/date.js'

const fallbackActivity = [
  { created: 3, completed: 1 },
  { created: 4, completed: 2 },
  { created: 2, completed: 2 },
  { created: 5, completed: 3 },
  { created: 4, completed: 2 },
  { created: 6, completed: 4 },
]

function buildActivity(tasks) {
  const now = sessionDate
  const currentWeek = startOfWeek(now)
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(currentWeek)
    start.setDate(start.getDate() - (5 - index) * 7)
    return {
      key: localDateKey(start),
      label: shortDate(start),
      created: 0,
      completed: 0,
      days: new Set(),
    }
  })

  for (const task of tasks) {
    for (const [field, value] of [['created', task.createdAt], ['completed', task.completedAt]]) {
      if (typeof value !== 'string') continue
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) continue
      const weekStart = localDateKey(startOfWeek(date))
      const week = weeks.find((item) => item.key === weekStart)
      if (week) {
        week[field] += 1
        week.days.add(localDateKey(date))
      }
    }
  }

  const eventCount = weeks.reduce((sum, week) => sum + week.created + week.completed, 0)
  const activeDays = new Set(weeks.flatMap((week) => [...week.days])).size
  if (eventCount >= 4 && activeDays >= 3) {
    return {
      data: weeks.map(({ label, created, completed }) => ({ label, created, completed })),
      source: 'Based on sample task dates saved in this workspace.',
      isSample: false,
    }
  }

  return {
    data: weeks.map((week, index) => ({ label: week.label, ...fallbackActivity[index] })),
    source: 'Illustrative demo activity — no recent task history is available yet.',
    isSample: true,
  }
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="fb-chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.dataKey}>
          <i style={{ background: item.color }} />
          {item.dataKey === 'created' ? 'Created' : 'Completed'}: {item.value}
        </span>
      ))}
    </div>
  )
}

export default function ActivityChart({ tasks }) {
  const { data, source, isSample } = buildActivity(tasks)

  return (
    <section aria-labelledby="activity-title" className="fb-panel fb-activity-panel">
      <div className="fb-section-heading">
        <div>
          <h2 id="activity-title">Task activity</h2>
          <p>Created and completed over the last six weeks</p>
        </div>
        <span className={`fb-data-tag${isSample ? ' is-demo' : ''}`}>
          {isSample ? 'Demo activity' : 'Workspace sample'}
        </span>
      </div>
      <div aria-label="Task activity chart" className="fb-chart-wrap" role="img">
        <ResponsiveContainer height="100%" minHeight={220} width="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" vertical={false} />
            <XAxis axisLine={false} dataKey="label" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 11 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-border)' }} />
            <Area dataKey="created" fill="var(--color-primary-soft)" fillOpacity={0.9} isAnimationActive={false} name="Created" stroke="var(--color-primary)" strokeWidth={2} type="monotone" />
            <Area dataKey="completed" fill="transparent" isAnimationActive={false} name="Completed" stroke="var(--color-muted)" strokeDasharray="4 4" strokeWidth={2} type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="fb-chart-legend" aria-hidden="true">
        <span><i className="fb-chart-legend__created" />Created</span>
        <span><i className="fb-chart-legend__completed" />Completed</span>
      </div>
      <p className="fb-chart-source">{source}</p>
    </section>
  )
}
