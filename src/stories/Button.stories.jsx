import { Button } from '../components/ui/button'

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
}

export const Default = { args: { children: 'ボタン' } }
export const Secondary = { args: { children: '二次ボタン', variant: 'secondary' } }
export const Outline = { args: { children: 'アウトライン', variant: 'outline' } }
export const Destructive = { args: { children: '削除', variant: 'destructive' } }
export const Small = { args: { children: '小さいボタン', size: 'sm' } }
export const Loading = { args: { children: '保存中...', disabled: true } }
