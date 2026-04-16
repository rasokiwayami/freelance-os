import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Papa from 'papaparse'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { useProjectTemplates } from '../hooks/useProjectTemplates'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select'
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, LayoutList,
  Kanban, GanttChartSquare, Download, BookTemplate, ChevronDown as Expand,
  ChevronRight,
} from 'lucide-react'
import { KanbanBoard } from '../features/projects/KanbanBoard'
import { ProjectTimeline } from '../features/projects/ProjectTimeline'
import { TaskList } from '../features/projects/TaskList'
import { SkeletonTable } from '../components/ui/skeleton'

const STATUS_LABELS = {
  estimate: '見積',
  in_progress: '進行中',
  completed: '完了',
  invoiced: '請求済',
  paid: '入金済',
}

const STATUS_COLORS = {
  estimate: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  invoiced: 'outline',
  paid: 'outline',
}

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const schema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  client_id: z.string().optional(),
  status: z.string(),
  amount: z.coerce.number().int().min(0, '0以上の整数を入力してください'),
  deadline: z.string().optional(),
  description: z.string().optional(),
})

const VIEWS = [
  { id: 'list', label: 'リスト', Icon: LayoutList },
  { id: 'kanban', label: 'カンバン', Icon: Kanban },
  { id: 'timeline', label: 'タイムライン', Icon: GanttChartSquare },
]

export default function ProjectsPage() {
  const { data: projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { data: clients } = useClients()
  const { data: templates } = useProjectTemplates()

  const [view, setView] = useState('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortDir, setSortDir] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const { createTemplate } = useProjectTemplates()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', status: 'estimate', amount: 0 },
  })

  const openCreate = (template = null) => {
    reset({
      title: template?.name ? `${template.name}の案件` : '',
      client_id: '',
      status: 'estimate',
      amount: 0,
      deadline: '',
      description: template?.default_description ?? '',
    })
    setEditing(null)
    setFormOpen(true)
    setTemplateDialogOpen(false)
  }

  const openEdit = (p) => {
    reset({
      title: p.title,
      client_id: p.client_id ?? '',
      status: p.status,
      amount: p.amount,
      deadline: p.deadline ?? '',
      description: p.description ?? '',
    })
    setEditing(p)
    setFormOpen(true)
  }

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      client_id: values.client_id || null,
      deadline: values.deadline || null,
    }
    if (editing) {
      await updateProject(editing.id, payload)
    } else {
      await createProject(payload)
    }
    setFormOpen(false)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return
    await createTemplate({
      name: templateName,
      default_description: watch('description') || '',
    })
    setSaveTemplateOpen(false)
    setTemplateName('')
  }

  const handleStatusChange = async (id, newStatus) => {
    await updateProject(id, { status: newStatus })
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      displayed.map((p) => ({
        タイトル: p.title,
        クライアント: p.clients?.name ?? '',
        ステータス: STATUS_LABELS[p.status],
        金額: p.amount,
        締め切り: p.deadline ?? '',
        詳細: p.description ?? '',
      }))
    )
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projects_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  let displayed = statusFilter === 'all' ? projects : projects.filter((p) => p.status === statusFilter)
  if (sortDir) {
    displayed = [...displayed].sort((a, b) =>
      sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount
    )
  }

  const toggleSort = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">案件</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setTemplateDialogOpen(true)}>
            <BookTemplate size={14} className="mr-1" /> テンプレート
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={14} className="mr-1" /> CSV
          </Button>
          <Button onClick={() => openCreate()} size="sm">
            <Plus size={16} className="mr-1" /> 新規案件
          </Button>
        </div>
      </div>

      {/* ビュー切り替え */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex border rounded-lg overflow-hidden">
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
        {view === 'list' && (
          <div className="flex gap-2 flex-wrap">
            {['all', 'estimate', 'in_progress', 'completed', 'invoiced', 'paid'].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'すべて' : STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* カンバン */}
      {view === 'kanban' && (
        loading ? <SkeletonTable rows={4} /> :
        <KanbanBoard
          projects={projects}
          onEdit={openEdit}
          onDelete={(p) => setDeleteTarget(p)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* タイムライン */}
      {view === 'timeline' && (
        <Card>
          <CardHeader><CardTitle>プロジェクトタイムライン</CardTitle></CardHeader>
          <CardContent>
            {loading ? <SkeletonTable rows={4} /> : <ProjectTimeline projects={projects} />}
          </CardContent>
        </Card>
      )}

      {/* リスト */}
      {view === 'list' && (
        loading ? <SkeletonTable rows={5} /> :
        displayed.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">案件がありません</p>
        ) : (
          <>
            {/* デスクトップ: テーブル */}
            <div className="rounded-lg border hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>クライアント</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1" onClick={toggleSort}>
                        金額
                        {sortDir === 'asc' ? <ChevronUp size={14} /> : sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} className="opacity-30" />}
                      </button>
                    </TableHead>
                    <TableHead>締め切り</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((p) => (
                    <>
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <button
                            className="flex items-center gap-1 hover:text-primary"
                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                          >
                            {expandedId === p.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            {p.title}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.clients?.name ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                        </TableCell>
                        <TableCell>{fmt(p.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.deadline ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === p.id && (
                        <TableRow key={`${p.id}-tasks`}>
                          <TableCell colSpan={6} className="bg-muted/30 py-3 px-6">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">タスク</p>
                            <TaskList projectId={p.id} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* モバイル: カード */}
            <div className="grid gap-3 md:hidden">
              {displayed.map((p) => (
                <Card key={p.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.title}</p>
                        {p.clients?.name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.clients.name}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(p)}>
                          <Trash2 size={13} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={STATUS_COLORS[p.status]} className="text-xs">{STATUS_LABELS[p.status]}</Badge>
                      <span className="text-sm font-semibold">{fmt(p.amount)}</span>
                      {p.deadline && <span className="text-xs text-muted-foreground ml-auto">{p.deadline}</span>}
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">タスク</p>
                      <TaskList projectId={p.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )
      )}

      {/* 登録/編集モーダル */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '案件を編集' : '新規案件'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>タイトル *</Label>
              <Input {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>クライアント</Label>
              <Select value={watch('client_id') || ''} onValueChange={(v) => setValue('client_id', v)}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>ステータス</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>金額（円）*</Label>
              <Input type="number" min="0" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>締め切り</Label>
              <Input type="date" {...register('deadline')} />
            </div>

            <div className="space-y-1">
              <Label>詳細</Label>
              <Textarea {...register('description')} rows={3} />
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSaveTemplateOpen(true)}
              >
                テンプレートとして保存
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>キャンセル</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* テンプレート選択ダイアログ */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>テンプレートから作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => openCreate(null)}
            >
              <Plus size={14} className="mr-2" /> 空白から作成
            </Button>
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                保存済みテンプレートがありません
              </p>
            )}
            {templates.map((t) => (
              <Button
                key={t.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => openCreate(t)}
              >
                <BookTemplate size={14} className="mr-2" /> {t.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* テンプレート名入力ダイアログ */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>テンプレートとして保存</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="テンプレート名"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>キャンセル</Button>
              <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`「${deleteTarget?.title}」を削除しますか？`}
        onConfirm={async () => {
          if (deleteTarget) await deleteProject(deleteTarget.id)
        }}
      />
    </div>
  )
}
