import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { TrendingUp } from 'lucide-react'

export default {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
}

export const Default = {
  render: () => (
    <Card className="w-64">
      <CardHeader>
        <CardTitle>カードタイトル</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">カードの内容がここに入ります。</p>
      </CardContent>
    </Card>
  ),
}

export const KPICard = {
  render: () => (
    <Card className="w-64 border-l-4 border-l-primary">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">月間収入</CardTitle>
        <TrendingUp className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">¥480,000</div>
      </CardContent>
    </Card>
  ),
}

export const ClientCard = {
  render: () => (
    <Card className="w-72">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">山田 太郎</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>株式会社テスト</p>
        <p>test@example.com</p>
        <p className="font-medium text-foreground pt-1">案件 3 件</p>
      </CardContent>
    </Card>
  ),
}
