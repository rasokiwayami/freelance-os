import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTransactions() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, projects(title)')
      .order('date', { ascending: false })
    if (error) setError(error)
    else setData(data)
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [])

  const createTransaction = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('transactions').insert({ ...values, user_id: user.id })
    if (!error) fetchTransactions()
    return { error }
  }

  const updateTransaction = async (id, values) => {
    const { error } = await supabase.from('transactions').update(values).eq('id', id)
    if (!error) fetchTransactions()
    return { error }
  }

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) fetchTransactions()
    return { error }
  }

  return { data, loading, error, refetch: fetchTransactions, createTransaction, updateTransaction, deleteTransaction }
}
