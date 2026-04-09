import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useProjects } from '../hooks/useProjects'
import { useTransactions } from '../hooks/useTransactions'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { TrendingUp, Briefcase, AlertCircle, TrendingDown } from 'lucide-react'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const STATUS_LABELS = {
  estimate: '見積',
  in_progress: '進行中',
  completed: '完了',
  invoiced: '請求済',
  paid: '入金済',
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']

function getMonthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export default function DashboardPage() {
  const { data: projects, loading: pLoading } = useProjects()
  const { data: transactions, loading: tLoading } = useTransactions()

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

  // 月次収入グラフ
  const last6 = getLast6Months()
  const barData = useMemo(() =>
    last6.map((month) => ({
      month: month.slice(5), // MM
      収入: transactions
        .filter((t) => t.type === 'income' && getMonthKey(t.date) === month)
        .reduce((s, t) => s + t.amount, 0),
    })),
    [transactions, last6]
  )

  // ステータス別案件数
  const pieData = useMemo(() => {
    const counts = {}
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
    }))
  }, [projects])

  // 直近5件
  const recent5 = useMemo(() => transactions.slice(0, 5), [transactions])

  const loading = pLoading || tLoading

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ダッシュボード</h1>

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="今月の収入"
          value={fmt(monthlyIncome)}
          icon={<TrendingUp size={18} className="text-green-500" />}
          loading={loading}
        />
        <KpiCard
          title="進行中の案件"
          value={`${inProgressCount} 件`}
          icon={<Briefcase size={18} className="text-blue-500" />}
          loading={loading}
        />
        <KpiCard
          title="未入金合計"
          value={fmt(unpaidTotal)}
          icon={<AlertCircle size={18} className="text-yellow-500" />}
          loading={loading}
        />
        <KpiCard
          title="今月の支出"
          value={fmt(monthlyExpense)}
          icon={<TrendingDown size={18} className="text-red-500" />}
          loading={loading}
        />
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">月次収入推移（過去6ヶ月）</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.every((d) => d.収入 === 0) ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="収入" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ステータス別案件数</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 直近の入出金 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">直近の入出金</CardTitle>
        </CardHeader>
        <CardContent>
          {recent5.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y">
              {recent5.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{t.description || t.category || '—'}</p>
                    <p className="text-muted-foreground">{t.date}</p>
                  </div>
                  <span className={t.type === 'income' ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
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

function KpiCard({ title, value, icon, loading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{loading ? '—' : value}</p>
      </CardContent>
    </Card>
  )
}

function Empty() {
  return <p className="py-8 text-center text-sm text-muted-foreground">データがありません</p>
}
