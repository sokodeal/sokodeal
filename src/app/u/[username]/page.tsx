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
  const [isOwner, setIsOwner] = useState(false)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '', location: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [editMsg, setEditMsg] = useState('')

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
      setEditForm({ bio: userData.bio || '', location: userData.location || '' })

      if (user && user.id === userData.id) setIsOwner(true)

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

  const handleBannerUpload = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const ext = file.name.split('.').pop()
    const path = `banners/${currentUser.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('ads-images').upload(path, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('ads-images').getPublicUrl(path)
      await supabase.from('users').update({ banner_url: urlData.publicUrl }).eq('id', currentUser.id)
      setProfile({ ...profile, banner_url: urlData.publicUrl })
    }
    setUploadingBanner(false)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const { error } = await supabase
      .from('users')
      .update({ bio: editForm.bio, location: editForm.location })
      .eq('id', currentUser.id)
    setSavingProfile(false)
    if (error) { setEditMsg('❌ ' + error.message); return }
    setProfile({ ...profile, bio: editForm.bio, location: editForm.location })
    setEditMsg('✅ Profil mis à jour !')
    setEditMode(false)
    setTimeout(() => setEditMsg(''), 3000)
  }

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
        <p style={{color:'#6b7c6e', marginBottom:'16px', fontSize:'0.88rem'}}>@{username} n'existe pas sur SokoDeal</p>
        <a href="/" style={{color:'#1a7a4a', fontWeight:600, textDecoration:'none'}}>← Retour à l'accueil</a>
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
        .banner-overlay { opacity: 0; transition: opacity 0.2s; }
        .banner-wrap:hover .banner-overlay { opacity: 1; }
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
              + Déposer
            </button>
          </div>
        </div>
      </header>

      {/* BANNIERE */}
      <div className="banner-wrap" style={{position:'relative', height:'200px', overflow:'hidden'}}>
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Bannière" style={{width:'100%', height:'100%', objectFit:'cover'}} />
        ) : (
          <div style={{width:'100%', height:'100%', background:'linear-gradient(135deg, #0f5233 0%, #1a7a4a 100%)'}} />
        )}

        {/* Overlay modifier bannière si owner */}
        {isOwner && (
          <label className="banner-overlay" style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
            <div style={{background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:'10px', padding:'10px 20px', color:'white', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', backdropFilter:'blur(4px)'}}>
              {uploadingBanner ? '⏳ Upload...' : '🖼️ Changer la bannière'}
            </div>
            <input type="file" accept="image/*" onChange={handleBannerUpload} style={{display:'none'}} disabled={uploadingBanner} />
          </label>
        )}
      </div>

      {/* PROFIL CARD */}
      <div style={{maxWidth:'1100px', margin:'-40px auto 0', padding:'0 5% 40px', position:'relative', zIndex:10}}>

        <div style={{background:'white', borderRadius:'16px', padding:'24px', border:'1px solid #e8ede9', marginBottom:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)'}}>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap'}}>

            {/* AVATAR + INFOS */}
            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
              <div style={{width:'72px', height:'72px', borderRadius:'50%', background:'#1a7a4a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', fontWeight:800, color:'white', fontFamily:'Syne,sans-serif', flexShrink:0, border:'3px solid white', boxShadow:'0 2px 12px rgba(0,0,0,0.12)'}}>
                {(profile.full_name || profile.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px'}}>
                  <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#111a14', margin:0}}>
                    {profile.full_name || '@' + profile.username}
                  </h1>
                  {profile.is_verified && <span style={{background:'#e8f5ee', color:'#1a7a4a', padding:'2px 8px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:700}}>✅ Vérifié</span>}
                </div>
                <p style={{color:'#f5a623', fontSize:'0.85rem', fontWeight:700, margin:'0 0 6px'}}>@{profile.username}</p>
                {profile.bio && (
                  <p style={{color:'#6b7c6e', fontSize:'0.85rem', margin:'0 0 6px', maxWidth:'500px', lineHeight:1.5}}>{profile.bio}</p>
                )}
                <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                  {profile.location && <span style={{fontSize:'0.78rem', color:'#6b7c6e'}}>📍 {profile.location}</span>}
                  <span style={{fontSize:'0.78rem', color:'#6b7c6e'}}>📅 Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', {month:'long', year:'numeric'})}</span>
                  <span style={{fontSize:'0.78rem', color:'#1a7a4a', fontWeight:600}}>📋 {ads.length} annonce(s)</span>
                </div>
              </div>
            </div>

            {/* BOUTONS */}
            <div style={{display:'flex', gap:'8px', flexShrink:0}}>
              {isOwner ? (
                <button onClick={() => setEditMode(!editMode)} style={{padding:'8px 16px', background: editMode ? '#fff1f0' : '#f5f7f5', border:'1px solid ' + (editMode ? '#ffd6d6' : '#e8ede9'), borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.82rem', color: editMode ? '#c0392b' : '#111a14', cursor:'pointer'}}>
                  {editMode ? '✕ Annuler' : '✏️ Modifier le profil'}
                </button>
              ) : (
                <button onClick={() => {
                  if (!currentUser) { window.location.href = '/auth?mode=login'; return }
                  window.location.href = '/messages'
                }} style={{padding:'8px 16px', background:'#1a7a4a', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', color:'white', cursor:'pointer'}}>
                  💬 Contacter
                </button>
              )}
            </div>
          </div>

          {/* EDIT FORM */}
          {editMode && isOwner && (
            <div style={{marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #e8ede9'}}>
              {editMsg && (
                <div style={{background: editMsg.includes('✅') ? '#e8f5ee' : '#fff1f0', color: editMsg.includes('✅') ? '#1a7a4a' : '#c0392b', padding:'10px', borderRadius:'8px', fontSize:'0.82rem', marginBottom:'12px', border:'1px solid ' + (editMsg.includes('✅') ? '#b7dfca' : '#ffd6d6')}}>
                  {editMsg}
                </div>
              )}
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <div>
                  <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase'}}>📝 Bio</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Décrivez-vous en quelques mots... ex: Vendeur de téléphones à Kigali, livraison possible"
                    maxLength={200} rows={3}
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', outline:'none', color:'#111a14', background:'#fafaf9', resize:'none', boxSizing:'border-box'}} />
                  <div style={{fontSize:'0.7rem', color:'#9ca3af', textAlign:'right', marginTop:'3px'}}>{editForm.bio.length}/200</div>
                </div>
                <div>
                  <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase'}}>📍 Localisation</label>
                  <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})}
                    placeholder="Ex: Kigali, Kimironko"
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', outline:'none', color:'#111a14', background:'#fafaf9'}} />
                </div>
                <button onClick={handleSaveProfile} disabled={savingProfile} style={{padding:'11px', background: savingProfile ? '#ccc' : '#1a7a4a', border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'white', cursor: savingProfile ? 'not-allowed' : 'pointer'}}>
                  {savingProfile ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                </button>
              </div>
            </div>
          )}
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
            <p style={{color:'#6b7c6e', fontSize:'0.88rem'}}>Cet utilisateur n'a pas encore d'annonces</p>
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