import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password)
    if (error) {
      setError(getErrorMessage(error.message))
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* 左パネル */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-zinc-900">
        <div className="text-2xl font-bold text-white">FreelanceOS</div>
        <div>
          <blockquote className="text-zinc-300 text-lg leading-relaxed">
            "案件・収支・クライアントをまとめて管理。AIアシスタントがビジネスの全体像を把握します。"
          </blockquote>
        </div>
      </div>

      {/* 右パネル */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-white">アカウント作成</h1>
            <p className="mt-2 text-sm text-zinc-400">FreelanceOSへようこそ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">メールアドレス</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">パスワード（6文字以上）</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full bg-white text-zinc-900 hover:bg-zinc-100" disabled={loading}>
              {loading ? '登録中...' : 'アカウントを作成'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            すでにアカウントをお持ちの方は{' '}
            <Link to="/login" className="text-zinc-300 underline hover:text-white">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function getErrorMessage(msg) {
  if (msg.includes('already registered')) return 'このメールアドレスはすでに登録されています'
  if (msg.includes('weak password')) return 'パスワードが弱すぎます'
  return '登録に失敗しました。もう一度お試しください'
}
