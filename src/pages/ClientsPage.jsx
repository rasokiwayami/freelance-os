import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClients } from '../hooks/useClients'
import { useProjects } from '../hooks/useProjects'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Plus, Pencil, Trash2, Building2, Mail } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください').or(z.literal('')),
  company: z.string().optional(),
  notes: z.string().optional(),
})

export default function ClientsPage() {
  const { data: clients, loading, createClient, updateClient, deleteClient } = useClients()
  const { data: projects } = useProjects()

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
        <h1 className="text-2xl font-semibold">クライアント</h1>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" /> 新規クライアント
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
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
                {c.company && (
                  <p className="flex items-center gap-1"><Building2 size={13} />{c.company}</p>
                )}
                {c.email && (
                  <p className="flex items-center gap-1"><Mail size={13} />{c.email}</p>
                )}
                <p className="pt-1 font-medium text-foreground">
                  案件 {projectCount(c.id)} 件
                </p>
                {c.notes && <p className="text-xs">{c.notes}</p>}
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
            ? `⚠ このクライアントには ${projectCount(deleteTarget.id)} 件の案件が紐づいています。削除すると案件のクライアント情報が失われます。`
            : undefined
        }
        onConfirm={async () => { await deleteClient(deleteTarget.id) }}
      />
    </div>
  )
}
