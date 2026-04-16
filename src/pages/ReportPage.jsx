import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

const CATEGORIES = ['ツール費', '交通費', '通信費', '外注費', '書籍・学習費', '広告費', '消耗品', 'その他']
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16']

function getMonthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast12Months() {
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}月`,
    })
  }
  return months
}

export default function ReportPage() {
  const { data: transactions, loading } = useTransactions()

  const last12 = getLast12Months()

  const barData = useMemo(() =>
    last12.map(({ key, label }) => ({
      month: label,
      収入: transactions.filter((t) => t.type === 'income' && getMonthKey(t.date) === key)
        .reduce((s, t) => s + t.amount, 0),
      支出: transactions.filter((t) => t.type === 'expense' && getMonthKey(t.date) === key)
        .reduce((s, t) => s + t.amount, 0),
    })),
    [transactions, last12]
  )

  // カテゴリ別支出（現在の月）
  const now = new Date()
  const thisMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`

  const pieData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense' && getMonthKey(t.date) === thisMonth)
    const catMap = {}
    expenses.forEach((t) => {
      const cat = t.category || 'その他'
      catMap[cat] = (catMap[cat] || 0) + t.amount
    })
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, thisMonth])

  const totalIncome = useMemo(() =>
    transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [transactions]
  )
  const totalExpense = useMemo(() =>
    transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  )
  const thisMonthIncome = useMemo(() =>
    transactions.filter((t) => t.type === 'income' && getMonthKey(t.date) === thisMonth)
      .reduce((s, t) => s + t.amount, 0),
    [transactions, thisMonth]
  )
  const thisMonthExpense = useMemo(() =>
    transactions.filter((t) => t.type === 'expense' && getMonthKey(t.date) === thisMonth)
      .reduce((s, t) => s + t.amount, 0),
    [transactions, thisMonth]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">月次レポート</h1>

      {/* サマリー */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '今月収入', value: thisMonthIncome, color: 'text-green-600' },
          { label: '今月支出', value: thisMonthExpense, color: 'text-red-500' },
          { label: '今月収支', value: thisMonthIncome - thisMonthExpense, color: thisMonthIncome >= thisMonthExpense ? 'text-green-600' : 'text-red-500' },
          { label: '累計収入', value: totalIncome, color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{fmt(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 過去12ヶ月の収入・支出積み上げグラフ */}
      <Card>
        <CardHeader>
          <CardTitle>過去12ヶ月の収支</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="収入" fill="#22c55e" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="支出" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 今月カテゴリ別支出 */}
      <Card>
        <CardHeader>
          <CardTitle>今月のカテゴリ別支出</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">今月の支出データがありません</p>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="h-[260px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm flex-1">{name}</span>
                    <span className="text-sm font-medium">{fmt(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
