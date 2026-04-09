import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Receipt,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/projects', label: '案件', icon: FolderKanban },
  { to: '/clients', label: 'クライアント', icon: Users },
  { to: '/transactions', label: '入出金', icon: Receipt },
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
    <div className="flex h-screen bg-background">
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
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-zinc-900 transition-transform duration-200',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <h1 className="text-xl font-semibold text-white">FreelanceOS</h1>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors',
                  isActive
                    ? 'bg-zinc-700 text-white font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-400 hover:bg-zinc-800 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-3" />
            ログアウト
          </Button>
        </div>
      </aside>

      {/* メインエリア */}
      <div className="flex flex-1 flex-col md:pl-60 overflow-hidden">
        {/* ヘッダー */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">{user?.email}</div>
        </header>

        {/* コンテンツ */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
