import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
    if (error) setError(error)
    else setData(data)
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  const createProject = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('projects').insert({ ...values, user_id: user.id })
    if (!error) fetchProjects()
    return { error }
  }

  const updateProject = async (id, values) => {
    const { error } = await supabase.from('projects').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) fetchProjects()
    return { error }
  }

  const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) fetchProjects()
    return { error }
  }

  return { data, loading, error, refetch: fetchProjects, createProject, updateProject, deleteProject }
}
