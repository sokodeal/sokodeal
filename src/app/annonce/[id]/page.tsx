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
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿',
    'voiture':'🚗','moto':'🛵','electronique':'📱',
    'mode':'👗','maison':'🛋️','emploi':'💼','animaux':'🐄','services':'🏗️'
  }
  const catLabel: any = {
    'immo-vente':'Immobilier · Vente','immo-location':'Immobilier · Location',
    'immo-terrain':'Terrain','voiture':'Voitures','moto':'Motos',
    'electronique':'Électronique','mode':'Mode & Beauté','maison':'Maison & Jardin',
    'emploi':'Emploi','animaux':'Animaux','services':'Services'
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
      ad_id: ad.id,
      sender_id: user.id,
      receiver_id: ad.user_id,
      content: message,
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
        <a href="/" style={{color:'#1a7a4a', fontWeight:600}}>← Retour à l'accueil</a>
      </div>
    </div>
  )

  const hasPhotos = ad.images && ad.images.length > 0

  return (
    <div style={{minHeight:'100vh', background:'#f0f4f1'}}>

      {/* HEADER */}
      <header style={{background:'#0f5233', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 16px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'64px'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'10px', textDecoration:'none'}}>
            <div style={{width:'36px', height:'36px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'white'}}>Soko<span style={{color:'#f5a623'}}>Deal</span></span>
          </a>
          <div style={{display:'flex', gap:'10px'}}>
            {user ? (
              <button onClick={() => window.location.href='/profil'} style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px 18px', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:'8px', color:'white', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', cursor:'pointer'}}>
                <div style={{width:'26px', height:'26px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.8rem', color:'#111a14'}}>
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                Mon compte
              </button>
            ) : (
              <button onClick={() => window.location.href='/auth?mode=login'} style={{padding:'8px 18px', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:'8px', color:'white', background:'transparent', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', cursor:'pointer'}}>
                Se connecter
              </button>
            )}
            <button onClick={() => window.location.href='/publier'} style={{padding:'8px 18px', background:'#f5a623', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'#111a14', cursor:'pointer'}}>
              + Déposer
            </button>
          </div>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div style={{background:'white', borderBottom:'1px solid #e8ede9', padding:'12px 5%'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', fontSize:'0.82rem', color:'#6b7c6e', display:'flex', alignItems:'center', gap:'6px'}}>
          <a href="/" style={{color:'#1a7a4a', textDecoration:'none', fontWeight:600}}>Accueil</a>
          <span>›</span>
          <span>{catLabel[ad.category] || ad.category}</span>
          <span>›</span>
          <span style={{color:'#111a14', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'300px'}}>{ad.title}</span>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={{maxWidth:'1100px', margin:'0 auto', padding:'28px 5%', display:'grid', gridTemplateColumns:'1fr 360px', gap:'24px', alignItems:'start'}}>

        {/* COLONNE GAUCHE */}
        <div>

          {/* GALERIE PHOTOS */}
          <div style={{background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:'20px'}}>
            <div style={{height:'380px', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'6rem', position:'relative', overflow:'hidden'}}>
              {hasPhotos ? (
                <img src={ad.images[activePhoto]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
              ) : (
                catEmoji[ad.category] || '📦'
              )}
              {/* Badge catégorie */}
              <div style={{position:'absolute', top:'14px', left:'14px', background:'rgba(15,82,51,0.85)', color:'white', padding:'5px 12px', borderRadius:'8px', fontSize:'0.78rem', fontWeight:700, backdropFilter:'blur(4px)'}}>
                {catEmoji[ad.category]} {catLabel[ad.category] || ad.category}
              </div>
            </div>
            {/* Miniatures */}
            {hasPhotos && ad.images.length > 1 && (
              <div style={{display:'flex', gap:'8px', padding:'12px 16px', overflowX:'auto'}}>
                {ad.images.map((img: string, i: number) => (
                  <div key={i} onClick={() => setActivePhoto(i)} style={{
                    width:'70px', height:'70px', flexShrink:0, borderRadius:'8px',
                    overflow:'hidden', cursor:'pointer',
                    border: activePhoto === i ? '3px solid #1a7a4a' : '3px solid transparent',
                    transition:'border 0.2s'
                  }}>
                    <img src={img} alt={`photo ${i+1}`} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TITRE + PRIX */}
          <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:'20px'}}>
            <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', marginBottom:'12px', lineHeight:1.3}}>
              {ad.title}
            </h1>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px'}}>
              <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'2rem', color:'#1a7a4a'}}>
                {Number(ad.price).toLocaleString()} <span style={{fontSize:'1rem', fontWeight:600}}>RWF</span>
              </div>
              <div style={{display:'flex', gap:'8px'}}>
                {ad.province && (
                  <span style={{background:'#e8f5ee', color:'#1a7a4a', padding:'6px 12px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:600}}>
                    📍 {ad.province}{ad.district ? ` · ${ad.district}` : ''}
                  </span>
                )}
                <span style={{background:'#f5f7f5', color:'#6b7c6e', padding:'6px 12px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:600}}>
                  🕐 {new Date(ad.created_at).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}
                </span>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          {ad.description && (
            <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:'20px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'14px'}}>📝 Description</h2>
              <p style={{color:'#333', lineHeight:1.8, fontSize:'0.95rem', whiteSpace:'pre-wrap'}}>
                {ad.description}
              </p>
            </div>
          )}

          {/* DÉTAILS */}
          <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'16px'}}>📋 Détails de l'annonce</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
              {[
                { label:'Catégorie', value: catLabel[ad.category] || ad.category, icon:'🏷️' },
                { label:'Prix', value: `${Number(ad.price).toLocaleString()} RWF`, icon:'💰' },
                { label:'Province', value: ad.province || '—', icon:'🗺️' },
                { label:'District', value: ad.district || '—', icon:'📍' },
                { label:'Publié le', value: new Date(ad.created_at).toLocaleDateString('fr-FR'), icon:'📅' },
                { label:'Statut', value: ad.is_active ? 'Active ✅' : 'Inactive', icon:'🔘' },
              ].map((item, i) => (
                <div key={i} style={{background:'#f5f7f5', borderRadius:'10px', padding:'12px 14px'}}>
                  <div style={{fontSize:'0.75rem', color:'#6b7c6e', fontWeight:600, marginBottom:'4px'}}>{item.icon} {item.label}</div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.92rem'}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE — CONTACT */}
        <div style={{position:'sticky', top:'90px'}}>

          {/* CARD CONTACT */}
          <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 4px 24px rgba(10,60,25,0.12)', marginBottom:'16px'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'16px'}}>💬 Contacter le vendeur</h2>

            {msgSent ? (
              <div style={{textAlign:'center', padding:'20px 0'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'10px'}}>✅</div>
                <p style={{fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1a7a4a', marginBottom:'6px'}}>Message envoyé !</p>
                <p style={{fontSize:'0.85rem', color:'#6b7c6e'}}>Le vendeur vous répondra bientôt.</p>
                <button onClick={() => setMsgSent(false)} style={{marginTop:'14px', padding:'8px 18px', background:'#f0f4f1', border:'none', borderRadius:'8px', color:'#1a7a4a', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer'}}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Bonjour, je suis intéressé(e) par "${ad.title}". Est-il encore disponible ?`}
                  rows={4}
                  style={{width:'100%', padding:'12px 14px', border:'1.5px solid #e8ede9', borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', outline:'none', resize:'vertical', background:'#faf7f2', marginBottom:'12px', boxSizing:'border-box'}}
                />
                <button onClick={handleContact} disabled={sending || !message.trim()} style={{
                  width:'100%', padding:'13px', background: sending || !message.trim() ? '#ccc' : '#1a7a4a',
                  border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
                  fontSize:'1rem', color:'white', cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                  marginBottom:'10px'
                }}>
                  {sending ? '⏳ Envoi...' : '📨 Envoyer le message'}
                </button>
                {!user && (
                  <p style={{fontSize:'0.8rem', color:'#6b7c6e', textAlign:'center'}}>
                    Vous devez être <a href="/auth?mode=login" style={{color:'#1a7a4a', fontWeight:700}}>connecté</a> pour envoyer un message
                  </p>
                )}
              </>
            )}

            {/* Appel direct */}
            {ad.phone && (
              <a href={`tel:${ad.phone}`} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                width:'100%', padding:'12px', background:'#e8f5ee',
                border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif',
                fontWeight:700, fontSize:'0.95rem', color:'#0f5233',
                textDecoration:'none', marginTop:'10px', boxSizing:'border-box'
              }}>
                📞 {ad.phone}
              </a>
            )}

            {/* WhatsApp */}
            {ad.phone && (
              
                href={`https://wa.me/${ad.phone.replace(/\s+/g,'').replace('+','')}?text=Bonjour, je suis intéressé(e) par votre annonce "${ad.title}" sur SokoDeal.`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  width:'100%', padding:'12px', background:'#25D366',
                  borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700,
                  fontSize:'0.95rem', color:'white', textDecoration:'none',
                  marginTop:'8px', boxSizing:'border-box'
                }}
              >
                💬 Contacter sur WhatsApp
              </a>
            )}
          </div>

          {/* SÉCURITÉ */}
          <div style={{background:'#fff8e7', borderRadius:'14px', padding:'16px', border:'1.5px solid #f5e6c0'}}>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', marginBottom:'10px', color:'#7a5c00'}}>
              🛡️ Conseils de sécurité
            </h3>
            {['Ne payez jamais à l\'avance sans voir l\'article','Rencontrez le vendeur dans un lieu public','Vérifiez l\'article avant tout paiement'].map((tip, i) => (
              <div key={i} style={{display:'flex', gap:'8px', marginBottom:'6px', fontSize:'0.8rem', color:'#7a5c00'}}>
                <span style={{fontWeight:700}}>✓</span> {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}