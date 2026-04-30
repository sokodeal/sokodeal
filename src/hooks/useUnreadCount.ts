import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await loadCount(user.id)

      // Temps réel — nouveau message recu
      const ch = supabase.channel('unread-' + user.id.slice(0, 8))
      ch.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'receiver_id=eq.' + user.id,
      }, () => {
        setUnreadCount(c => c + 1)
      }).on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: 'receiver_id=eq.' + user.id,
      }, () => {
        // Recharger le count quand un message est marqué comme lu
        loadCount(user.id)
      }).subscribe()

      return () => { supabase.removeChannel(ch) }
    }
    init()
  }, [])

  const loadCount = async (uid: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', uid)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }

  return { unreadCount, reload: () => userId && loadCount(userId) }
}