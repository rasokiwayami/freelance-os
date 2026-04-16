import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'

export function useClientNotes(clientId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = async () => {
    if (!clientId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setData(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [clientId])

  const addNote = async (content) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('client_notes').insert({
      client_id: clientId,
      content,
      user_id: user.id,
    })
    if (error) {
      toast.error('メモの追加に失敗しました')
    } else {
      toast.success('メモを追加しました')
      fetchNotes()
    }
    return { error }
  }

  const deleteNote = async (id) => {
    const { error } = await supabase.from('client_notes').delete().eq('id', id)
    if (!error) {
      toast.success('メモを削除しました')
      fetchNotes()
    }
    return { error }
  }

  return { data, loading, addNote, deleteNote, refetch: fetchNotes }
}
