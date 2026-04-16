import { useMemo } from 'react'
import {
  Bar, BarChart, Pie, PieChart, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useProjects } from '../hooks/useProjects'
import { useTransactions } from '../hooks/useTransactions'
import { useClients } from '../hooks/useClients'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { SkeletonKPI } from '../components/ui/skeleton'
import { TrendingUp, Briefcase, AlertCircle, CreditCard, Users, Bell } from 'lucide-react'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const STATUS_LABELS = {
  estimate: '見積',
  in_progress: '進行中',
  completed: '完了',
  invoiced: '請求済',
  paid: '入金済',
}

const PIE_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
]

const BAR_COLOR = '#6366f1'

function getMonthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}月`,
    })
  }
  return months
}

export default function DashboardPage() {
  const { data: projects, loading: pLoading } = useProjects()
  const { data: transactions, loading: tLoading } = useTransactions()
  const { data: clients, loading: cLoading } = useClients()

  const now = new Date()
  const thisMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthlyIncome = useMemo(() =>
    transactions
      .filter((t) => t.type === 'income' && getMonthKey(t.date) === thisMonth)
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions, thisMonth]
  )

  const monthlyExpense = useMemo(() =>
    transactions
      .filter((t) => t.type === 'expense' && getMonthKey(t.date) === thisMonth)
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions, thisMonth]
  )

  const inProgressCount = useMemo(() =>
    projects.filter((p) => p.status === 'in_progress').length,
    [projects]
  )

  const unpaidTotal = useMemo(() =>
    projects
      .filter((p) => p.status === 'completed' || p.status === 'invoiced')
      .reduce((sum, p) => sum + p.amount, 0),
    [projects]
  )

  const last6 = getLast6Months()

  const barData = useMemo(() =>
    last6.map(({ key, label }) => ({
      month: label,
      revenue: transactions
        .filter((t) => t.type === 'income' && getMonthKey(t.date) === key)
        .reduce((s, t) => s + t.amount, 0),
    })),
    [transactions, last6]
  )

  const pieData = useMemo(() => {
    const counts = {}
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
    }))
  }, [projects])

  const recent5 = useMemo(() => transactions.slice(0, 5), [transactions])
  const loading = pLoading || tLoading || cLoading

  // 今月の新規クライアント数
  const newClientsThisMonth = useMemo(() =>
    clients.filter((c) => c.created_at && getMonthKey(c.created_at) === thisMonth).length,
    [clients, thisMonth]
  )

  // 通知: 締切3日以内の案件
  const today = new Date()
  const in3days = new Date(today)
  in3days.setDate(today.getDate() + 3)
  const deadlineSoon = useMemo(() =>
    projects.filter((p) => {
      if (!p.deadline || p.status === 'completed' || p.status === 'paid') return false
      const d = new Date(p.deadline)
      return d >= today && d <= in3days
    }),
    [projects]
  )

  // 通知: 期限超過の取引
  const todayStr = today.toISOString().slice(0, 10)
  const overdueTransactions = useMemo(() =>
    transactions.filter((t) =>
      t.due_date && t.due_date < todayStr && t.payment_status !== 'paid'
    ),
    [transactions, todayStr]
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 通知バナー */}
      {(deadlineSoon.length > 0 || overdueTransactions.length > 0) && (
        <div className="space-y-2">
          {deadlineSoon.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
              <Bell size={15} className="shrink-0" />
              <span className="text-sm">
                <strong>{p.title}</strong> の締切が近づいています（{p.deadline}）
              </span>
            </div>
          ))}
          {overdueTransactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              <AlertCircle size={15} className="shrink-0" />
              <span className="text-sm">
                <strong>{t.description || t.category || '取引'}</strong> の支払期日が超過しています（{t.due_date}）
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KPIカード */}
      {loading ? <SkeletonKPI /> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">月間収入</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : fmt(monthlyIncome)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">進行中の案件</CardTitle>
            <Briefcase className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : `${inProgressCount} 件`}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">未入金額</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : fmt(unpaidTotal)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">月間経費</CardTitle>
            <CreditCard className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : fmt(monthlyExpense)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 追加KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今月の新規クライアント</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : `${newClientsThisMonth} 社`}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">締切間近の案件</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : `${deadlineSoon.length} 件`}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今月の純利益</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyIncome - monthlyExpense >= 0 ? '' : 'text-red-500'}`}>
              {loading ? '—' : fmt(monthlyIncome - monthlyExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>月間売上推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`}
                  />
                  <Tooltip formatter={(v) => [fmt(v), '売上']} />
                  <Bar dataKey="revenue" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ステータス別案件数</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-24 text-center text-sm text-muted-foreground">データがありません</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 直近の取引 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の取引</CardTitle>
        </CardHeader>
        <CardContent>
          {recent5.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">データがありません</p>
          ) : (
            <div className="space-y-1">
              {recent5.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{t.description || t.category || '—'}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                  <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
