import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'

export function useProjectTemplates() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTemplates = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('project_templates')
      .select('*')
      .order('name')
    setData(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const createTemplate = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('project_templates').insert({ ...values, user_id: user.id })
    if (error) {
      toast.error('テンプレートの保存に失敗しました')
    } else {
      toast.success('テンプレートを保存しました')
      fetchTemplates()
    }
    return { error }
  }

  const deleteTemplate = async (id) => {
    const { error } = await supabase.from('project_templates').delete().eq('id', id)
    if (!error) {
      toast.success('テンプレートを削除しました')
      fetchTemplates()
    }
    return { error }
  }

  return { data, loading, createTemplate, deleteTemplate, refetch: fetchTemplates }
}
