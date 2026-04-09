import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useProjects } from './useProjects'
import { useTransactions } from './useTransactions'
import { useClients } from './useClients'

export function useChat() {
  const { user } = useAuth()
  const { data: projects } = useProjects()
  const { data: transactions } = useTransactions()
  const { data: clients } = useClients()
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

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

    await supabase.from('chat_history').insert({ user_id: user.id, role: 'user', content })

    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, projects, transactions, clients }),
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
