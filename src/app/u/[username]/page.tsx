'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/FavoriteButton'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState<any>(null)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿','voiture':'🚗',
    'moto':'🛵','electronique':'📱','mode':'👗','maison':'🛋️','emploi':'💼',
    'animaux':'🐄','services':'🏗️','agriculture':'🌾','materiaux':'🧱',
    'sante':'💊','sport':'⚽','education':'📚'
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (!userData) { setLoading(false); return }
      setProfile(userData)

      const { data: adsData } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (adsData) setAds(adsData)
      setLoading(false)
    }
    init()
  }, [username])

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f7f5'}}>
      <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>⏳ Chargement...</p>
    </div>
  )

  if (!profile) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f7f5'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem', marginBottom:'12px'}}>😕</div>
        <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px', color:'#111a14'}}>Profil introuvable</h2>
        <p style={{color:'#6b7c6e', marginBottom:'16px', fontSize:'0.88rem'}}>@{username} n existe pas sur SokoDeal</p>
        <a href="/" style={{color:'#1a7a4a', fontWeight:600, textDecoration:'none'}}>← Retour a l accueil</a>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5'}}>
      <style>{`
        @media (max-width: 768px) {
          .pub-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .pub-grid { grid-template-columns: 1fr !important; }
        }
        .ad-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }
        .ad-card { transition: transform 0.18s, box-shadow 0.18s; }
      `}</style>

      {/* HEADER */}
      <header style={{background:'white', borderBottom:'1px solid #e8ede9', position:'sticky', top:0, zIndex:100}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'58px', maxWidth:'1100px', margin:'0 auto'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
            <div style={{width:'32px', height:'32px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
          </a>
          <div style={{display:'flex', gap:'8px'}}>
            {currentUser ? (
              <button onClick={() => window.location.href='/profil'} style={{padding:'7px 14px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'8px', color:'#111a14', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
                Mon compte
              </button>
            ) : (
              <button onClick={() => window.location.href='/auth?mode=login'} style={{padding:'7px 14px', border:'1px solid #e8ede9', borderRadius:'8px', color:'#111a14', background:'white', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
                Connexion
              </button>
            )}
            <button onClick={() => window.location.href='/publier'} style={{padding:'7px 14px', background:'#f5a623', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', color:'#111a14', cursor:'pointer'}}>
              + Deposer
            </button>
          </div>
        </div>
      </header>

      {/* HERO PROFIL */}
      <div style={{background:'linear-gradient(135deg, #0f5233 0%, #1a7a4a 100%)', padding:'36px 5% 56px'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', display:'flex', alignItems:'center', gap:'20px'}}>
          <div style={{width:'72px', height:'72px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', fontWeight:800, color:'#111a14', fontFamily:'Syne,sans-serif', flexShrink:0, border:'3px solid rgba(255,255,255,0.3)'}}>
            {(profile.full_name || profile.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'white', marginBottom:'4px'}}>
              {profile.full_name || '@' + profile.username}
            </h1>
            <p style={{color:'#f5a623', fontSize:'0.88rem', fontWeight:700, marginBottom:'6px'}}>@{profile.username}</p>
            <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
              <span style={{background:'rgba(255,255,255,0.12)', color:'white', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600}}>
                Membre SokoDeal
              </span>
              <span style={{background:'rgba(245,166,35,0.25)', color:'#f5a623', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600}}>
                {ads.length} annonce(s)
              </span>
              {profile.is_verified && (
                <span style={{background:'rgba(255,255,255,0.2)', color:'white', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600}}>
                  ✅ Verifie
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'1100px', margin:'-24px auto 0', padding:'0 5% 40px'}}>

        {/* STATS RAPIDES */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'24px'}}>
          {[
            { label:'Annonces actives', value: ads.length, icon:'📋' },
            { label:'Localisation', value: profile.phone ? '📞 ' + profile.phone : '—', icon:'📍' },
            { label:'Membre depuis', value: new Date(profile.created_at).toLocaleDateString('fr-FR', {month:'long', year:'numeric'}), icon:'📅' },
          ].map((s, i) => (
            <div key={i} style={{background:'white', borderRadius:'12px', padding:'14px', border:'1px solid #e8ede9', textAlign:'center'}}>
              <div style={{fontSize:'1.3rem', marginBottom:'4px'}}>{s.icon}</div>
              <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'#111a14', marginBottom:'2px'}}>{s.value}</div>
              <div style={{fontSize:'0.7rem', color:'#6b7c6e'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ANNONCES */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#111a14'}}>
            Annonces de @{profile.username}
          </h2>
          <span style={{fontSize:'0.82rem', color:'#6b7c6e'}}>{ads.length} annonce(s)</span>
        </div>

        {ads.length === 0 ? (
          <div style={{background:'white', borderRadius:'14px', padding:'48px', textAlign:'center', border:'1px solid #e8ede9'}}>
            <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>📭</div>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px', color:'#111a14'}}>Aucune annonce</h3>
            <p style={{color:'#6b7c6e', fontSize:'0.88rem'}}>Cet utilisateur n a pas encore d annonces</p>
          </div>
        ) : (
          <div className="pub-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px'}}>
            {ads.map((ad: any) => (
              <div key={ad.id} className="ad-card" onClick={() => window.location.href='/annonce/' + ad.id}
                style={{background:'white', borderRadius:'14px', overflow:'hidden', cursor:'pointer', border: ad.is_boosted ? '1.5px solid #f5a623' : '1px solid #e8ede9', boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{height:'176px', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3.5rem', overflow:'hidden', position:'relative'}}>
                  {ad.images && ad.images.length > 0 ? (
                    <img src={ad.images[0]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                  ) : (
                    <span style={{opacity:0.5}}>{catEmoji[ad.category] || '📦'}</span>
                  )}
                  {ad.is_boosted && (
                    <div style={{position:'absolute', top:'10px', left:'10px', background:'#f5a623', color:'#111a14', padding:'3px 9px', borderRadius:'6px', fontSize:'0.68rem', fontWeight:800}}>
                      ⚡ Mis en avant
                    </div>
                  )}
                  <div style={{position:'absolute', top:'10px', right:'10px'}} onClick={e => e.stopPropagation()}>
                    <FavoriteButton adId={ad.id} onLogin={() => window.location.href='/auth?mode=login'} />
                  </div>
                </div>
                <div style={{padding:'14px'}}>
                  <div style={{fontSize:'0.66rem', fontWeight:600, color:'#1a7a4a', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px'}}>{ad.category}</div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.93rem', marginBottom:'5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#111a14'}}>{ad.title}</div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'#0f5233', marginBottom:'8px'}}>
                    {Number(ad.price).toLocaleString()} <span style={{fontSize:'0.75rem', fontWeight:600}}>RWF</span>
                  </div>
                  {ad.province && <div style={{fontSize:'0.72rem', color:'#6b7c6e', marginBottom:'10px'}}>📍 {ad.province}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
