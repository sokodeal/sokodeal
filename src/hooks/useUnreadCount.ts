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

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id
      await loadCount(user.id)

      const ch = supabase.channel('unread-realtime-' + user.id.slice(0, 8))

      // Nouveau message recu → +1
      ch.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'receiver_id=eq.' + user.id,
      }, () => {
        setUnreadCount(c => c + 1)
      })

      // Message lu → recharger le vrai count
      ch.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: 'receiver_id=eq.' + user.id,
      }, () => {
        loadCount(user.id)
      })

      // Broadcast depuis la page messages quand on lit
      ch.on('broadcast', { event: 'messages_read' }, () => {
        loadCount(user.id)
      })

      ch.subscribe()

      // Recharger au focus de la page
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