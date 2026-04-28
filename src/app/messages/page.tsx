'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
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
    if (!activeConv || !user) return
    loadMessages(activeConv.ad_id, activeConv.other_id)

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async (u: any) => {
    const { data } = await supabase
      .from('messages')
      .select('*, ads(title, category, images)')
      .or(`sender_id.eq.${u.id},receiver_id.eq.${u.id}`)
      .order('created_at', { ascending: false })

    if (!data) return

    const convMap: any = {}
    for (const msg of data) {
      const otherId = msg.sender_id === u.id ? msg.receiver_id : msg.sender_id
      const key = msg.ad_id + '_' + otherId
      if (!convMap[key]) {
        convMap[key] = {
          ad_id: msg.ad_id,
          other_id: otherId,
          ad: msg.ads,
          last_msg: msg.content,
          last_time: msg.created_at,
          unread: msg.receiver_id === u.id && !msg.is_read ? 1 : 0
        }
      } else {
        if (!msg.is_read && msg.receiver_id === u.id) convMap[key].unread++
      }
    }
    setConversations(Object.values(convMap))
  }

  const loadMessages = async (adId: string, otherId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('ad_id', adId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('ad_id', adId)
      .eq('receiver_id', user.id)
  }

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConv) return
    setSending(true)
    await supabase.from('messages').insert([{
      ad_id: activeConv.ad_id,
      sender_id: user.id,
      receiver_id: activeConv.other_id,
      sender_email: user.email,
      receiver_email: '',
      content: newMsg.trim(),
    }])
    setNewMsg('')
    setSending(false)
  }

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿',
    'voiture':'🚗','moto':'🛵','electronique':'📱',
    'mode':'👗','maison':'🛋️','emploi':'💼','animaux':'🐄','services':'🏗️'
  }

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f1'}}>
      <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>⏳ Chargement...</p>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f0f4f1', display:'flex', flexDirection:'column'}}>

      <header style={{background:'#0f5233', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 16px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'64px'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'10px', textDecoration:'none'}}>
            <div style={{width:'36px', height:'36px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'white'}}>Soko<span style={{color:'#f5a623'}}>Deal</span></span>
          </a>
          <div style={{display:'flex', gap:'10px'}}>
            <button onClick={() => window.location.href='/profil'} style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px 18px', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:'8px', color:'white', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', cursor:'pointer'}}>
              <div style={{width:'26px', height:'26px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.8rem', color:'#111a14'}}>
                {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              Mon compte
            </button>
          </div>
        </div>
      </header>

      <div style={{flex:1, maxWidth:'1100px', width:'100%', margin:'24px auto', padding:'0 5%', display:'grid', gridTemplateColumns:'320px 1fr', gap:'16px', height:'calc(100vh - 112px)'}}>

        {/* LISTE CONVERSATIONS */}
        <div style={{background:'white', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', overflow:'hidden', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'16px 20px', borderBottom:'1px solid #e8ede9'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem'}}>💬 Messages</h2>
          </div>
          <div style={{flex:1, overflowY:'auto'}}>
            {conversations.length === 0 ? (
              <div style={{padding:'40px 20px', textAlign:'center'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'10px'}}>📭</div>
                <p style={{color:'#6b7c6e', fontSize:'0.85rem'}}>Aucune conversation pour l instant</p>
              </div>
            ) : (
              conversations.map((conv, i) => (
                <div key={i} onClick={() => setActiveConv(conv)} style={{
                  padding:'14px 20px', cursor:'pointer', borderBottom:'1px solid #f0f4f1',
                  background: activeConv?.ad_id === conv.ad_id ? '#e8f5ee' : 'white',
                  transition:'background 0.15s'
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{width:'44px', height:'44px', borderRadius:'10px', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0}}>
                      {conv.ad ? (catEmoji[conv.ad.category] || '📦') : '📦'}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {conv.ad?.title || 'Annonce supprimee'}
                      </div>
                      <div style={{fontSize:'0.78rem', color:'#6b7c6e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px'}}>
                        {conv.last_msg}
                      </div>
                    </div>
                    {conv.unread > 0 && (
                      <div style={{width:'20px', height:'20px', borderRadius:'50%', background:'#1a7a4a', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, flexShrink:0}}>
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ZONE MESSAGES */}
        <div style={{background:'white', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', overflow:'hidden'}}>
          {!activeConv ? (
            <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'12px'}}>
              <div style={{fontSize:'3rem'}}>💬</div>
              <p style={{fontFamily:'Syne,sans-serif', fontWeight:700, color:'#6b7c6e'}}>Selectionnez une conversation</p>
            </div>
          ) : (
            <>
              <div style={{padding:'16px 20px', borderBottom:'1px solid #e8ede9', display:'flex', alignItems:'center', gap:'12px'}}>
                <div style={{width:'40px', height:'40px', borderRadius:'10px', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem'}}>
                  {activeConv.ad ? (catEmoji[activeConv.ad.category] || '📦') : '📦'}
                </div>
                <div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem'}}>{activeConv.ad?.title || 'Annonce supprimee'}</div>
                  <div style={{fontSize:'0.75rem', color:'#6b7c6e'}}>Conversation en cours</div>
                </div>
              </div>

              <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'10px'}}>
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user.id
                  return (
                    <div key={i} style={{display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start'}}>
                      <div style={{
                        maxWidth:'70%', padding:'10px 14px', borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMine ? '#1a7a4a' : '#f0f4f1',
                        color: isMine ? 'white' : '#111a14',
                        fontSize:'0.9rem', lineHeight:1.5
                      }}>
                        {msg.content}
                        <div style={{fontSize:'0.68rem', opacity:0.6, marginTop:'4px', textAlign:'right'}}>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef}/>
              </div>

              <div style={{padding:'16px 20px', borderTop:'1px solid #e8ede9', display:'flex', gap:'10px'}}>
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ecrivez un message..."
                  style={{flex:1, padding:'11px 16px', border:'1.5px solid #e8ede9', borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', outline:'none', background:'#faf7f2'}}
                />
                <button onClick={handleSend} disabled={sending || !newMsg.trim()} style={{
                  padding:'11px 20px', background: sending || !newMsg.trim() ? '#ccc' : '#1a7a4a',
                  border:'none', borderRadius:'10px', color:'white', fontFamily:'Syne,sans-serif',
                  fontWeight:700, fontSize:'0.9rem', cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer'
                }}>
                  {sending ? '...' : '📨'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}