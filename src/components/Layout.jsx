import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ArrowLeftRight,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/projects', label: '案件', icon: Briefcase },
  { to: '/clients', label: 'クライアント', icon: Users },
  { to: '/transactions', label: '入出金', icon: ArrowLeftRight },
  { to: '/chat', label: 'AIチャット', icon: MessageSquare },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* モバイル：オーバーレイ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r bg-sidebar transition-transform duration-200',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ロゴ */}
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-semibold">FreelanceOS</span>
        </div>

        {/* ナビ */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ログアウト */}
        <div className="border-t p-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインエリア */}
      <div className="flex flex-1 flex-col md:pl-60">
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">{user?.email}</span>
        </header>

        {/* コンテンツ */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
