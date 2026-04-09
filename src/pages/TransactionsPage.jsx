import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTransactions } from '../hooks/useTransactions'
import { useProjects } from '../hooks/useProjects'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const schema = z.object({
  amount: z.coerce.number().int().min(1, '1以上の整数を入力してください'),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, '日付は必須です'),
  category: z.string().optional(),
  description: z.string().optional(),
  project_id: z.string().optional(),
})

const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

export default function TransactionsPage() {
  const { data: transactions, loading, createTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { data: projects } = useProjects()

  const [typeFilter, setTypeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', type: 'income', date: new Date().toISOString().slice(0, 10), category: '', description: '', project_id: '' },
  })

  const openCreate = () => {
    reset({ amount: '', type: 'income', date: new Date().toISOString().slice(0, 10), category: '', description: '', project_id: '' })
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (t) => {
    reset({
      amount: t.amount,
      type: t.type,
      date: t.date,
      category: t.category ?? '',
      description: t.description ?? '',
      project_id: t.project_id ?? '',
    })
    setEditing(t)
    setFormOpen(true)
  }

  const onSubmit = async (values) => {
    const payload = { ...values, project_id: values.project_id || null }
    if (editing) await updateTransaction(editing.id, payload)
    else await createTransaction(payload)
    setFormOpen(false)
  }

  // フィルタ
  let displayed = transactions
  if (typeFilter !== 'all') displayed = displayed.filter((t) => t.type === typeFilter)
  if (monthFilter) displayed = displayed.filter((t) => t.date.startsWith(monthFilter))

  // 月一覧（ユニーク）
  const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort().reverse()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">入出金</h1>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" /> 新規登録
        </Button>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap gap-2">
        {[['all', 'すべて'], ['income', '収入'], ['expense', '支出']].map(([v, l]) => (
          <Button key={v} variant={typeFilter === v ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(v)}>
            {l}
          </Button>
        ))}
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="月を絞り込む" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">すべての月</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : displayed.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">データがありません</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>金額</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>説明</TableHead>
                <TableHead>案件</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{t.date}</TableCell>
                  <TableCell>
                    <Badge variant={t.type === 'income' ? 'default' : 'secondary'}>
                      {t.type === 'income' ? '収入' : '支出'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.category ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{t.description ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{t.projects?.title ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)}>
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
            <DialogTitle>{editing ? '入出金を編集' : '新規登録'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>種別 *</Label>
              <Select value={watch('type')} onValueChange={(v) => setValue('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">収入</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>金額（円）*</Label>
              <Input type="number" min="1" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>日付 *</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>カテゴリ</Label>
              <Input {...register('category')} placeholder="例：開発費、交通費" />
            </div>

            <div className="space-y-1">
              <Label>説明</Label>
              <Input {...register('description')} />
            </div>

            <div className="space-y-1">
              <Label>紐づく案件</Label>
              <Select value={watch('project_id') || ''} onValueChange={(v) => setValue('project_id', v)}>
                <SelectTrigger><SelectValue placeholder="なし" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        title="この入出金を削除しますか？"
        onConfirm={async () => { await deleteTransaction(deleteTarget.id) }}
      />
    </div>
  )
}
