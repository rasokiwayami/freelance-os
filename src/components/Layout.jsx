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
  Moon,
  Sun,
  Settings,
  CalendarDays,
  Search,
} from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { CommandPalette } from './CommandPalette'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/projects', label: '案件', icon: FolderKanban },
  { to: '/clients', label: 'クライアント', icon: Users },
  { to: '/transactions', label: '入出金', icon: Receipt },
  { to: '/calendar', label: 'カレンダー', icon: CalendarDays },
  { to: '/chat', label: 'AIチャット', icon: MessageSquare },
  { to: '/report', label: 'レポート', icon: Receipt },
  { to: '/settings', label: '設定', icon: Settings },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const { i18n } = useTranslation()
  const toggleLang = () => {
    const next = i18n.language === 'ja' ? 'en' : 'ja'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Cmd+K / Ctrl+K でコマンドパレットを開く
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCmdOpen(true)
    }
  }

  // グローバルに登録
  if (typeof window !== 'undefined') {
    window.onkeydown = handleKeyDown
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2 text-muted-foreground text-xs w-48"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="w-3.5 h-3.5" />
              <span>検索...</span>
              <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="text-xs font-medium text-muted-foreground">
              {i18n.language === 'ja' ? 'EN' : 'JA'}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} title="テーマ切り替え">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          </div>
        </header>

        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

        {/* コンテンツ */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
