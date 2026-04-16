import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'
import { useTransactions } from '../hooks/useTransactions'
import { useClientNotes } from '../hooks/useClientNotes'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Plus, Pencil, Trash2, Building2, Mail, ChevronDown, ChevronRight } from 'lucide-react'
import { SkeletonCard } from '../components/ui/skeleton'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const STATUS_LABELS = {
  estimate: '見積', in_progress: '進行中', completed: '完了',
  invoiced: '請求済', paid: '入金済',
}
const STATUS_COLORS = {
  estimate: 'secondary', in_progress: 'default', completed: 'outline',
  invoiced: 'outline', paid: 'outline',
}

const schema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください').or(z.literal('')),
  company: z.string().optional(),
  notes: z.string().optional(),
})

function ClientNotes({ clientId }) {
  const { data: notes, loading, addNote, deleteNote } = useClientNotes(clientId)
  const [content, setContent] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!content.trim()) return
    setAdding(true)
    await addNote(content.trim())
    setContent('')
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          rows={2}
          placeholder="打ち合わせ内容、連絡事項など..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="text-sm"
        />
        <Button size="sm" onClick={handleAdd} disabled={adding || !content.trim()} className="self-end">
          追加
        </Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md group">
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(note.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => deleteNote(note.id)}
            >
              <Trash2 size={11} className="text-destructive" />
            </Button>
          </div>
        ))}
        {!loading && notes.length === 0 && (
          <p className="text-xs text-muted-foreground">メモがありません</p>
        )}
      </div>
    </div>
  )
}

function ClientDetail({ client, projects, transactions }) {
  const [open, setOpen] = useState(false)

  const clientProjects = projects.filter((p) => p.client_id === client.id)
  const clientTransactions = transactions.filter((t) =>
    clientProjects.some((p) => p.id === t.project_id)
  )
  const totalRevenue = clientTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="border-t pt-3 mt-2">
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        詳細を{open ? '閉じる' : '見る'}
      </button>

      {open && (
        <div className="space-y-4">
          {/* 合計売上 */}
          <div>
            <p className="text-xs text-muted-foreground">合計売上</p>
            <p className="text-lg font-bold text-green-600">{fmt(totalRevenue)}</p>
          </div>

          {/* 案件一覧 */}
          {clientProjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">案件</p>
              <div className="space-y-1">
                {clientProjects.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Badge variant={STATUS_COLORS[p.status]} className="text-[10px] shrink-0">
                      {STATUS_LABELS[p.status]}
                    </Badge>
                    <span className="text-xs truncate">{p.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 取引履歴 */}
          {clientTransactions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">取引履歴</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {clientTransactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.date}</span>
                    <span className={`text-xs font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* メモ */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">メモ・やりとり履歴</p>
            <ClientNotes clientId={client.id} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function ClientsPage() {
  const { data: clients, loading, createClient, updateClient, deleteClient } = useClients()
  const { data: projects } = useProjects()
  const { data: transactions } = useTransactions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', company: '', notes: '' },
  })

  const openCreate = () => {
    reset({ name: '', email: '', company: '', notes: '' })
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (c) => {
    reset({ name: c.name, email: c.email ?? '', company: c.company ?? '', notes: c.notes ?? '' })
    setEditing(c)
    setFormOpen(true)
  }

  const onSubmit = async (values) => {
    const payload = { ...values, email: values.email || null }
    if (editing) await updateClient(editing.id, payload)
    else await createClient(payload)
    setFormOpen(false)
  }

  const projectCount = (clientId) => projects.filter((p) => p.client_id === clientId).length
  const hasProjects = (clientId) => projectCount(clientId) > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">クライアント</h1>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" /> 新規クライアント
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : clients.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">クライアントがありません</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {c.company && <p className="flex items-center gap-1"><Building2 size={13} />{c.company}</p>}
                {c.email && <p className="flex items-center gap-1"><Mail size={13} />{c.email}</p>}
                <p className="pt-1 font-medium text-foreground">案件 {projectCount(c.id)} 件</p>
                {c.notes && <p className="text-xs">{c.notes}</p>}

                <ClientDetail client={c} projects={projects} transactions={transactions} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 登録/編集モーダル */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'クライアントを編集' : '新規クライアント'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>名前 *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>メールアドレス</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>会社名</Label>
              <Input {...register('company')} />
            </div>
            <div className="space-y-1">
              <Label>メモ</Label>
              <Textarea {...register('notes')} rows={3} />
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
        title={`「${deleteTarget?.name}」を削除しますか？`}
        description={
          deleteTarget && hasProjects(deleteTarget.id)
            ? `⚠ このクライアントには ${projectCount(deleteTarget.id)} 件の案件が紐づいています。`
            : undefined
        }
        onConfirm={async () => { await deleteClient(deleteTarget.id) }}
      />
    </div>
  )
}
