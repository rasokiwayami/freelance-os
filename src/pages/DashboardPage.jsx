import { useMemo } from 'react'
import {
  Bar, BarChart, Pie, PieChart, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useProjects } from '../hooks/useProjects'
import { useTransactions } from '../hooks/useTransactions'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../components/ui/chart'
import { TrendingUp, Briefcase, AlertCircle, CreditCard } from 'lucide-react'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const STATUS_LABELS = {
  estimate: '見積',
  in_progress: '進行中',
  completed: '完了',
  invoiced: '請求済',
  paid: '入金済',
}

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

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
  const loading = pLoading || tLoading

  const chartConfig = {
    revenue: { label: '売上', color: 'hsl(var(--chart-1))' },
  }

  const pieConfig = Object.fromEntries(
    pieData.map((d, i) => [d.name, { label: d.name, color: PIE_COLORS[i % PIE_COLORS.length] }])
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* KPIカード */}
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

        <Card className="border-l-4 border-l-[hsl(var(--chart-2))]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">進行中の案件</CardTitle>
            <Briefcase className="w-4 h-4 text-[hsl(var(--chart-2))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : `${inProgressCount} 件`}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(var(--chart-3))]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">未入金額</CardTitle>
            <AlertCircle className="w-4 h-4 text-[hsl(var(--chart-3))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : fmt(unpaidTotal)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(var(--chart-4))]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">月間経費</CardTitle>
            <CreditCard className="w-4 h-4 text-[hsl(var(--chart-4))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : fmt(monthlyExpense)}</div>
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
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(v) => fmt(v)}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
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
              <ChartContainer config={pieConfig} className="h-[300px]">
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
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
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
                  <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-[hsl(var(--chart-2))]' : 'text-muted-foreground'}`}>
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
