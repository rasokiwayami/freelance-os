import { useRef, useEffect, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useProjects } from '../hooks/useProjects'
import { useTransactions } from '../hooks/useTransactions'
import { useClients } from '../hooks/useClients'
import { Button } from '../components/ui/button'
import { Send, Plus, MessageSquare } from 'lucide-react'
import { cn } from '../lib/utils'
import { toast } from '../lib/toast'

// AIレスポンスからアクションを抽出
function parseActions(content) {
  const match = content.match(/<actions>([\s\S]*?)<\/actions>/)
  if (!match) return { text: content, actions: [] }
  try {
    const actions = JSON.parse(match[1].trim())
    const text = content.replace(/<actions>[\s\S]*?<\/actions>/, '').trim()
    return { text, actions }
  } catch {
    return { text: content, actions: [] }
  }
}

function MessageBubble({ msg, onAction }) {
  const isUser = msg.role === 'user'
  const { text, actions } = isUser ? { text: msg.content, actions: [] } : parseActions(msg.content)

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[80%] space-y-2">
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-card border rounded-bl-sm'
          )}
        >
          {text}
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => onAction(action)}
              >
                + {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const {
    messages, sessions, currentSessionId, sending, streamingContent, error,
    sendMessage, loadSession, newSession,
  } = useChat()
  const { createProject } = useProjects()
  const { createTransaction } = useTransactions()
  const { createClient } = useClients()
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending, streamingContent])

  const handleSend = () => {
    if (!input.trim() || sending) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAction = async (action) => {
    try {
      if (action.type === 'create_project') {
        await createProject(action.data)
      } else if (action.type === 'create_transaction') {
        await createTransaction(action.data)
      } else if (action.type === 'create_client') {
        await createClient(action.data)
      }
    } catch {
      toast.error('アクションの実行に失敗しました')
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* セッションサイドバー */}
      {sidebarOpen && (
        <div className="w-52 flex-shrink-0 flex flex-col border rounded-lg overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">会話履歴</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={newSession}
              title="新しい会話"
            >
              <Plus size={13} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={newSession}
              className={cn(
                'w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors flex items-center gap-2',
                !currentSessionId ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <Plus size={11} /> 新しい会話
            </button>
            {sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => loadSession(s.session_id)}
                className={cn(
                  'w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors flex items-center gap-2',
                  currentSessionId === s.session_id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                <MessageSquare size={11} className="shrink-0" />
                <span className="truncate">
                  {new Date(s.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* メインチャット */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AIチャット</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? '履歴を隠す' : '履歴を表示'}
          </Button>
        </div>

        {/* メッセージリスト */}
        <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4 space-y-4">
          {messages.length === 0 && !sending && (
            <p className="text-center text-sm text-muted-foreground pt-8">
              案件・収入・支出について何でも聞いてください
            </p>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onAction={handleAction} />
          ))}

          {/* ストリーミング中の表示 */}
          {sending && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-card border rounded-2xl rounded-bl-sm px-4 py-2 text-sm whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-1 h-3 bg-foreground ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {sending && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3">
                <Dots />
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 入力欄 */}
        <div className="mt-3 flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            rows={2}
            placeholder="メッセージを入力（Enter で送信、Shift+Enter で改行）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            size="icon"
            className="self-end h-10 w-10"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Dots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
