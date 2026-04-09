import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useClients() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('name')
    setData(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  const createClient = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('clients').insert({ ...values, user_id: user.id })
    if (!error) fetchClients()
    return { error }
  }

  const updateClient = async (id, values) => {
    const { error } = await supabase.from('clients').update(values).eq('id', id)
    if (!error) fetchClients()
    return { error }
  }

  const deleteClient = async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (!error) fetchClients()
    return { error }
  }

  return { data, loading, refetch: fetchClients, createClient, updateClient, deleteClient }
}
