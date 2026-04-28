'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AnnonceDetail() {
  const { id } = useParams()
  const [ad, setAd] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [msgSent, setMsgSent] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿','voiture':'🚗',
    'moto':'🛵','electronique':'📱','mode':'👗','maison':'🛋️','emploi':'💼',
    'animaux':'🐄','services':'🏗️','agriculture':'🌾','materiaux':'🧱',
    'sante':'💊','sport':'⚽','education':'📚'
  }
  const catLabel: any = {
    'immo-vente':'Immobilier Vente','immo-location':'Immobilier Location',
    'immo-terrain':'Terrain','voiture':'Voitures','moto':'Motos',
    'electronique':'Electronique','mode':'Mode et Beaute','maison':'Maison et Jardin',
    'emploi':'Emploi','animaux':'Animaux','services':'Services',
    'agriculture':'Agriculture','materiaux':'Materiaux Construction',
    'sante':'Sante et Beaute','sport':'Sport et Loisirs','education':'Education'
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('ads').select('*').eq('id', id).single()
      if (data) setAd(data)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    init()
  }, [id])

  const handleContact = async () => {
    if (!message.trim()) return
    if (!user) { window.location.href = '/auth?mode=login'; return }
    setSending(true)
    await supabase.from('messages').insert([{
      ad_id: ad.id, sender_id: user.id, receiver_id: ad.user_id,
      sender_email: user.email, receiver_email: '', content: message,
    }])
    setSending(false)
    setMsgSent(true)
    setMessage('')
  }

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f1'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem', marginBottom:'12px'}}>⏳</div>
        <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>Chargement...</p>
      </div>
    </div>
  )

  if (!ad) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f1'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem', marginBottom:'12px'}}>😕</div>
        <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px'}}>Annonce introuvable</h2>
        <a href="/" style={{color:'#1a7a4a', fontWeight:600}}>Retour a l accueil</a>
      </div>
    </div>
  )

  const hasPhotos = ad.images && ad.images.length > 0
  const waPhone = ad.phone ? ad.phone.replace(/\s+/g, '').replace('+', '') : ''
  const waText = encodeURIComponent('Bonjour, je suis interesse par votre annonce sur SokoDeal : ' + ad.title)

  return (
    <div style={{minHeight:'100vh', background:'#f0f4f1'}}>
      <style>{`
        @media (max-width: 768px) {
          .detail-layout { grid-template-columns: 1fr !important; }
          .detail-right { position: static !important; }
          .detail-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <header style={{background:'#0f5233', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 16px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4%', height:'58px'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
            <div style={{width:'32px', height:'32px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'white'}}>Soko<span style={{color:'#f5a623'}}>Deal</span></span>
          </a>
          <div style={{display:'flex', gap:'8px'}}>
            {user ? (
              <button onClick={() => window.location.href='/profil'} style={{display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:'8px', color:'white', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
                <div style={{width:'24px', height:'24px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.75rem', color:'#111a14'}}>
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
              </button>
            ) : (
              <button onClick={() => window.location.href='/auth?mode=login'} style={{padding:'7px 14px', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:'8px', color:'white', background:'transparent', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
                Connexion
              </button>
            )}
            <button onClick={() => window.location.href='/publier'} style={{padding:'7px 14px', background:'#f5a623', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', color:'#111a14', cursor:'pointer'}}>
              + Deposer
            </button>
          </div>
        </div>
      </header>

      <div style={{background:'white', borderBottom:'1px solid #e8ede9', padding:'10px 4%'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', fontSize:'0.78rem', color:'#6b7c6e', display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap'}}>
          <a href="/" style={{color:'#1a7a4a', textDecoration:'none', fontWeight:600}}>Accueil</a>
          <span>›</span>
          <span>{catLabel[ad.category] || ad.category}</span>
          <span>›</span>
          <span style={{color:'#111a14', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px'}}>{ad.title}</span>
        </div>
      </div>

      <div className="detail-layout" style={{maxWidth:'1100px', margin:'0 auto', padding:'20px 4%', display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', alignItems:'start'}}>

        <div>
          <div style={{background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:'16px'}}>
            <div style={{height:'280px', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', position:'relative', overflow:'hidden'}}>
              {hasPhotos ? (
                <img src={ad.images[activePhoto]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
              ) : (
                <span>{catEmoji[ad.category] || '📦'}</span>
              )}
              <div style={{position:'absolute', top:'12px', left:'12px', background:'rgba(15,82,51,0.85)', color:'white', padding:'4px 10px', borderRadius:'7px', fontSize:'0.75rem', fontWeight:700}}>
                {catEmoji[ad.category]} {catLabel[ad.category] || ad.category}
              </div>
            </div>
            {hasPhotos && ad.images.length > 1 && (
              <div style={{display:'flex', gap:'6px', padding:'10px 14px', overflowX:'auto'}}>
                {ad.images.map((img: string, i: number) => (
                  <div key={i} onClick={() => setActivePhoto(i)} style={{width:'60px', height:'60px', flexShrink:0, borderRadius:'7px', overflow:'hidden', cursor:'pointer', border: activePhoto === i ? '3px solid #1a7a4a' : '3px solid transparent'}}>
                    <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{background:'white', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:'16px'}}>
            <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', marginBottom:'10px', lineHeight:1.3}}>
              {ad.title}
            </h1>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
              <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.7rem', color:'#1a7a4a'}}>
                {Number(ad.price).toLocaleString()} <span style={{fontSize:'0.9rem', fontWeight:600}}>RWF</span>
              </div>
              <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                {ad.province && (
                  <span style={{background:'#e8f5ee', color:'#1a7a4a', padding:'5px 10px', borderRadius:'7px', fontSize:'0.75rem', fontWeight:600}}>
                    📍 {ad.province}{ad.district ? ' · ' + ad.district : ''}
                  </span>
                )}
                <span style={{background:'#f5f7f5', color:'#6b7c6e', padding:'5px 10px', borderRadius:'7px', fontSize:'0.75rem', fontWeight:600}}>
                  🕐 {new Date(ad.created_at).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}
                </span>
              </div>
            </div>
          </div>

          {ad.description && (
            <div style={{background:'white', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:'16px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', marginBottom:'12px'}}>📝 Description</h2>
              <p style={{color:'#333', lineHeight:1.8, fontSize:'0.9rem', whiteSpace:'pre-wrap'}}>{ad.description}</p>
            </div>
          )}

          <div style={{background:'white', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', marginBottom:'14px'}}>📋 Details</h2>
            <div className="detail-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              {[
                { label:'Categorie', value: catLabel[ad.category] || ad.category, icon:'🏷️' },
                { label:'Prix', value: Number(ad.price).toLocaleString() + ' RWF', icon:'💰' },
                { label:'Ville', value: ad.province || '—', icon:'🗺️' },
                { label:'District', value: ad.district || '—', icon:'📍' },
                { label:'Publie le', value: new Date(ad.created_at).toLocaleDateString('fr-FR'), icon:'📅' },
                { label:'Statut', value: ad.is_active ? 'Active ✅' : 'Inactive', icon:'🔘' },
              ].map((item, i) => (
                <div key={i} style={{background:'#f5f7f5', borderRadius:'9px', padding:'10px 12px'}}>
                  <div style={{fontSize:'0.72rem', color:'#6b7c6e', fontWeight:600, marginBottom:'3px'}}>{item.icon} {item.label}</div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem'}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-right" style={{position:'sticky', top:'80px'}}>
          <div style={{background:'white', borderRadius:'16px', padding:'20px', boxShadow:'0 4px 24px rgba(10,60,25,0.12)', marginBottom:'14px'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', marginBottom:'14px'}}>💬 Contacter le vendeur</h2>

            {msgSent ? (
              <div style={{textAlign:'center', padding:'16px 0'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'8px'}}>✅</div>
                <p style={{fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1a7a4a', marginBottom:'4px'}}>Message envoye !</p>
                <p style={{fontSize:'0.82rem', color:'#6b7c6e'}}>Le vendeur vous repondra bientot.</p>
                <button onClick={() => setMsgSent(false)} style={{marginTop:'12px', padding:'7px 16px', background:'#f0f4f1', border:'none', borderRadius:'8px', color:'#1a7a4a', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', cursor:'pointer'}}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Bonjour, je suis interesse par cette annonce. Est-elle encore disponible ?"
                  rows={4}
                  style={{width:'100%', padding:'11px 13px', border:'1.5px solid #e8ede9', borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', outline:'none', resize:'vertical', background:'#faf7f2', marginBottom:'10px', boxSizing:'border-box'}}
                />
                <button onClick={handleContact} disabled={sending || !message.trim()} style={{
                  width:'100%', padding:'12px',
                  background: sending || !message.trim() ? '#ccc' : '#1a7a4a',
                  border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
                  fontSize:'0.95rem', color:'white', cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                  marginBottom:'8px'
                }}>
                  {sending ? '⏳ Envoi...' : '📨 Envoyer le message'}
                </button>
                {!user && (
                  <p style={{fontSize:'0.75rem', color:'#6b7c6e', textAlign:'center'}}>
                    <a href="/auth?mode=login" style={{color:'#1a7a4a', fontWeight:700}}>Connectez-vous</a> pour envoyer un message
                  </p>
                )}
              </>
            )}

            {ad.phone && (
              <a href={'tel:' + ad.phone} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                width:'100%', padding:'11px', background:'#e8f5ee', borderRadius:'10px',
                fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem',
                color:'#0f5233', textDecoration:'none', marginTop:'8px', boxSizing:'border-box'
              }}>
                📞 {ad.phone}
              </a>
            )}

            {ad.phone && (
              <a href={'https://wa.me/' + waPhone + '?text=' + waText}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  width:'100%', padding:'11px', background:'#25D366', borderRadius:'10px',
                  fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem',
                  color:'white', textDecoration:'none', marginTop:'8px', boxSizing:'border-box'
                }}>
                💬 WhatsApp
              </a>
            )}
          </div>

          <div style={{background:'#fff8e7', borderRadius:'13px', padding:'14px', border:'1.5px solid #f5e6c0'}}>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', marginBottom:'8px', color:'#7a5c00'}}>
              🛡️ Conseils de securite
            </h3>
            {[
              'Ne payez jamais a l avance sans voir l article',
              'Rencontrez le vendeur dans un lieu public',
              'Verifiez l article avant tout paiement'
            ].map((tip, i) => (
              <div key={i} style={{display:'flex', gap:'6px', marginBottom:'5px', fontSize:'0.75rem', color:'#7a5c00'}}>
                <span style={{fontWeight:700}}>✓</span> {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}