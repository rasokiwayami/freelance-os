import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

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

export default function ProjectsPage() {
  const { data: projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { data: clients } = useClients()

  const [statusFilter, setStatusFilter] = useState('all')
  const [sortDir, setSortDir] = useState(null) // 'asc' | 'desc' | null
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // project object
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', status: 'estimate', amount: 0 },
  })

  const openCreate = () => {
    reset({ title: '', client_id: '', status: 'estimate', amount: 0, deadline: '', description: '' })
    setEditing(null)
    setFormOpen(true)
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

  const confirmDelete = async () => {
    if (deleteTarget) await deleteProject(deleteTarget.id)
  }

  // フィルタ & ソート
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">案件</h1>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" /> 新規案件
        </Button>
      </div>

      {/* フィルタ */}
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

      {/* テーブル */}
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : displayed.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">案件がありません</p>
      ) : (
        <div className="rounded-lg border">
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
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>キャンセル</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`「${deleteTarget?.title}」を削除しますか？`}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
