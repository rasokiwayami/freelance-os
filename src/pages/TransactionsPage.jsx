import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Papa from 'papaparse'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
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
import {
  Plus, Pencil, Trash2, Download, Upload, ChevronUp, ChevronDown,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, AlertTriangle,
} from 'lucide-react'
import { SkeletonTable } from '../components/ui/skeleton'
import { toast } from '../lib/toast'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const CATEGORIES = ['ツール費', '交通費', '通信費', '外注費', '書籍・学習費', '広告費', '消耗品', 'その他']

const PAYMENT_STATUS_LABELS = { unpaid: '未払い', paid: '支払済', overdue: '期限超過' }
const PAYMENT_STATUS_COLORS = { unpaid: 'secondary', paid: 'default', overdue: 'destructive' }

const schema = z.object({
  amount: z.coerce.number().int().min(1, '1以上の整数を入力してください'),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, '日付は必須です'),
  category: z.string().optional(),
  description: z.string().optional(),
  project_id: z.string().optional(),
  payment_status: z.string().optional(),
  due_date: z.string().optional(),
})

export default function TransactionsPage() {
  const { data: transactions, loading, createTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { data: projects } = useProjects()

  const [typeFilter, setTypeFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importPreview, setImportPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '', type: 'income', date: new Date().toISOString().slice(0, 10),
      category: '', description: '', project_id: '', payment_status: 'unpaid', due_date: '',
    },
  })

  const openCreate = () => {
    reset({
      amount: '', type: 'income', date: new Date().toISOString().slice(0, 10),
      category: '', description: '', project_id: '', payment_status: 'unpaid', due_date: '',
    })
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (t) => {
    reset({
      amount: t.amount, type: t.type, date: t.date,
      category: t.category ?? '', description: t.description ?? '',
      project_id: t.project_id ?? '', payment_status: t.payment_status ?? 'unpaid',
      due_date: t.due_date ?? '',
    })
    setEditing(t)
    setFormOpen(true)
  }

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      project_id: values.project_id || null,
      due_date: values.due_date || null,
    }
    if (editing) await updateTransaction(editing.id, payload)
    else await createTransaction(payload)
    setFormOpen(false)
  }

  // 期限超過の自動判定
  const today = new Date().toISOString().slice(0, 10)
  const enriched = transactions.map((t) => ({
    ...t,
    _effectiveStatus:
      t.payment_status === 'paid' ? 'paid'
      : t.due_date && t.due_date < today && t.payment_status !== 'paid' ? 'overdue'
      : t.payment_status ?? 'unpaid',
  }))

  // フィルタ後データ
  let filtered = enriched
  if (typeFilter !== 'all') filtered = filtered.filter((t) => t.type === typeFilter)
  if (paymentFilter !== 'all') filtered = filtered.filter((t) => t._effectiveStatus === paymentFilter)

  // TanStack Table
  const columns = [
    {
      accessorKey: 'date',
      header: '日付',
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue()}</span>,
    },
    {
      accessorKey: 'type',
      header: '種別',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'income' ? 'default' : 'secondary'}>
          {getValue() === 'income' ? '収入' : '支出'}
        </Badge>
      ),
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'amount',
      header: '金額',
      cell: ({ row }) => (
        <span className={`font-semibold text-sm ${row.original.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
          {row.original.type === 'income' ? '+' : '-'}{fmt(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'カテゴリ',
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue() ?? '—'}</span>,
    },
    {
      accessorKey: 'description',
      header: '説明',
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue() ?? '—'}</span>,
    },
    {
      accessorKey: '_effectiveStatus',
      header: '支払状況',
      cell: ({ getValue }) => {
        const s = getValue()
        return (
          <Badge variant={PAYMENT_STATUS_COLORS[s]}>
            {s === 'overdue' && <AlertTriangle size={10} className="mr-1" />}
            {PAYMENT_STATUS_LABELS[s]}
          </Badge>
        )
      },
      enableGlobalFilter: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)}>
            <Trash2 size={14} className="text-destructive" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ]

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  // CSVエクスポート
  const handleExport = () => {
    const csv = Papa.unparse(
      filtered.map((t) => ({
        日付: t.date,
        種別: t.type === 'income' ? '収入' : '支出',
        金額: t.amount,
        カテゴリ: t.category ?? '',
        説明: t.description ?? '',
        支払状況: PAYMENT_STATUS_LABELS[t._effectiveStatus],
        期日: t.due_date ?? '',
      }))
    )
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSVインポート
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setImportPreview(result.data)
        setImportOpen(true)
      },
    })
    e.target.value = ''
  }

  const handleImport = async () => {
    setImporting(true)
    let ok = 0, fail = 0
    for (const row of importPreview) {
      const amount = Number(row['金額'] || row['amount'] || 0)
      const type = (row['種別'] || row['type'] || '').includes('収入') ? 'income' : 'expense'
      const date = row['日付'] || row['date'] || new Date().toISOString().slice(0, 10)
      if (!amount || !date) { fail++; continue }
      const { error } = await createTransaction({
        amount, type, date,
        category: row['カテゴリ'] || row['category'] || null,
        description: row['説明'] || row['description'] || null,
        payment_status: 'unpaid',
      })
      if (error) fail++; else ok++
    }
    toast.success(`${ok}件インポートしました${fail > 0 ? `（${fail}件失敗）` : ''}`)
    setImportOpen(false)
    setImportPreview([])
    setImporting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">入出金</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={14} className="mr-1" /> エクスポート
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} className="mr-1" /> インポート
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <Button onClick={openCreate} size="sm">
            <Plus size={16} className="mr-1" /> 新規登録
          </Button>
        </div>
      </div>

      {/* フィルタ・検索 */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="キーワード検索..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-40 h-8 text-sm"
        />
        {[['all', 'すべて'], ['income', '収入'], ['expense', '支出']].map(([v, l]) => (
          <Button key={v} variant={typeFilter === v ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(v)}>
            {l}
          </Button>
        ))}
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="支払状況" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      {loading ? (
        <SkeletonTable rows={8} />
      ) : (
        <>
          {/* デスクトップ */}
          <div className="rounded-lg border hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
                          {header.column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">
                      データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* モバイル: カード */}
          <div className="space-y-2 md:hidden">
            {table.getRowModel().rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">データがありません</p>
            ) : (
              table.getRowModel().rows.map((row) => {
                const t = row.original
                return (
                  <div key={t.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t.date}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(t)}>
                          <Trash2 size={12} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={t.type === 'income' ? 'default' : 'secondary'} className="text-xs">
                        {t.type === 'income' ? '収入' : '支出'}
                      </Badge>
                      <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </span>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                  </div>
                )
              })
            )}
          </div>

          {/* ページネーション */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {filtered.length} 件中 {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filtered.length)} 件
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <ChevronsLeft size={14} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight size={14} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <ChevronsRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* 登録/編集モーダル */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <Select value={watch('category') || ''} onValueChange={(v) => setValue('category', v)}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>説明</Label>
              <Input {...register('description')} />
            </div>
            <div className="space-y-1">
              <Label>支払状況</Label>
              <Select value={watch('payment_status') || 'unpaid'} onValueChange={(v) => setValue('payment_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>支払期日</Label>
              <Input type="date" {...register('due_date')} />
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

      {/* CSVインポートプレビュー */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSVインポート確認（{importPreview.length}件）</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {importPreview[0] && Object.keys(importPreview[0]).map((k) => (
                    <TableHead key={k} className="text-xs">{k}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {importPreview.slice(0, 10).map((row, i) => (
                  <TableRow key={i}>
                    {Object.values(row).map((v, j) => (
                      <TableCell key={j} className="text-xs">{v}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {importPreview.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                ... 他 {importPreview.length - 10} 件
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportPreview([]) }}>
              キャンセル
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'インポート中...' : `${importPreview.length}件インポート`}
            </Button>
          </div>
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
