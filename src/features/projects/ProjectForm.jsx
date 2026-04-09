import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const schema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  amount: z.coerce.number().int().min(0, '0以上の整数を入力してください'),
})

export function ProjectForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', amount: 0 },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="project-form">
      <div>
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p role="alert">{errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="amount">金額</Label>
        <Input id="amount" type="number" {...register('amount')} />
        {errors.amount && <p role="alert">{errors.amount.message}</p>}
      </div>
      <Button type="submit">保存</Button>
    </form>
  )
}
