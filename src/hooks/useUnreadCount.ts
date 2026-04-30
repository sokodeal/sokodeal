import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  const loadCount = useCallback(async (uid: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', uid)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await loadCount(user.id)

      // Nouveau message recu
      const ch = supabase.channel('unread-badge-' + user.id.slice(0, 8))
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
      }, () => {
        // Recharger le count a chaque UPDATE
        loadCount(user.id)
      }).subscribe()

      // Recharger quand on revient sur la page
      const handleFocus = () => loadCount(user.id)
      window.addEventListener('focus', handleFocus)

      return () => {
        supabase.removeChannel(ch)
        window.removeEventListener('focus', handleFocus)
      }
    }
    init()
  }, [loadCount])

  return { unreadCount }
}