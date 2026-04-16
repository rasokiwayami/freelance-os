import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import { useUserProfile } from '../hooks/useUserProfile'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { useTransactions } from '../hooks/useTransactions'
import { useTasks } from '../hooks/useTasks'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Download, Save } from 'lucide-react'

const profileSchema = z.object({
  display_name: z.string().optional(),
  default_tax_rate: z.coerce.number().min(0).max(100),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  bank_account_type: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
})

const passwordSchema = z.object({
  newPassword: z.string().min(8, '8文字以上で入力してください'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

export default function SettingsPage() {
  const { profile, loading, upsertProfile } = useUserProfile()
  const { data: projects } = useProjects()
  const { data: clients } = useClients()
  const { data: transactions } = useTransactions()
  const { data: tasks } = useTasks(null)
  const [backingUp, setBackingUp] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: '',
      default_tax_rate: 10,
      bank_name: '',
      bank_branch: '',
      bank_account_type: '普通',
      bank_account_number: '',
      bank_account_name: '',
    },
  })

  const pwForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        display_name: profile.display_name ?? '',
        default_tax_rate: profile.default_tax_rate ?? 10,
        bank_name: profile.bank_name ?? '',
        bank_branch: profile.bank_branch ?? '',
        bank_account_type: profile.bank_account_type ?? '普通',
        bank_account_number: profile.bank_account_number ?? '',
        bank_account_name: profile.bank_account_name ?? '',
      })
    }
  }, [profile])

  const handleProfileSave = async (values) => {
    await upsertProfile(values)
  }

  const handlePasswordChange = async (values) => {
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: values.newPassword })
    if (error) {
      toast.error('パスワードの変更に失敗しました: ' + error.message)
    } else {
      toast.success('パスワードを変更しました')
      pwForm.reset()
    }
    setChangingPw(false)
  }

  const handleBackup = () => {
    setBackingUp(true)
    const backup = {
      exported_at: new Date().toISOString(),
      projects,
      clients,
      transactions,
      tasks,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `freelanceos_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('バックアップを作成しました')
    setBackingUp(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* プロフィール */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール・請求書情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
            <div className="space-y-1">
              <Label>表示名</Label>
              <Input {...profileForm.register('display_name')} placeholder="山田 太郎" />
            </div>
            <div className="space-y-1">
              <Label>デフォルト税率（%）</Label>
              <Input type="number" min="0" max="100" {...profileForm.register('default_tax_rate')} />
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">振込先情報（請求書に使用）</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>銀行名</Label>
                  <Input {...profileForm.register('bank_name')} placeholder="○○銀行" />
                </div>
                <div className="space-y-1">
                  <Label>支店名</Label>
                  <Input {...profileForm.register('bank_branch')} placeholder="新宿支店" />
                </div>
                <div className="space-y-1">
                  <Label>口座種別</Label>
                  <Input {...profileForm.register('bank_account_type')} placeholder="普通" />
                </div>
                <div className="space-y-1">
                  <Label>口座番号</Label>
                  <Input {...profileForm.register('bank_account_number')} placeholder="1234567" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>口座名義（カタカナ）</Label>
                  <Input {...profileForm.register('bank_account_name')} placeholder="ヤマダ タロウ" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                <Save size={14} className="mr-1" />
                {profileForm.formState.isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* パスワード変更 */}
      <Card>
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwForm.handleSubmit(handlePasswordChange)} className="space-y-4">
            <div className="space-y-1">
              <Label>新しいパスワード</Label>
              <Input type="password" {...pwForm.register('newPassword')} />
              {pwForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{pwForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>パスワード確認</Label>
              <Input type="password" {...pwForm.register('confirmPassword')} />
              {pwForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{pwForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={changingPw}>
                {changingPw ? '変更中...' : 'パスワードを変更'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* データバックアップ */}
      <Card>
        <CardHeader>
          <CardTitle>データバックアップ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            案件・クライアント・取引・タスクのすべてのデータをJSON形式でダウンロードします。
          </p>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              案件 {projects.length}件 / クライアント {clients.length}件 /
              取引 {transactions.length}件 / タスク {tasks.length}件
            </div>
            <Button variant="outline" onClick={handleBackup} disabled={backingUp}>
              <Download size={14} className="mr-1" />
              {backingUp ? 'ダウンロード中...' : 'バックアップ作成'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
