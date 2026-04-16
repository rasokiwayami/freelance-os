import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Pencil, Trash2, GripVertical } from 'lucide-react'

const COLUMNS = [
  { id: 'estimate', label: '見積', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'in_progress', label: '進行中', color: 'bg-blue-50 dark:bg-blue-950' },
  { id: 'completed', label: '完了', color: 'bg-green-50 dark:bg-green-950' },
  { id: 'invoiced', label: '請求済', color: 'bg-amber-50 dark:bg-amber-950' },
  { id: 'paid', label: '入金済', color: 'bg-purple-50 dark:bg-purple-950' },
]

const STATUS_COLORS = {
  estimate: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  invoiced: 'outline',
  paid: 'outline',
}

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

function ProjectCard({ project, onEdit, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 shadow-sm group"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{project.title}</p>
          {project.clients?.name && (
            <p className="text-xs text-muted-foreground mt-0.5">{project.clients.name}</p>
          )}
          <p className="text-xs font-semibold text-primary mt-1">{fmt(project.amount)}</p>
          {project.deadline && (
            <p className="text-xs text-muted-foreground mt-0.5">期限: {project.deadline}</p>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(project)}>
            <Pencil size={11} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(project)}>
            <Trash2 size={11} className="text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard({ projects, onEdit, onDelete, onStatusChange }) {
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const activeProject = projects.find((p) => p.id === activeId)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    // overがカラムIDの場合
    const newStatus = COLUMNS.find((c) => c.id === over.id)?.id
      || projects.find((p) => p.id === over.id)?.status
    if (newStatus && active.id !== over.id) {
      const project = projects.find((p) => p.id === active.id)
      if (project && project.status !== newStatus) {
        onStatusChange(active.id, newStatus)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.id)
          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-60 rounded-xl ${col.color} p-3`}
              data-column-id={col.id}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">{colProjects.length}</Badge>
              </div>
              <SortableContext
                items={colProjects.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
                id={col.id}
              >
                <div className="space-y-2 min-h-16">
                  {colProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isDragging={activeId === p.id}
                    />
                  ))}
                  {/* ドロップゾーン */}
                  {colProjects.length === 0 && (
                    <div className="h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">ここにドロップ</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeProject && (
          <div className="bg-card border rounded-lg p-3 shadow-xl w-60">
            <p className="font-medium text-sm">{activeProject.title}</p>
            <p className="text-xs font-semibold text-primary mt-1">{fmt(activeProject.amount)}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
