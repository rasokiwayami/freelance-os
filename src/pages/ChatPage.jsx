import { useRef, useEffect, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { Button } from '../components/ui/button'
import { Send } from 'lucide-react'
import { cn } from '../lib/utils'

export default function ChatPage() {
  const { messages, sending, error, sendMessage } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

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

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-4 text-2xl font-semibold">AIチャット</h1>

      {/* メッセージリスト */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4 space-y-4">
        {messages.length === 0 && !sending && (
          <p className="text-center text-sm text-muted-foreground pt-8">
            案件・収入・支出について何でも聞いてください
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border rounded-bl-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* ローディング */}
        {sending && (
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
        <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon" className="self-end h-10 w-10">
          <Send size={16} />
        </Button>
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
