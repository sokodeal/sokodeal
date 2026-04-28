'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      setUserEmail(user.email || '')
      fetchConversations(user.email || '')
    }
    getUser()
  }, [])

  const fetchConversations = async (email: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, ads(title, category)')
      .or(`sender_email.eq.${email},receiver_email.eq.${email}`)
      .order('created_at', { ascending: false })

    if (data) {
      const convMap: any = {}
      data.forEach((msg: any) => {
        const key = msg.ad_id + '_' + (msg.sender_email === email ? msg.receiver_email : msg.sender_email)
        if (!convMap[key]) {
          convMap[key] = {
            adId: msg.ad_id,
            adTitle: msg.ads?.title || 'Annonce',
            otherEmail: msg.sender_email === email ? msg.receiver_email : msg.sender_email,
            lastMsg: msg.content,
            lastDate: msg.created_at,
          }
        }
      })
      setConversations(Object.values(convMap))
    }
    setLoading(false)
  }

  const fetchMessages = async (adId: string, otherEmail: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('ad_id', adId)
      .or(`and(sender_email.eq.${userEmail},receiver_email.eq.${otherEmail}),and(sender_email.eq.${otherEmail},receiver_email.eq.${userEmail})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv) return
    const { error } = await supabase.from('messages').insert([{
      ad_id: activeConv.adId,
      sender_email: userEmail,
      receiver_email: activeConv.otherEmail,
      content: newMsg.trim()
    }])
    if (!error) {
      setNewMsg('')
      fetchMessages(activeConv.adId, activeConv.otherEmail)
    }
  }

  const openConv = (conv: any) => {
    setActiveConv(conv)
    fetchMessages(conv.adId, conv.otherEmail)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', background:'#faf7f2'}}>
      
      {/* Header */}
      <div style={{background:'#0f5233', padding:'0 5%', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0}}>
        <a href="/" style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:'white', textDecoration:'none'}}>
          🦁 Soko<span style={{color:'#f5a623'}}>Deal</span>
        </a>
        <span style={{color:'rgba(255,255,255,0.8)', fontSize:'0.9rem'}}>💬 Messagerie</span>
        <a href="/" style={{color:'rgba(255,255,255,0.7)', fontSize:'0.85rem', textDecoration:'none'}}>← Accueil</a>
      </div>

      {/* Body */}
      <div style={{flex:1, display:'flex', overflow:'hidden'}}>

        {/* Conversations list */}
        <div style={{width:'300px', borderRight:'1px solid #e8ede9', background:'white', overflowY:'auto', flexShrink:0}}>
          <div style={{padding:'16px', borderBottom:'1px solid #e8ede9'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem'}}>Conversations</h2>
          </div>

          {loading ? (
            <div style={{padding:'20px', color:'#6b7c6e', textAlign:'center'}}>⏳ Chargement...</div>
          ) : conversations.length === 0 ? (
            <div style={{padding:'24px', textAlign:'center', color:'#6b7c6e'}}>
              <div style={{fontSize:'2rem', marginBottom:'8px'}}>💬</div>
              <p style={{fontSize:'0.85rem'}}>Aucune conversation pour le moment</p>
              <a href="/" style={{display:'block', marginTop:'12px', padding:'8px', background:'#1a7a4a', color:'white', borderRadius:'8px', textDecoration:'none', fontSize:'0.82rem', fontFamily:'Syne,sans-serif', fontWeight:700}}>
                Voir les annonces
              </a>
            </div>
          ) : (
            conversations.map((conv, i) => (
              <div key={i} onClick={() => openConv(conv)} style={{
                padding:'14px 16px', borderBottom:'1px solid #e8ede9', cursor:'pointer',
                background: activeConv?.adId === conv.adId && activeConv?.otherEmail === conv.otherEmail ? '#e8f5ee' : 'white',
                transition:'background 0.15s'
              }}>
                <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem', marginBottom:'3px', color:'#111a14'}}>
                  {conv.adTitle}
                </div>
                <div style={{fontSize:'0.78rem', color:'#1a7a4a', marginBottom:'4px'}}>
                  {conv.otherEmail}
                </div>
                <div style={{fontSize:'0.78rem', color:'#6b7c6e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {conv.lastMsg}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Messages */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          {!activeConv ? (
            <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7c6e'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'3rem', marginBottom:'12px'}}>💬</div>
                <p style={{fontFamily:'Syne,sans-serif', fontWeight:700}}>Sélectionnez une conversation</p>
                <p style={{fontSize:'0.85rem', marginTop:'6px'}}>ou contactez un vendeur depuis une annonce</p>
              </div>
            </div>
          ) : (
            <>
              {/* Conv header */}
              <div style={{padding:'14px 20px', borderBottom:'1px solid #e8ede9', background:'white', flexShrink:0}}>
                <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.95rem'}}>{activeConv.adTitle}</div>
                <div style={{fontSize:'0.78rem', color:'#6b7c6e'}}>{activeConv.otherEmail}</div>
              </div>

              {/* Messages list */}
              <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'10px'}}>
                {messages.length === 0 ? (
                  <div style={{textAlign:'center', color:'#6b7c6e', marginTop:'40px'}}>
                    <p style={{fontSize:'0.85rem'}}>Commencez la conversation !</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} style={{
                      display:'flex',
                      justifyContent: msg.sender_email === userEmail ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        maxWidth:'70%', padding:'10px 14px', borderRadius:'14px',
                        background: msg.sender_email === userEmail ? '#1a7a4a' : 'white',
                        color: msg.sender_email === userEmail ? 'white' : '#111a14',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                        fontSize:'0.9rem', lineHeight:1.5
                      }}>
                        <p style={{margin:0}}>{msg.content}</p>
                        <p style={{margin:'4px 0 0', fontSize:'0.7rem', opacity:0.7, textAlign:'right'}}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <div style={{padding:'12px 16px', borderTop:'1px solid #e8ede9', background:'white', display:'flex', gap:'10px', flexShrink:0}}>
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Écrivez votre message..."
                  style={{flex:1, padding:'10px 14px', border:'1.5px solid #e8ede9', borderRadius:'24px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem', outline:'none', background:'#faf7f2'}}
                />
                <button onClick={sendMessage} style={{
                  padding:'10px 20px', background:'#1a7a4a', color:'white', border:'none',
                  borderRadius:'24px', fontFamily:'Syne,sans-serif', fontWeight:700,
                  fontSize:'0.9rem', cursor:'pointer'
                }}>Envoyer</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}