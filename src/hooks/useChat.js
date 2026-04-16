import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useProjects } from './useProjects'
import { useTransactions } from './useTransactions'
import { useClients } from './useClients'

const NEW_SESSION_ID = 'new'

export function useChat() {
  const { user } = useAuth()
  const { data: projects } = useProjects()
  const { data: transactions } = useTransactions()
  const { data: clients } = useClients()
  const [messages, setMessages] = useState([])
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [sending, setSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState(null)

  // セッション一覧を取得
  const fetchSessions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('chat_history')
      .select('session_id, session_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!data) return
    // session_idでグループ化、最新のものだけ
    const seen = new Set()
    const unique = []
    for (const row of data) {
      if (!seen.has(row.session_id)) {
        seen.add(row.session_id)
        unique.push(row)
      }
    }
    setSessions(unique)
  }, [user])

  // セッションのメッセージを取得
  const loadSession = useCallback(async (sessionId) => {
    if (!user || !sessionId) return
    const { data } = await supabase
      .from('chat_history')
      .select('role, content, session_id')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setCurrentSessionId(sessionId)
  }, [user])

  // 初回ロード: 最新セッションを開く
  useEffect(() => {
    if (!user) return
    fetchSessions().then(async () => {
      const { data } = await supabase
        .from('chat_history')
        .select('session_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data?.[0]?.session_id) {
        loadSession(data[0].session_id)
      }
    })
  }, [user])

  const newSession = () => {
    setMessages([])
    setCurrentSessionId(null)
  }

  const sendMessage = async (content) => {
    if (!content.trim() || !user) return
    setError(null)

    // セッションIDを確定（新規の場合はここで生成）
    const sessionId = currentSessionId || crypto.randomUUID()
    if (!currentSessionId) setCurrentSessionId(sessionId)

    const userMsg = { role: 'user', content }
    setMessages((prev) => [...prev, userMsg])
    await supabase.from('chat_history').insert({
      user_id: user.id,
      role: 'user',
      content,
      session_id: sessionId,
    })

    setSending(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          projects,
          transactions,
          clients,
          stream: true,
        }),
      })

      if (!res.ok) throw new Error('APIエラー')

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        // SSEストリーミング
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullReply = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const { text } = JSON.parse(data)
                if (text) {
                  fullReply += text
                  setStreamingContent(fullReply)
                }
              } catch {}
            }
          }
        }

        const assistantMsg = { role: 'assistant', content: fullReply }
        setMessages((prev) => [...prev, assistantMsg])
        setStreamingContent('')

        await supabase.from('chat_history').insert({
          user_id: user.id,
          role: 'assistant',
          content: fullReply,
          session_id: sessionId,
        })
      } else {
        // 通常JSON
        const { reply } = await res.json()
        const assistantMsg = { role: 'assistant', content: reply }
        setMessages((prev) => [...prev, assistantMsg])
        await supabase.from('chat_history').insert({
          user_id: user.id,
          role: 'assistant',
          content: reply,
          session_id: sessionId,
        })
      }

      fetchSessions()
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setSending(false)
      setStreamingContent('')
    }
  }

  return {
    messages,
    sessions,
    currentSessionId,
    sending,
    streamingContent,
    error,
    sendMessage,
    loadSession,
    newSession,
    fetchSessions,
  }
}
