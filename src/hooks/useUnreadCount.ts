import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  const loadCount = useCallback(async (uid: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', uid)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }, [])

  useEffect(() => {
    let userId: string | null = null
    let channel: any = null

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id
      await loadCount(user.id)

      channel = supabase.channel('unread-' + user.id.slice(0, 8))

      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'receiver_id=eq.' + user.id,
      }, () => {
        setUnreadCount(c => c + 1)
      }).subscribe()

      // Recharger quand la page redevient visible
      const handleVisibility = () => {
        if (document.visibilityState === 'visible' && userId) {
          loadCount(userId)
        }
      }
      document.addEventListener('visibilitychange', handleVisibility)

      // Recharger au focus
      const handleFocus = () => { if (userId) loadCount(userId) }
      window.addEventListener('focus', handleFocus)

      return () => {
        if (channel) supabase.removeChannel(channel)
        document.removeEventListener('visibilitychange', handleVisibility)
        window.removeEventListener('focus', handleFocus)
      }
    }

    init()
  }, [loadCount])

  return { unreadCount }
}