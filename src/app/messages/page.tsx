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
  const [showList, setShowList] = useState(true)
  const bottomRef = useRef<any>(null)

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿','voiture':'🚗',
    'moto':'🛵','electronique':'📱','mode':'👗','maison':'🛋️','emploi':'💼',
    'animaux':'🐄','services':'🏗️','agriculture':'🌾','materiaux':'🧱',
    'sante':'💊','sport':'⚽','education':'📚'
  }

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
    const ch = supabase.channel('msgs-' + activeConv.ad_id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async (u: any) => {
    const { data } = await supabase
      .from('messages').select('*, ads(title, category, images)')
      .or(`sender_id.eq.${u.id},receiver_id.eq.${u.id}`)
      .order('created_at', { ascending: false })
    if (!data) return
    const convMap: any = {}
    for (const msg of data) {
      const otherId = msg.sender_id === u.id ? msg.receiver_id : msg.sender_id
      const key = msg.ad_id + '_' + otherId
      if (!convMap[key]) {
        convMap[key] = {
          ad_id: msg.ad_id, other_id: otherId, ad: msg.ads,
          last_msg: msg.content, last_time: msg.created_at,
          unread: msg.receiver_id === u.id && !msg.is_read ? 1 : 0
        }
      } else {
        if (!msg.is_read && msg.receiver_id === u.id) convMap[key].unread++
      }
    }
    setConversations(Object.values(convMap))
  }

  const loadMessages = async (adId: string, otherId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('ad_id', adId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    await supabase.from('messages').update({ is_read: true }).eq('ad_id', adId).eq('receiver_id', user.id)
  }

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConv) return
    setSending(true)
    await supabase.from('messages').insert([{
      ad_id: activeConv.ad_id, sender_id: user.id,
      receiver_id: activeConv.other_id, sender_email: user.email,
      receiver_email: '', content: newMsg.trim(),
    }])
    setNewMsg('')
    setSending(false)
  }

  const openConv = (conv: any) => {
    setActiveConv(conv)
    setShowList(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f7f5'}}>
      <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>⏳ Chargement...</p>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5', display:'flex', flexDirection:'column'}}>
      <style>{`
        @media (max-width: 768px) {
          .msg-layout { grid-template-columns: 1fr !important; height: auto !important; }
          .msg-list-col { display: ${showList ? 'flex' : 'none'} !important; min-height: 400px; }
          .msg-chat-col { display: ${!showList ? 'flex' : 'none'} !important; min-height: 500px; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{background:'white', position:'sticky', top:0, zIndex:100, borderBottom:'1px solid #e8ede9'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'58px', maxWidth:'1100px', margin:'0 auto'}}>
          {!showList ? (
            <button onClick={() => setShowList(true)} style={{background:'transparent', border:'none', color:'#111a14', fontSize:'1.1rem', cursor:'pointer', padding:'4px 8px', fontFamily:'DM Sans,sans-serif', fontWeight:600}}>
              ← Retour
            </button>
          ) : (
            <a href="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
              <div style={{width:'32px', height:'32px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>🦁</div>
              <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
            </a>
          )}
          <button onClick={() => window.location.href='/profil'} style={{display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'8px', color:'#111a14', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
            <div style={{width:'22px', height:'22px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.72rem', color:'#111a14'}}>
              {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            Mon compte
          </button>
        </div>
      </header>

      <div style={{flex:1, maxWidth:'1100px', width:'100%', margin:'20px auto', padding:'0 5%', display:'grid', gridTemplateColumns:'300px 1fr', gap:'16px', height:'calc(100vh - 120px)'}} className="msg-layout">

        {/* LISTE */}
        <div className="msg-list-col" style={{background:'white', borderRadius:'14px', border:'1px solid #e8ede9', overflow:'hidden', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'14px 18px', borderBottom:'1px solid #f0f4f1'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'#111a14', textTransform:'uppercase', letterSpacing:'0.04em'}}>Messages</h2>
          </div>
          <div style={{flex:1, overflowY:'auto'}}>
            {conversations.length === 0 ? (
              <div style={{padding:'40px 16px', textAlign:'center'}}>
                <div style={{fontSize:'2rem', marginBottom:'8px', opacity:0.4}}>💬</div>
                <p style={{color:'#6b7c6e', fontSize:'0.82rem'}}>Aucune conversation</p>
              </div>
            ) : conversations.map((conv, i) => (
              <div key={i} onClick={() => openConv(conv)} style={{
                padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f5f7f5',
                background: activeConv?.ad_id === conv.ad_id ? '#f0f9f4' : 'white',
                transition:'background 0.15s'
              }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'10px', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0, border:'1px solid #e8ede9'}}>
                    {conv.ad ? (catEmoji[conv.ad.category] || '📦') : '📦'}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#111a14'}}>
                      {conv.ad?.title || 'Annonce supprimee'}
                    </div>
                    <div style={{fontSize:'0.75rem', color:'#6b7c6e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px'}}>
                      {conv.last_msg}
                    </div>
                  </div>
                  {conv.unread > 0 && (
                    <div style={{width:'18px', height:'18px', borderRadius:'50%', background:'#1a7a4a', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:800, flexShrink:0}}>
                      {conv.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT */}
        <div className="msg-chat-col" style={{background:'white', borderRadius:'14px', border:'1px solid #e8ede9', display:'flex', flexDirection:'column', overflow:'hidden'}}>
          {!activeConv ? (
            <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'10px', padding:'40px'}}>
              <div style={{fontSize:'2.5rem', opacity:0.3}}>💬</div>
              <p style={{fontFamily:'Syne,sans-serif', fontWeight:600, color:'#6b7c6e', fontSize:'0.9rem'}}>Selectionnez une conversation</p>
            </div>
          ) : (
            <>
              <div style={{padding:'14px 18px', borderBottom:'1px solid #f0f4f1', display:'flex', alignItems:'center', gap:'10px'}}>
                <div style={{width:'36px', height:'36px', borderRadius:'9px', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0, border:'1px solid #e8ede9'}}>
                  {activeConv.ad ? (catEmoji[activeConv.ad.category] || '📦') : '📦'}
                </div>
                <div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem', color:'#111a14', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{activeConv.ad?.title || 'Annonce supprimee'}</div>
                  <div style={{fontSize:'0.72rem', color:'#6b7c6e'}}>Conversation en cours</div>
                </div>
              </div>

              <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'8px'}}>
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user.id
                  return (
                    <div key={i} style={{display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start'}}>
                      <div style={{
                        maxWidth:'72%', padding:'9px 13px',
                        borderRadius: isMine ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                        background: isMine ? '#1a7a4a' : '#f5f7f5',
                        color: isMine ? 'white' : '#111a14',
                        fontSize:'0.88rem', lineHeight:1.5,
                        border: isMine ? 'none' : '1px solid #e8ede9'
                      }}>
                        {msg.content}
                        <div style={{fontSize:'0.65rem', opacity:0.6, marginTop:'3px', textAlign:'right'}}>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef}/>
              </div>

              <div style={{padding:'12px 16px', borderTop:'1px solid #f0f4f1', display:'flex', gap:'8px'}}>
                <input type="text" value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ecrivez un message..."
                  style={{flex:1, padding:'10px 14px', border:'1px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', outline:'none', background:'#fafaf9', color:'#111a14'}}
                />
                <button onClick={handleSend} disabled={sending || !newMsg.trim()} style={{
                  padding:'10px 16px', background: sending || !newMsg.trim() ? '#f5f7f5' : '#1a7a4a',
                  border:'1px solid ' + (sending || !newMsg.trim() ? '#e8ede9' : '#1a7a4a'),
                  borderRadius:'9px', color: sending || !newMsg.trim() ? '#6b7c6e' : 'white',
                  fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem',
                  cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer'
                }}>
                  {sending ? '...' : '→'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}