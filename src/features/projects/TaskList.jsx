import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react'
import { SkeletonTable } from '../../components/ui/skeleton'

export function TaskList({ projectId }) {
  const { data: tasks, loading, createTask, deleteTask, toggleTask } = useTasks(projectId)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await createTask({ title: newTitle.trim(), project_id: projectId })
    setNewTitle('')
    setAdding(false)
  }

  if (loading) return <SkeletonTable rows={3} />

  return (
    <div className="space-y-2">
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">タスクがありません</p>
      )}
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 group py-1">
          <button
            onClick={() => toggleTask(t.id, t.is_completed)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {t.is_completed
              ? <CheckCircle2 size={16} className="text-green-500" />
              : <Circle size={16} />}
          </button>
          <span className={`flex-1 text-sm ${t.is_completed ? 'line-through text-muted-foreground' : ''}`}>
            {t.title}
          </span>
          {t.due_date && (
            <span className="text-xs text-muted-foreground">{t.due_date}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => deleteTask(t.id)}
          >
            <Trash2 size={12} className="text-destructive" />
          </Button>
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex gap-2 pt-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="タスクを追加..."
          className="h-8 text-sm"
          disabled={adding}
        />
        <Button type="submit" size="sm" variant="outline" disabled={adding || !newTitle.trim()}>
          <Plus size={14} />
        </Button>
      </form>
    </div>
  )
}
