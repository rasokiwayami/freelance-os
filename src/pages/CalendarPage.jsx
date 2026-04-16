import { useState, useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import { ja } from 'date-fns/locale'
import 'react-day-picker/style.css'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { FolderKanban, CheckSquare } from 'lucide-react'

const STATUS_COLORS = {
  estimate: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  invoiced: 'bg-amber-500',
  paid: 'bg-purple-500',
}

const STATUS_LABELS = {
  estimate: '見積', in_progress: '進行中', completed: '完了',
  invoiced: '請求済', paid: '入金済',
}

export default function CalendarPage() {
  const [selected, setSelected] = useState(new Date())
  const { data: projects } = useProjects()
  const { data: tasks } = useTasks(null)

  // 締切日付マップ
  const deadlineMap = useMemo(() => {
    const map = {}
    projects.forEach((p) => {
      if (p.deadline) {
        if (!map[p.deadline]) map[p.deadline] = { projects: [], tasks: [] }
        map[p.deadline].projects.push(p)
      }
    })
    tasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = { projects: [], tasks: [] }
        map[t.due_date].tasks.push(t)
      }
    })
    return map
  }, [projects, tasks])

  const selectedDateStr = selected?.toISOString?.().slice(0, 10)
  const selectedItems = selectedDateStr ? deadlineMap[selectedDateStr] : null

  const modifiers = {
    hasDeadline: Object.keys(deadlineMap).map((d) => new Date(d + 'T00:00:00')),
  }

  const modifiersStyles = {
    hasDeadline: { fontWeight: 'bold' },
  }

  const modifiersClassNames = {
    hasDeadline: 'rdp-has-deadline',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">カレンダー</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* カレンダー */}
        <Card className="flex-shrink-0">
          <CardContent className="pt-4">
            <style>{`
              .rdp-has-deadline::after {
                content: '';
                display: block;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #6366f1;
                margin: 1px auto 0;
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              modifiersClassNames={modifiersClassNames}
              locale={ja}
              showOutsideDays
              fixedWeeks
            />
          </CardContent>
        </Card>

        {/* 選択日の詳細 */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selected
                  ? selected.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '日付を選択してください'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedItems ? (
                <p className="text-sm text-muted-foreground">この日の締切はありません</p>
              ) : (
                <div className="space-y-3">
                  {selectedItems.projects.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                      <FolderKanban size={14} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.title}</p>
                        {p.clients?.name && <p className="text-xs text-muted-foreground">{p.clients.name}</p>}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${STATUS_COLORS[p.status]}`} />
                        {STATUS_LABELS[p.status]}
                      </Badge>
                    </div>
                  ))}
                  {selectedItems.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                      <CheckSquare size={14} className="text-green-600" />
                      <span className={`text-sm flex-1 ${t.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                        {t.title}
                      </span>
                      {t.is_completed && <Badge variant="outline" className="text-xs">完了</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 今後の締切一覧 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">今後30日の締切</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  const today = new Date()
                  const future = new Date(today)
                  future.setDate(future.getDate() + 30)
                  const upcoming = Object.entries(deadlineMap)
                    .filter(([d]) => new Date(d) >= today && new Date(d) <= future)
                    .sort(([a], [b]) => a.localeCompare(b))

                  if (upcoming.length === 0) {
                    return <p className="text-sm text-muted-foreground">締切はありません</p>
                  }

                  return upcoming.map(([date, items]) => (
                    <div key={date} className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground w-20 pt-0.5 shrink-0">{date}</span>
                      <div className="flex-1 space-y-1">
                        {items.projects.map((p) => (
                          <div key={p.id} className="flex items-center gap-1">
                            <FolderKanban size={12} className="text-blue-500" />
                            <span className="text-xs">{p.title}</span>
                          </div>
                        ))}
                        {items.tasks.map((t) => (
                          <div key={t.id} className="flex items-center gap-1">
                            <CheckSquare size={12} className="text-green-500" />
                            <span className="text-xs">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
