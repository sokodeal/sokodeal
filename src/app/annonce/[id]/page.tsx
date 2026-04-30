'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function AnnonceDetail() {
  const { id } = useParams()
  const [ad, setAd] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [msgSent, setMsgSent] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [shared, setShared] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿','voiture':'🚗',
    'moto':'🛵','electronique':'📱','mode':'👗','maison':'🛋️','emploi':'💼',
    'animaux':'🐄','services':'🏗️','agriculture':'🌾','materiaux':'🧱',
    'sante':'💊','sport':'⚽','education':'📚'
  }

  const catLabel: any = {
    'immo-vente':'Immobilier Vente','immo-location':'Immobilier Location',
    'immo-terrain':'Terrain','voiture':'Voitures','moto':'Motos',
    'electronique':'Electronique','mode':'Mode','maison':'Maison',
    'emploi':'Emploi','animaux':'Animaux','services':'Services',
    'agriculture':'Agriculture','materiaux':'Materiaux',
    'sante':'Sante','sport':'Sport','education':'Education'
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('ads').select('*').eq('id', id).single()
      if (data) setAd(data)
      const { data: authData } = await supabase.auth.getUser()
      setUser(authData.user)
      setLoading(false)
    }
    init()
  }, [id])

  useEffect(() => {
    if (!showShareMenu) return
    const close = () => setShowShareMenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showShareMenu])

  const handleContact = async () => {
    if (!message.trim()) return
    if (!user) { window.location.href = '/auth?mode=login'; return }
    setSending(true)
    await supabase.from('messages').insert([{
      ad_id: ad.id,
      sender_id: user.id,
      receiver_id: ad.user_id,
      sender_email: user.email,
      receiver_email: '',
      content: message,
    }])
    setSending(false)
    setMsgSent(true)
    setMessage('')
  }

  const getShareUrl = () => {
    if (typeof window !== 'undefined') return window.location.href
    return 'https://sokodeal.app/annonce/' + id
  }

  const shareText = ad ? ad.title + ' - ' + Number(ad.price).toLocaleString() + ' RWF sur SokoDeal' : ''

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getShareUrl())
    setShared(true)
    setShowShareMenu(false)
    setTimeout(() => setShared(false), 2500)
  }

  const handleNativeShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: ad?.title, text: shareText, url: getShareUrl() })
      setShowShareMenu(false)
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f7f5'}}>
      <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>Chargement...</p>
    </div>
  )

  if (!ad) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f7f5'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem', marginBottom:'12px'}}>😕</div>
        <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px', color:'#111a14'}}>Annonce introuvable</h2>
        <a href="/" style={{color:'#1a7a4a', fontWeight:600, textDecoration:'none'}}>Retour</a>
      </div>
    </div>
  )

  const hasPhotos = ad.images && ad.images.length > 0
  const waPhone = (ad.whatsapp || ad.phone || '').replace(/\s+/g, '').replace('+', '')
  const waText = encodeURIComponent('Bonjour, annonce SokoDeal : ' + ad.title + ' ' + getShareUrl())
  const fbUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(getShareUrl())
  const twUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText + ' ' + getShareUrl())
  const waShareUrl = 'https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + getShareUrl())

  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5'}}>
      <style>{`
        @media (max-width: 768px) {
          .detail-layout { grid-template-columns: 1fr !important; }
          .detail-right { position: static !important; }
          .detail-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <Header />

      <div style={{background:'white', borderBottom:'1px solid #f0f4f1', padding:'10px 5%'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', fontSize:'0.78rem', color:'#6b7c6e', display:'flex', alignItems:'center', gap:'6px'}}>
          <a href="/" style={{color:'#1a7a4a', textDecoration:'none', fontWeight:600}}>Accueil</a>
          <span>/</span>
          <span>{catLabel[ad.category] || ad.category}</span>
          <span>/</span>
          <span style={{color:'#111a14', fontWeight:600}}>{ad.title}</span>
        </div>
      </div>

      <div className="detail-layout" style={{maxWidth:'1100px', margin:'0 auto', padding:'20px 5%', display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', alignItems:'start'}}>

        <div>
          <div style={{background:'white', borderRadius:'14px', overflow:'hidden', border:'1px solid #e8ede9', marginBottom:'16px'}}>
            <div style={{height:'300px', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', position:'relative', overflow:'hidden'}}>
              {hasPhotos ? (
                <img src={ad.images[activePhoto]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}} />
              ) : (
                <span style={{opacity:0.4}}>{catEmoji[ad.category] || '📦'}</span>
              )}
              <div style={{position:'absolute', top:'12px', left:'12px', background:'white', color:'#111a14', padding:'4px 10px', borderRadius:'7px', fontSize:'0.75rem', fontWeight:600, border:'1px solid #e8ede9'}}>
                {catEmoji[ad.category]} {catLabel[ad.category] || ad.category}
              </div>
              <div style={{position:'absolute', top:'12px', right:'12px'}} onClick={e => e.stopPropagation()}>
                <div style={{position:'relative'}}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    style={{background:'white', border:'1px solid #e8ede9', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.78rem', color:'#111a14', display:'flex', alignItems:'center', gap:'5px'}}>
                    {shared ? 'Copie !' : 'Partager'}
                  </button>
                  {showShareMenu && (
                    <div
                      style={{position:'absolute', top:'36px', right:0, background:'white', borderRadius:'10px', border:'1px solid #e8ede9', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', padding:'6px', minWidth:'180px', zIndex:200}}
                      onClick={e => e.stopPropagation()}>
                      {canNativeShare && (
                        <button onClick={handleNativeShare} style={{width:'100%', padding:'9px 12px', background:'none', border:'none', borderRadius:'7px', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', color:'#111a14', textAlign:'left'}}>
                          Partager via...
                        </button>
                      )}
                      <button onClick={handleCopyLink} style={{width:'100%', padding:'9px 12px', background:'none', border:'none', borderRadius:'7px', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', color:'#111a14', textAlign:'left'}}>
                        Copier le lien
                      </button>
                      <a href={waShareUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShowShareMenu(false)}
                        style={{display:'block', padding:'9px 12px', borderRadius:'7px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', color:'#111a14', textDecoration:'none'}}>
                        WhatsApp
                      </a>
                      <a href={fbUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShowShareMenu(false)}
                        style={{display:'block', padding:'9px 12px', borderRadius:'7px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', color:'#111a14', textDecoration:'none'}}>
                        Facebook
                      </a>
                      <a href={twUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShowShareMenu(false)}
                        style={{display:'block', padding:'9px 12px', borderRadius:'7px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', color:'#111a14', textDecoration:'none'}}>
                        Twitter / X
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {hasPhotos && ad.images.length > 1 && (
              <div style={{display:'flex', gap:'6px', padding:'10px 14px', overflowX:'auto'}}>
                {ad.images.map((img: string, i: number) => (
                  <div key={i} onClick={() => setActivePhoto(i)} style={{width:'60px', height:'60px', flexShrink:0, borderRadius:'8px', overflow:'hidden', cursor:'pointer', border: activePhoto === i ? '2px solid #1a7a4a' : '2px solid transparent', opacity: activePhoto === i ? 1 : 0.6}}>
                    <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{background:'white', borderRadius:'14px', padding:'20px', border:'1px solid #e8ede9', marginBottom:'16px'}}>
            <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', marginBottom:'12px', lineHeight:1.3, color:'#111a14'}}>
              {ad.title}
            </h1>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
              <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.7rem', color:'#0f5233'}}>
                {Number(ad.price).toLocaleString()} <span style={{fontSize:'0.9rem', fontWeight:600, color:'#6b7c6e'}}>RWF</span>
              </div>
              <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                {ad.province && (
                  <span style={{background:'#f5f7f5', color:'#111a14', padding:'5px 10px', borderRadius:'7px', fontSize:'0.75rem', fontWeight:600, border:'1px solid #e8ede9'}}>
                    {ad.province}{ad.district ? ' - ' + ad.district : ''}
                  </span>
                )}
                <span style={{background:'#f5f7f5', color:'#6b7c6e', padding:'5px 10px', borderRadius:'7px', fontSize:'0.75rem', border:'1px solid #e8ede9'}}>
                  {new Date(ad.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {ad.description && (
            <div style={{background:'white', borderRadius:'14px', padding:'20px', border:'1px solid #e8ede9', marginBottom:'16px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.95rem', marginBottom:'12px', color:'#111a14', textTransform:'uppercase', letterSpacing:'0.04em'}}>Description</h2>
              <p style={{color:'#333', lineHeight:1.8, fontSize:'0.92rem', whiteSpace:'pre-wrap'}}>{ad.description}</p>
            </div>
          )}

          <div style={{background:'white', borderRadius:'14px', padding:'20px', border:'1px solid #e8ede9'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.95rem', marginBottom:'14px', color:'#111a14', textTransform:'uppercase', letterSpacing:'0.04em'}}>Details</h2>
            <div className="detail-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              {[
    { label:'Categorie', value: catLabel[ad.category] || ad.category, icon:'🏷️' },
    { label:'Prix', value: Number(ad.price).toLocaleString() + ' RWF', icon:'💰' },
    { label:'Ville', value: ad.province || '-', icon:'🗺️' },
    { label:'District', value: ad.district || '-', icon:'📍' },
    { label:'Publie le', value: new Date(ad.created_at).toLocaleDateString('fr-FR'), icon:'📅' },
    { label:'Statut', value: ad.is_active ? 'Active' : 'Inactive', icon:'🔘' },
    ...(ad.immo_type ? [{ label:'Type', value: ad.immo_type, icon:'🏡' }] : []),
    ...(ad.surface ? [{ label:'Surface', value: ad.surface + ' m²', icon:'📐' }] : []),
    ...(ad.chambres ? [{ label:'Chambres', value: ad.chambres, icon:'🛏️' }] : []),
    ...(ad.salles_de_bain ? [{ label:'Salles de bain', value: ad.salles_de_bain, icon:'🚿' }] : []),
    ...(ad.etage ? [{ label:'Etage', value: ad.etage, icon:'🏢' }] : []),
    ...(ad.etat ? [{ label:'Etat', value: ad.etat === 'neuf' ? 'Neuf' : ad.etat === 'bon-etat' ? 'Bon etat' : 'A renover', icon:'✨' }] : []),
    ...(ad.meuble ? [{ label:'Meuble', value: 'Oui', icon:'🛋️' }] : []),
    ...(ad.charges_incluses ? [{ label:'Charges', value: 'Incluses', icon:'💡' }] : []),
  ].map((item, i) => (
                <div key={i} style={{background:'#f5f7f5', borderRadius:'9px', padding:'11px 13px', border:'1px solid #e8ede9'}}>
                  <div style={{fontSize:'0.7rem', color:'#6b7c6e', fontWeight:600, marginBottom:'3px', textTransform:'uppercase'}}>{item.icon} {item.label}</div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'#111a14'}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-right" style={{position:'sticky', top:'78px'}}>
          <div style={{background:'white', borderRadius:'14px', padding:'20px', border:'1px solid #e8ede9', marginBottom:'12px'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.95rem', marginBottom:'16px', color:'#111a14', textTransform:'uppercase', letterSpacing:'0.04em'}}>Contacter le vendeur</h2>

            {msgSent ? (
              <div style={{textAlign:'center', padding:'16px 0'}}>
                <div style={{width:'48px', height:'48px', background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 12px'}}>✅</div>
                <p style={{fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1a7a4a', marginBottom:'4px', fontSize:'0.9rem'}}>Message envoye !</p>
                <p style={{fontSize:'0.8rem', color:'#6b7c6e', marginBottom:'14px'}}>Le vendeur vous repondra bientot.</p>
                <button onClick={() => setMsgSent(false)} style={{padding:'7px 16px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'8px', color:'#111a14', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.82rem', cursor:'pointer'}}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <>
                {ad.hide_phone && (
                  <div style={{background:'#f5f7f5', borderRadius:'9px', padding:'12px', border:'1px solid #e8ede9', marginBottom:'10px', textAlign:'center'}}>
                    <div style={{fontSize:'1.5rem', marginBottom:'6px'}}>🔒</div>
                    <p style={{fontSize:'0.82rem', color:'#6b7c6e', fontFamily:'DM Sans,sans-serif'}}>Ce vendeur prefere etre contacte via la messagerie SokoDeal</p>
                  </div>
                )}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Bonjour, je suis interesse par cette annonce..."
                  rows={4}
                  style={{width:'100%', padding:'11px 13px', border:'1px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', outline:'none', resize:'vertical', background:'#fafaf9', marginBottom:'10px', boxSizing:'border-box', color:'#111a14'}}
                />
                <button onClick={handleContact} disabled={sending || !message.trim()} style={{
                  width:'100%', padding:'12px',
                  background: sending || !message.trim() ? '#e8ede9' : '#1a7a4a',
                  border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700,
                  fontSize:'0.9rem', color: sending || !message.trim() ? '#6b7c6e' : 'white',
                  cursor: sending || !message.trim() ? 'not-allowed' : 'pointer', marginBottom:'8px'
                }}>
                  {sending ? 'Envoi...' : 'Envoyer le message'}
                </button>
                {!user && (
                  <p style={{fontSize:'0.75rem', color:'#6b7c6e', textAlign:'center', marginBottom:'8px'}}>
                    <a href="/auth?mode=login" style={{color:'#1a7a4a', fontWeight:700}}>Connectez-vous</a> pour envoyer un message
                  </p>
                )}
                {!ad.hide_phone && ad.phone && (
                  <a href={'tel:' + ad.phone} style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'11px', background:'#f5f7f5', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.88rem', color:'#111a14', textDecoration:'none', marginTop:'8px', boxSizing:'border-box', border:'1px solid #e8ede9'}}>
                    {ad.phone}
                  </a>
                )}
                {!ad.hide_phone && (ad.whatsapp || ad.phone) && (
                  <a href={'https://wa.me/' + waPhone + '?text=' + waText} target="_blank" rel="noopener noreferrer"
                    style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'11px', background:'#25D366', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.88rem', color:'white', textDecoration:'none', marginTop:'8px', boxSizing:'border-box'}}>
                    WhatsApp
                  </a>
                )}
              </>
            )}
          </div>

          <div style={{background:'#fffbeb', borderRadius:'12px', padding:'14px', border:'1px solid #fde68a'}}>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', marginBottom:'8px', color:'#78350f', textTransform:'uppercase', letterSpacing:'0.04em'}}>
              Conseils de securite
            </h3>
            {[
              'Ne payez jamais a l avance sans voir l article',
              'Rencontrez le vendeur dans un lieu public',
              'Verifiez l article avant tout paiement'
            ].map((tip, i) => (
              <div key={i} style={{display:'flex', gap:'6px', marginBottom:'5px', fontSize:'0.75rem', color:'#78350f'}}>
                <span style={{fontWeight:700, flexShrink:0}}>✓</span> {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}