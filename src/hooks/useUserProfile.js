import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'

export function useUserProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [])

  const upsertProfile = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('user_profiles').upsert({
      ...values,
      id: user.id,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      toast.error('プロフィールの更新に失敗しました')
    } else {
      toast.success('プロフィールを更新しました')
      fetchProfile()
    }
    return { error }
  }

  return { profile, loading, upsertProfile, refetch: fetchProfile }
}
