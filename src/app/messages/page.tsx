'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth?mode=login'; return }
      setUser(user)
      await loadConversations(user)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!user || !activeConv) return
    const ch = supabase.channel('msgs-' + activeConv.other_id + activeConv.ad_id)
    ch.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages'
    }, (payload) => {
      const m = payload.new as any
      const inConv = (
        (m.sender_id === user.id && m.receiver_id === activeConv.other_id) ||
        (m.receiver_id === user.id && m.sender_id === activeConv.other_id)
      ) && m.ad_id === activeConv.ad_id
      if (inConv) {
        setMessages(prev => [...prev, m])
        markAsRead(user.id)
      }
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, activeConv])

  const loadConversations = async (u: any) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${u.id},receiver_id.eq.${u.id}`)
      .order('created_at', { ascending: false })

    if (!data) return

    const convMap = new Map()
    for (const msg of data) {
      const otherId = msg.sender_id === u.id ? msg.receiver_id : msg.sender_id
      const key = msg.ad_id + '_' + otherId
      if (!convMap.has(key)) {
        convMap.set(key, {
          ad_id: msg.ad_id,
          other_id: otherId,
          other_email: msg.sender_id === u.id ? msg.receiver_email : msg.sender_email,
          last_message: msg.content,
          last_date: msg.created_at,
          unread: msg.receiver_id === u.id && !msg.is_read ? 1 : 0,
        })
      } else {
        const conv = convMap.get(key)
        if (msg.receiver_id === u.id && !msg.is_read) conv.unread++
      }
    }

    const convList = Array.from(convMap.values())
    const adIds = [...new Set(convList.map(c => c.ad_id).filter(Boolean))]
    if (adIds.length > 0) {
      const { data: adsData } = await supabase
        .from('ads')
        .select('id, title, images, category')
        .in('id', adIds)
      const adsMap = new Map((adsData || []).map((a: any) => [a.id, a]))
      convList.forEach(c => { c.ad = adsMap.get(c.ad_id) || null })
    }

    setConversations(convList)
  }

  const openConversation = async (conv: any) => {
    setActiveConv(conv)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('ad_id', conv.ad_id)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.other_id}),and(sender_id.eq.${conv.other_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('ad_id', conv.ad_id)

    setConversations(prev => prev.map(c =>
      c.ad_id === conv.ad_id && c.other_id === conv.other_id ? { ...c, unread: 0 } : c
    ))
  }

  const markAsRead = async (userId: string) => {
    if (!activeConv) return
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('ad_id', activeConv?.ad_id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv || !user) return
    setSending(true)
    const msg = {
      ad_id: activeConv.ad_id,
      sender_id: user.id,
      receiver_id: activeConv.other_id,
      sender_email: user.email,
      receiver_email: activeConv.other_email,
      content: newMessage.trim(),
      is_read: false,
    }
    const { data } = await supabase.from('messages').insert([msg]).select().single()
    if (data) setMessages(prev => [...prev, data])
    setNewMessage('')
    setSending(false)
    loadConversations(user)
  }

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'À l instant'
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min'
    if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const extractLink = (text: string) => {
    return text.split(/(https:\/\/sokodeal\.app\/annonce\/[a-zA-Z0-9-]+)/)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7f5' }}>
      <p style={{ fontFamily: 'Syne,sans-serif', color: '#1a7a4a', fontWeight: 700 }}>⏳ Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f5', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media (max-width: 768px) {
          .msg-layout { grid-template-columns: 1fr !important; }
          .conv-panel { display: ${activeConv ? 'none' : 'flex'} !important; }
          .chat-panel { display: ${activeConv ? 'flex' : 'none'} !important; }
        }
        .conv-item:hover { background: #f0f4f1 !important; }
        textarea:focus { border-color: #1a7a4a !important; outline: none; }
      `}</style>

      <header style={{ background: 'white', borderBottom: '1px solid #e8ede9', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', height: '58px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeConv && (
              <button onClick={() => setActiveConv(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}>←</button>
            )}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', background: '#f5a623', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🦁</div>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111a14' }}>Soko<span style={{ color: '#1a7a4a' }}>Deal</span></span>
            </a>
          </div>
          <button onClick={() => window.location.href = '/profil'} style={{ padding: '7px 14px', background: '#f5f7f5', border: '1px solid #e8ede9', borderRadius: '8px', color: '#111a14', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}>
            Mon compte
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', width: '100%', margin: '20px auto', padding: '0 5%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '16px', color: '#111a14' }}>
          💬 Messages
        </h1>

        <div className="msg-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', flex: 1, minHeight: '600px' }}>

          <div className="conv-panel" style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8ede9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f4f1' }}>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#111a14' }}>
                Conversations {conversations.length > 0 && <span style={{ background: '#f5f7f5', padding: '1px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#6b7c6e' }}>{conversations.length}</span>}
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7c6e' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                  <p style={{ fontSize: '0.85rem' }}>Aucune conversation</p>
                </div>
              ) : conversations.map((conv, i) => (
                <div key={i} className="conv-item" onClick={() => openConversation(conv)}
                  style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f4f1', background: activeConv?.ad_id === conv.ad_id && activeConv?.other_id === conv.other_id ? '#f0f4f1' : 'white', transition: 'background 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f7f5', border: '1px solid #e8ede9', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {conv.ad?.images?.[0] ? <img src={conv.ad.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#111a14', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {conv.ad?.title || 'Annonce supprimée'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#9ca3af', flexShrink: 0 }}>{formatTime(conv.last_date)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7c6e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                          {conv.last_message?.substring(0, 40)}{conv.last_message?.length > 40 ? '...' : ''}
                        </span>
                        {conv.unread > 0 && (
                          <span style={{ background: '#e63946', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-panel" style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8ede9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!activeConv ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7c6e', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '3rem' }}>💬</div>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>Sélectionne une conversation</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f4f1', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: '#f5f7f5', border: '1px solid #e8ede9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    {activeConv.ad?.images?.[0] ? <img src={activeConv.ad.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#111a14', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeConv.ad?.title || 'Annonce supprimée'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7c6e' }}>{activeConv.other_email}</div>
                  </div>
                  {activeConv.ad_id && (
                    <a href={'/annonce/' + activeConv.ad_id} style={{ padding: '5px 10px', background: '#f5f7f5', border: '1px solid #e8ede9', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 600, color: '#1a7a4a', textDecoration: 'none', flexShrink: 0 }}>
                      Voir l'annonce →
                    </a>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id
                    const parts = extractLink(msg.content)
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '72%', padding: '10px 14px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: isMe ? '#1a7a4a' : '#f5f7f5',
                          color: isMe ? 'white' : '#111a14',
                          fontSize: '0.88rem', lineHeight: 1.5,
                          border: isMe ? 'none' : '1px solid #e8ede9'
                        }}>
                          {parts.map((part, j) =>
                            part.startsWith('https://sokodeal.app/annonce/') ? (
                              <a key={j} href={part} style={{ color: isMe ? '#a7f3d0' : '#1a7a4a', fontWeight: 600, display: 'block', marginTop: '4px', fontSize: '0.8rem' }}>
                                🔗 Voir l'annonce →
                              </a>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )}
                          <div style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.6, textAlign: 'right' }}>
                            {formatTime(msg.created_at)} {isMe && (msg.is_read ? '✓✓' : '✓')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f4f1', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrire un message... (Entrée pour envoyer)"
                    rows={1}
                    style={{ flex: 1, padding: '10px 13px', border: '1px solid #e8ede9', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '0.88rem', resize: 'none', background: '#fafaf9', color: '#111a14', transition: 'border-color 0.2s' }}
                  />
                  <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                    style={{ padding: '10px 18px', background: sending || !newMessage.trim() ? '#e8ede9' : '#1a7a4a', border: 'none', borderRadius: '10px', color: sending || !newMessage.trim() ? '#6b7c6e' : 'white', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                    {sending ? '⏳' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}