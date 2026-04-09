import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  // 過去の履歴を読み込む
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('chat_history')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }
    load()
  }, [user])

  const sendMessage = async (content) => {
    if (!content.trim() || !user) return
    setError(null)

    const userMsg = { role: 'user', content }
    setMessages((prev) => [...prev, userMsg])

    // Supabaseに保存
    await supabase.from('chat_history').insert({ user_id: user.id, role: 'user', content })

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: content, userId: user.id }),
      })
      if (!res.ok) throw new Error('APIエラー')
      const { reply } = await res.json()

      const assistantMsg = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMsg])
      await supabase.from('chat_history').insert({ user_id: user.id, role: 'assistant', content: reply })
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setSending(false)
    }
  }

  return { messages, sending, error, sendMessage }
}
