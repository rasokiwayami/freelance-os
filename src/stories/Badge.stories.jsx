import { Badge } from '../components/ui/badge'

export default {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive'],
    },
  },
}

export const Default = { args: { children: '進行中' } }
export const Secondary = { args: { children: '見積', variant: 'secondary' } }
export const Outline = { args: { children: '完了', variant: 'outline' } }
export const Destructive = { args: { children: '期限超過', variant: 'destructive' } }

export const AllVariants = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Badge>進行中</Badge>
      <Badge variant="secondary">見積</Badge>
      <Badge variant="outline">完了</Badge>
      <Badge variant="destructive">期限超過</Badge>
    </div>
  ),
}
