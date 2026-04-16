import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'

export function useTasks(projectId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    setLoading(true)
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: true })
    if (projectId) query = query.eq('project_id', projectId)
    const { data, error } = await query
    if (!error) setData(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTasks() }, [projectId])

  const createTask = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('tasks').insert({ ...values, user_id: user.id })
    if (error) {
      toast.error('タスクの作成に失敗しました')
    } else {
      toast.success('タスクを追加しました')
      fetchTasks()
    }
    return { error }
  }

  const updateTask = async (id, values) => {
    const { error } = await supabase.from('tasks').update(values).eq('id', id)
    if (!error) fetchTasks()
    return { error }
  }

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      toast.error('タスクの削除に失敗しました')
    } else {
      toast.success('タスクを削除しました')
      fetchTasks()
    }
    return { error }
  }

  const toggleTask = async (id, current) => {
    return updateTask(id, { is_completed: !current })
  }

  return { data, loading, refetch: fetchTasks, createTask, updateTask, deleteTask, toggleTask }
}
