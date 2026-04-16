import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { useTransactions } from '../hooks/useTransactions'
import {
  FolderKanban, Users, Receipt, LayoutDashboard,
  MessageSquare, Settings, CalendarDays,
} from 'lucide-react'

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { data: projects } = useProjects()
  const { data: clients } = useClients()
  const { data: transactions } = useTransactions()

  const go = useCallback((path) => {
    onOpenChange(false)
    navigate(path)
  }, [navigate, onOpenChange])

  // Escキーで閉じる
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center border-b border-border px-4">
            <Command.Input
              autoFocus
              placeholder="案件・クライアント・取引を検索..."
              className="flex-1 py-4 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              結果が見つかりません
            </Command.Empty>

            {/* ナビゲーション */}
            <Command.Group heading="ページ">
              {[
                { label: 'ダッシュボード', path: '/dashboard', Icon: LayoutDashboard },
                { label: '案件', path: '/projects', Icon: FolderKanban },
                { label: 'クライアント', path: '/clients', Icon: Users },
                { label: '入出金', path: '/transactions', Icon: Receipt },
                { label: 'カレンダー', path: '/calendar', Icon: CalendarDays },
                { label: 'AIチャット', path: '/chat', Icon: MessageSquare },
                { label: '設定', path: '/settings', Icon: Settings },
              ].map(({ label, path, Icon }) => (
                <Command.Item
                  key={path}
                  value={label}
                  onSelect={() => go(path)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent aria-selected:bg-accent"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            {/* 案件 */}
            {projects.length > 0 && (
              <Command.Group heading="案件">
                {projects.slice(0, 5).map((p) => (
                  <Command.Item
                    key={p.id}
                    value={p.title}
                    onSelect={() => go('/projects')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{p.title}</span>
                    <span className="text-xs text-muted-foreground">{fmt(p.amount)}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* クライアント */}
            {clients.length > 0 && (
              <Command.Group heading="クライアント">
                {clients.slice(0, 5).map((c) => (
                  <Command.Item
                    key={c.id}
                    value={c.name}
                    onSelect={() => go('/clients')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{c.name}</span>
                    {c.company && <span className="text-xs text-muted-foreground">{c.company}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* 取引 */}
            {transactions.length > 0 && (
              <Command.Group heading="取引">
                {transactions.slice(0, 5).map((t) => (
                  <Command.Item
                    key={t.id}
                    value={t.description || t.category || t.date}
                    onSelect={() => go('/transactions')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{t.description || t.category || '—'}</span>
                    <span className={`text-xs font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
