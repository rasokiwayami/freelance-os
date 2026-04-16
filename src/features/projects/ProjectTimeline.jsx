import { useMemo } from 'react'

const STATUS_COLORS = {
  estimate: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  invoiced: 'bg-amber-500',
  paid: 'bg-purple-500',
}

const STATUS_LABELS = {
  estimate: '見積',
  in_progress: '進行中',
  completed: '完了',
  invoiced: '請求済',
  paid: '入金済',
}

export function ProjectTimeline({ projects }) {
  const projectsWithDates = projects.filter((p) => p.deadline)

  const { minDate, maxDate } = useMemo(() => {
    if (projectsWithDates.length === 0) return { minDate: null, maxDate: null }
    const dates = projectsWithDates.map((p) => new Date(p.deadline))
    const today = new Date()
    const allDates = [...dates, today]
    return {
      minDate: new Date(Math.min(...allDates.map((d) => d.getTime()))),
      maxDate: new Date(Math.max(...allDates.map((d) => d.getTime()))),
    }
  }, [projectsWithDates])

  if (projectsWithDates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        締切日が設定された案件がありません
      </p>
    )
  }

  const totalDays = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24))
  const todayOffset = ((new Date() - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100

  return (
    <div className="space-y-3 overflow-x-auto">
      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded-sm ${STATUS_COLORS[k]}`} />
            {v}
          </span>
        ))}
      </div>

      {/* タイムライン */}
      <div className="relative min-w-[600px]">
        {/* 今日の縦線 */}
        {todayOffset >= 0 && todayOffset <= 100 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
            style={{ left: `${todayOffset}%` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 text-xs text-red-500 font-medium whitespace-nowrap">
              今日
            </span>
          </div>
        )}

        {projectsWithDates.map((p) => {
          const deadlineDate = new Date(p.deadline)
          const startDate = p.created_at ? new Date(p.created_at) : new Date(minDate)
          const startOffset = Math.max(0, ((startDate - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100)
          const endOffset = Math.min(100, ((deadlineDate - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100)
          const width = Math.max(2, endOffset - startOffset)

          return (
            <div key={p.id} className="flex items-center gap-3 mb-2">
              <div className="w-32 flex-shrink-0 text-xs text-right text-muted-foreground truncate">
                {p.title}
              </div>
              <div className="flex-1 relative h-7 bg-muted rounded-md">
                <div
                  className={`absolute top-1 bottom-1 rounded-sm ${STATUS_COLORS[p.status]} opacity-80 flex items-center px-1 overflow-hidden`}
                  style={{ left: `${startOffset}%`, width: `${width}%` }}
                  title={`${p.title}: ${p.deadline}`}
                >
                  {width > 5 && (
                    <span className="text-white text-[10px] truncate">{p.deadline}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
