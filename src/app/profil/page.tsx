'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFavorites } from '@/hooks/useFavorites'
import FavoriteButton from '@/components/FavoriteButton'

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('annonces')
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', location: '', username: '' })
  const [msg, setMsg] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [selectedBoost, setSelectedBoost] = useState<any>(null)
  const [selectedAd, setSelectedAd] = useState<any>(null)
  const [boostMsg, setBoostMsg] = useState('')
  const [boostLoading, setBoostLoading] = useState(false)
  const [favoriteAds, setFavoriteAds] = useState<any[]>([])
  const [favLoading, setFavLoading] = useState(false)

  const { favorites } = useFavorites()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth?mode=login'; return }
      setUser(user)

      // Charger les données depuis la table users
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfileForm({
        full_name: userData?.full_name || user.user_metadata?.full_name || '',
        phone: userData?.phone || user.user_metadata?.phone || '',
        location: user.user_metadata?.location || '',
        username: userData?.username || '',
      })

      const { data } = await supabase.from('ads').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) setAds(data)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (activeTab !== 'favoris' || favorites.length === 0) {
      if (activeTab === 'favoris') setFavoriteAds([])
      return
    }
    const fetchFavAds = async () => {
      setFavLoading(true)
      const { data } = await supabase.from('ads').select('*').in('id', favorites).eq('is_active', true)
      if (data) setFavoriteAds(data)
      setFavLoading(false)
    }
    fetchFavAds()
  }, [activeTab, favorites])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const validateUsername = (value: string) => {
    if (!value) return ''
    if (value.length < 3) return 'Minimum 3 caractères'
    if (value.length > 20) return 'Maximum 20 caractères'
    if (!/^[a-z0-9_]+$/.test(value)) return 'Lettres minuscules, chiffres et _ seulement'
    return ''
  }

  const handleSaveProfile = async () => {
    // Valider username
    const uErr = validateUsername(profileForm.username)
    if (uErr) { setUsernameError(uErr); return }

    // Vérifier unicité username
    if (profileForm.username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', profileForm.username)
        .neq('id', user.id)
        .single()
      if (existing) { setUsernameError('Ce username est déjà pris'); return }
    }

    // Mettre à jour auth metadata
    await supabase.auth.updateUser({ data: { full_name: profileForm.full_name, phone: profileForm.phone, location: profileForm.location } })

    // Mettre à jour table users
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        username: profileForm.username || null,
      })

    if (error) { setMsg('❌ ' + error.message); return }
    setMsg('✅ Profil mis a jour !')
    setEditMode(false)
    setUsernameError('')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    await supabase.from('ads').delete().eq('id', id).eq('user_id', user.id)
    setAds(ads.filter(a => a.id !== id))
  }

  const handleBoost = async () => {
    if (!selectedBoost || !selectedAd) return
    setBoostLoading(true)
    const days = selectedBoost.name.includes('3') ? 3 : selectedBoost.name.includes('7') ? 7 : 30
    const ends = new Date()
    ends.setDate(ends.getDate() + days)
    const { error } = await supabase.from('boosts').insert([{
      ad_id: selectedAd.id, user_id: user.id,
      duration_days: days, price: parseInt(selectedBoost.price.replace(' ', '')),
      ends_at: ends.toISOString(),
    }])
    setBoostLoading(false)
    if (error) { setBoostMsg('❌ ' + error.message); return }
    setBoostMsg('✅ Annonce boostee !')
    setTimeout(() => { setSelectedBoost(null); setSelectedAd(null); setBoostMsg('') }, 2000)
  }

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿','voiture':'🚗',
    'moto':'🛵','electronique':'📱','mode':'👗','maison':'🛋️','emploi':'💼',
    'animaux':'🐄','services':'🏗️','agriculture':'🌾','materiaux':'🧱',
    'sante':'💊','sport':'⚽','education':'📚'
  }

  const boostPlans = [
    { name:'Boost 3 jours', price:'2 000', icon:'⚡', color:'#f59e0b', features:['Top 3 jours','Badge Booste','2x vues'] },
    { name:'Boost 7 jours', price:'4 000', icon:'🔥', color:'#1a7a4a', features:['Top 7 jours','Badge Booste','5x vues'], popular:true },
    { name:'Boost 30 jours', price:'12 000', icon:'💎', color:'#0f5233', features:['Top 30 jours','Badge Premium','10x vues'] },
  ]

  const tabs = [
    { id:'annonces', label:'Mes annonces', count: ads.length },
    { id:'favoris', label:'❤️ Favoris', count: favorites.length },
    { id:'profil', label:'Mon profil', count: null },
    { id:'abonnement', label:'Abonnement', count: null },
    { id:'boosts', label:'Boosts', count: null },
    { id:'stats', label:'Stats', count: null },
    { id:'vendus', label:'Vendus', count: 0 },
  ]

  if (loading) return (
    <div style={{minHeight:'100vh', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>⏳ Chargement...</p>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5'}}>
      <style>{`
        @media (max-width: 768px) {
          .profil-grid { grid-template-columns: 1fr 1fr !important; }
          .ads-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .boost-grid { grid-template-columns: 1fr !important; }
          .fav-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .ads-grid-3 { grid-template-columns: 1fr !important; }
          .fav-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* MODAL BOOST */}
      {selectedBoost && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
          <div style={{background:'white', borderRadius:'16px', padding:'28px', maxWidth:'420px', width:'100%', border:'1px solid #e8ede9', boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'16px', color:'#111a14'}}>
              {selectedBoost.icon} {selectedBoost.name}
            </h2>
            {selectedAd ? (
              <>
                <div style={{background:'#f5f7f5', borderRadius:'10px', padding:'14px', marginBottom:'16px', border:'1px solid #e8ede9'}}>
                  <div style={{fontSize:'0.78rem', color:'#6b7c6e', marginBottom:'4px'}}>Annonce selectionnee</div>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', color:'#111a14'}}>{selectedAd.title}</div>
                </div>
                <div style={{background:'#f5f7f5', borderRadius:'10px', padding:'14px', marginBottom:'16px', border:'1px solid #e8ede9'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                    <span style={{fontSize:'0.82rem', color:'#6b7c6e'}}>Duree</span>
                    <span style={{fontWeight:700, fontSize:'0.85rem', color:'#111a14'}}>{selectedBoost.name}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{fontSize:'0.82rem', color:'#6b7c6e'}}>Prix</span>
                    <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1a7a4a', fontSize:'1rem'}}>{selectedBoost.price} RWF</span>
                  </div>
                </div>
                {boostMsg && <p style={{background: boostMsg.includes('✅') ? '#e8f5ee' : '#fff1f0', color: boostMsg.includes('✅') ? '#1a7a4a' : '#c0392b', padding:'10px', borderRadius:'8px', fontSize:'0.82rem', marginBottom:'12px', border:'1px solid ' + (boostMsg.includes('✅') ? '#b7dfca' : '#ffd6d6')}}>{boostMsg}</p>}
                <button onClick={handleBoost} disabled={boostLoading} style={{width:'100%', padding:'12px', background: boostLoading ? '#ccc' : '#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', cursor: boostLoading ? 'not-allowed' : 'pointer', marginBottom:'10px'}}>
                  {boostLoading ? '⏳ En cours...' : '⚡ Confirmer le boost'}
                </button>
              </>
            ) : (
              <>
                <p style={{color:'#6b7c6e', fontSize:'0.85rem', marginBottom:'12px'}}>Choisissez l annonce a booster :</p>
                <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px', maxHeight:'220px', overflowY:'auto'}}>
                  {ads.length === 0 ? (
                    <p style={{color:'#6b7c6e', fontSize:'0.82rem'}}>Aucune annonce disponible.</p>
                  ) : ads.map((ad: any) => (
                    <div key={ad.id} onClick={() => setSelectedAd(ad)} style={{display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'#f5f7f5', borderRadius:'9px', cursor:'pointer', border: selectedAd?.id === ad.id ? '1.5px solid #1a7a4a' : '1px solid #e8ede9'}}>
                      <span style={{fontSize:'1.2rem'}}>{catEmoji[ad.category] || '📦'}</span>
                      <div>
                        <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'#111a14'}}>{ad.title}</div>
                        <div style={{fontSize:'0.72rem', color:'#6b7c6e'}}>{Number(ad.price).toLocaleString()} RWF</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => { setSelectedBoost(null); setSelectedAd(null); setBoostMsg('') }} style={{width:'100%', padding:'10px', background:'transparent', border:'1px solid #e8ede9', borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.88rem', color:'#6b7c6e', cursor:'pointer'}}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{background:'white', borderBottom:'1px solid #e8ede9', position:'sticky', top:0, zIndex:100}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'58px', maxWidth:'1100px', margin:'0 auto'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
            <div style={{width:'32px', height:'32px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
          </a>
          <div style={{display:'flex', gap:'8px'}}>
            <button onClick={() => window.location.href='/publier'} style={{padding:'7px 16px', background:'#f5a623', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', color:'#111a14', cursor:'pointer'}}>
              + Publier
            </button>
            <button onClick={handleLogout} style={{padding:'7px 16px', background:'transparent', border:'1px solid #e8ede9', borderRadius:'8px', color:'#6b7c6e', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', cursor:'pointer'}}>
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <div style={{background:'linear-gradient(135deg, #0f5233 0%, #1a7a4a 100%)', padding:'28px 5% 50px'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', display:'flex', alignItems:'center', gap:'16px'}}>
          <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:800, color:'#111a14', fontFamily:'Syne,sans-serif', flexShrink:0}}>
            {(profileForm.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'white', marginBottom:'3px'}}>
              {profileForm.full_name || 'Mon Profil'}
            </h1>
            {profileForm.username && (
              <p style={{color:'#f5a623', fontSize:'0.82rem', fontWeight:700, marginBottom:'4px'}}>@{profileForm.username}</p>
            )}
            <p style={{color:'rgba(255,255,255,0.65)', fontSize:'0.82rem', marginBottom:'8px'}}>{user?.email}</p>
            <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
              <span style={{background:'rgba(255,255,255,0.12)', color:'white', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600}}>Membre SokoDeal</span>
              <span style={{background:'rgba(245,166,35,0.25)', color:'#f5a623', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600}}>{ads.length} annonce(s)</span>
              {favorites.length > 0 && (
                <span style={{background:'rgba(239,68,68,0.2)', color:'#fca5a5', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600}}>❤️ {favorites.length} favori(s)</span>
              )}
              {profileForm.username && (
                <a href={'/u/' + profileForm.username} style={{background:'rgba(255,255,255,0.15)', color:'white', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:600, textDecoration:'none'}}>
                  Voir mon profil public →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'1100px', margin:'-22px auto 0', padding:'0 5% 40px'}}>

        {/* STATS */}
        <div className="profil-grid" style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'20px'}}>
          {[
            { label:'Annonces', value: ads.length, icon:'📋', color:'#1a7a4a' },
            { label:'Favoris', value: favorites.length, icon:'❤️', color:'#ef4444' },
            { label:'Messages', value:'—', icon:'💬', color:'#6b7c6e' },
            { label:'Vendus', value:'0', icon:'✅', color:'#f59e0b' },
          ].map((s, i) => (
            <div key={i} onClick={() => s.label === 'Favoris' ? setActiveTab('favoris') : null}
              style={{background:'white', borderRadius:'12px', padding:'14px', border:'1px solid #e8ede9', textAlign:'center', cursor: s.label === 'Favoris' ? 'pointer' : 'default'}}>
              <div style={{fontSize:'1.4rem', marginBottom:'4px'}}>{s.icon}</div>
              <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:s.color}}>{s.value}</div>
              <div style={{fontSize:'0.7rem', color:'#6b7c6e', marginTop:'2px'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:'flex', gap:'6px', marginBottom:'16px', overflowX:'auto', paddingBottom:'4px', scrollbarWidth:'none'}}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding:'8px 16px', border: activeTab === tab.id ? 'none' : '1px solid #e8ede9',
              borderRadius:'9px', cursor:'pointer', fontFamily:'DM Sans,sans-serif',
              fontWeight:600, fontSize:'0.82rem', whiteSpace:'nowrap',
              background: activeTab === tab.id ? (tab.id === 'favoris' ? '#ef4444' : '#1a7a4a') : 'white',
              color: activeTab === tab.id ? 'white' : '#6b7c6e',
            }}>
              {tab.label}
              {tab.count !== null && (
                <span style={{marginLeft:'5px', background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#f5f7f5', color: activeTab === tab.id ? 'white' : '#6b7c6e', borderRadius:'8px', padding:'1px 6px', fontSize:'0.72rem'}}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: ANNONCES */}
        {activeTab === 'annonces' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#111a14'}}>Mes annonces</h2>
              <button onClick={() => window.location.href='/publier'} style={{padding:'8px 16px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', cursor:'pointer'}}>
                + Nouvelle
              </button>
            </div>
            {ads.length === 0 ? (
              <div style={{background:'white', borderRadius:'14px', padding:'48px', textAlign:'center', border:'1px solid #e8ede9'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>📭</div>
                <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px', color:'#111a14'}}>Aucune annonce</h3>
                <p style={{color:'#6b7c6e', marginBottom:'20px', fontSize:'0.88rem'}}>Publiez votre premiere annonce gratuitement</p>
                <button onClick={() => window.location.href='/publier'} style={{padding:'10px 24px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, cursor:'pointer'}}>
                  + Publier
                </button>
              </div>
            ) : (
              <div className="ads-grid-3" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
                {ads.map((ad: any) => (
                  <div key={ad.id} style={{background:'white', borderRadius:'12px', overflow:'hidden', border:'1px solid #e8ede9'}}>
                    <div style={{height:'120px', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', position:'relative', overflow:'hidden'}}>
                      {ad.images && ad.images.length > 0 ? (
                        <img src={ad.images[0]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                      ) : (
                        <span style={{opacity:0.5}}>{catEmoji[ad.category] || '📦'}</span>
                      )}
                      <span style={{position:'absolute', top:'6px', left:'6px', background:'#1a7a4a', color:'white', fontSize:'0.62rem', fontWeight:700, padding:'2px 7px', borderRadius:'5px'}}>Active</span>
                    </div>
                    <div style={{padding:'10px'}}>
                      <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#111a14'}}>{ad.title}</div>
                      <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1a7a4a', fontSize:'0.9rem', marginBottom:'8px'}}>{Number(ad.price).toLocaleString()} RWF</div>
                      <div style={{display:'flex', gap:'5px'}}>
                        <button onClick={() => window.location.href='/annonce/' + ad.id} style={{flex:1, padding:'6px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'6px', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', cursor:'pointer'}}>
                          👁️ Voir
                        </button>
                        <button onClick={() => handleDeleteAd(ad.id)} style={{flex:1, padding:'6px', background:'#fff1f0', border:'1px solid #ffd6d6', borderRadius:'6px', fontSize:'0.72rem', fontWeight:600, color:'#c0392b', cursor:'pointer'}}>
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: FAVORIS */}
        {activeTab === 'favoris' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#111a14'}}>❤️ Mes favoris</h2>
              <span style={{fontSize:'0.82rem', color:'#6b7c6e'}}>{favorites.length} annonce(s)</span>
            </div>
            {favLoading ? (
              <div style={{textAlign:'center', padding:'60px', color:'#6b7c6e'}}>⏳ Chargement...</div>
            ) : favoriteAds.length === 0 ? (
              <div style={{background:'white', borderRadius:'14px', padding:'48px', textAlign:'center', border:'1px solid #e8ede9'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>🤍</div>
                <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px', color:'#111a14'}}>Aucun favori</h3>
                <p style={{color:'#6b7c6e', marginBottom:'20px', fontSize:'0.88rem'}}>Cliquez sur le cœur d une annonce pour la sauvegarder</p>
                <button onClick={() => window.location.href='/'} style={{padding:'10px 24px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, cursor:'pointer'}}>
                  Parcourir les annonces
                </button>
              </div>
            ) : (
              <div className="fav-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
                {favoriteAds.map((ad: any) => (
                  <div key={ad.id} style={{background:'white', borderRadius:'12px', overflow:'hidden', border:'1px solid #e8ede9', cursor:'pointer'}} onClick={() => window.location.href='/annonce/' + ad.id}>
                    <div style={{height:'140px', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', position:'relative', overflow:'hidden'}}>
                      {ad.images && ad.images.length > 0 ? (
                        <img src={ad.images[0]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                      ) : (
                        <span style={{opacity:0.5}}>{catEmoji[ad.category] || '📦'}</span>
                      )}
                      <div style={{position:'absolute', top:'8px', right:'8px'}} onClick={e => e.stopPropagation()}>
                        <FavoriteButton adId={ad.id} size="sm" onLogin={() => {}} />
                      </div>
                    </div>
                    <div style={{padding:'10px'}}>
                      <div style={{fontSize:'0.65rem', fontWeight:600, color:'#1a7a4a', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'3px'}}>{ad.category}</div>
                      <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#111a14'}}>{ad.title}</div>
                      <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, color:'#0f5233', fontSize:'0.95rem', marginBottom:'4px'}}>{Number(ad.price).toLocaleString()} RWF</div>
                      {ad.province && <div style={{fontSize:'0.7rem', color:'#6b7c6e'}}>📍 {ad.province}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PROFIL */}
        {activeTab === 'profil' && (
          <div style={{background:'white', borderRadius:'14px', padding:'24px', border:'1px solid #e8ede9'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#111a14'}}>Informations personnelles</h2>
              <button onClick={() => setEditMode(!editMode)} style={{padding:'7px 16px', background: editMode ? '#fff1f0' : '#f5f7f5', color: editMode ? '#c0392b' : '#111a14', border:'1px solid ' + (editMode ? '#ffd6d6' : '#e8ede9'), borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.82rem', cursor:'pointer'}}>
                {editMode ? 'Annuler' : '✏️ Modifier'}
              </button>
            </div>
            {msg && <p style={{background: msg.includes('✅') ? '#e8f5ee' : '#fff1f0', color: msg.includes('✅') ? '#1a7a4a' : '#c0392b', padding:'10px', borderRadius:'8px', fontSize:'0.82rem', marginBottom:'14px', border:'1px solid ' + (msg.includes('✅') ? '#b7dfca' : '#ffd6d6')}}>{msg}</p>}

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
              {/* USERNAME */}
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>
                  🔖 Username <span style={{color:'#1a7a4a', fontWeight:700, textTransform:'none', fontSize:'0.7rem'}}>(votre @profil public)</span>
                </label>
                {editMode ? (
                  <div>
                    <div style={{display:'flex', alignItems:'center', border:'1px solid ' + (usernameError ? '#ffd6d6' : '#e8ede9'), borderRadius:'8px', overflow:'hidden', background:'#fafaf9'}}>
                      <span style={{padding:'10px 12px', color:'#6b7c6e', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', background:'#f5f7f5', borderRight:'1px solid #e8ede9'}}>@</span>
                      <input type="text" value={profileForm.username} placeholder="monusername"
                        onChange={e => { setProfileForm({...profileForm, username: e.target.value.toLowerCase()}); setUsernameError(validateUsername(e.target.value)) }}
                        style={{flex:1, padding:'10px 12px', border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', background:'transparent', color:'#111a14'}}
                      />
                    </div>
                    {usernameError && <p style={{color:'#c0392b', fontSize:'0.72rem', marginTop:'4px'}}>{usernameError}</p>}
                    <p style={{color:'#9ca3af', fontSize:'0.7rem', marginTop:'4px'}}>Lettres minuscules, chiffres et _ · 3-20 caractères · Votre lien : sokodeal.app/u/{profileForm.username || 'username'}</p>
                  </div>
                ) : (
                  <div style={{padding:'10px 12px', background:'#f5f7f5', borderRadius:'8px', fontSize:'0.88rem', color: profileForm.username ? '#111a14' : '#aaa', border:'1px solid #e8ede9', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span>{profileForm.username ? '@' + profileForm.username : 'Pas encore de username'}</span>
                    {profileForm.username && (
                      <a href={'/u/' + profileForm.username} style={{fontSize:'0.72rem', color:'#1a7a4a', fontWeight:600, textDecoration:'none'}}>Voir →</a>
                    )}
                  </div>
                )}
              </div>

              {[
                { label:'Nom complet', key:'full_name', placeholder:'Votre nom', icon:'👤' },
                { label:'Telephone', key:'phone', placeholder:'+250 780 000 000', icon:'📞' },
                { label:'Localisation', key:'location', placeholder:'Kigali, Rwanda', icon:'📍' },
              ].map(field => (
                <div key={field.key} style={{gridColumn: field.key === 'full_name' ? 'span 2' : 'span 1'}}>
                  <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>
                    {field.icon} {field.label}
                  </label>
                  {editMode ? (
                    <input type="text" value={(profileForm as any)[field.key]} placeholder={field.placeholder}
                      onChange={e => setProfileForm({...profileForm, [field.key]: e.target.value})}
                      style={{width:'100%', padding:'10px 12px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', outline:'none', background:'#fafaf9', color:'#111a14'}}
                    />
                  ) : (
                    <div style={{padding:'10px 12px', background:'#f5f7f5', borderRadius:'8px', fontSize:'0.88rem', color:(profileForm as any)[field.key] ? '#111a14' : '#aaa', border:'1px solid #e8ede9'}}>
                      {(profileForm as any)[field.key] || field.placeholder}
                    </div>
                  )}
                </div>
              ))}

              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>📧 Email</label>
                <div style={{padding:'10px 12px', background:'#f5f7f5', borderRadius:'8px', fontSize:'0.88rem', color:'#6b7c6e', border:'1px solid #e8ede9', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>{user?.email}</span>
                  <span style={{fontSize:'0.72rem', color:'#1a7a4a', fontWeight:600}}>Verifie ✅</span>
                </div>
              </div>
            </div>

            {editMode && (
              <button onClick={handleSaveProfile} style={{marginTop:'16px', width:'100%', padding:'12px', background:'#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', cursor:'pointer'}}>
                Sauvegarder
              </button>
            )}
            <div style={{marginTop:'24px', paddingTop:'20px', borderTop:'1px solid #e8ede9'}}>
              <button onClick={handleLogout} style={{padding:'9px 20px', background:'#fff1f0', border:'1px solid #ffd6d6', borderRadius:'8px', color:'#c0392b', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.82rem', cursor:'pointer'}}>
                🚪 Se deconnecter
              </button>
            </div>
          </div>
        )}

        {/* TAB: ABONNEMENT */}
        {activeTab === 'abonnement' && (
          <div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'16px', color:'#111a14'}}>Choisir un abonnement</h2>
            <div className="plans-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
              {[
                { name:'Gratuit', price:'0', period:'Pour toujours', color:'#6b7c6e', features:['3 annonces max','Photos limitees','Support standard'], current:true },
                { name:'Pro', price:'15 000', period:'par mois', color:'#1a7a4a', features:['Annonces illimitees','5 photos par annonce','Badge Pro','1 boost par mois','Support prioritaire'], popular:true },
                { name:'Agence', price:'50 000', period:'par mois', color:'#0f5233', features:['Tout du Pro','Page agence dediee','5 boosts par mois','Dashboard avance','Support dedie'] },
              ].map((plan, i) => (
                <div key={i} style={{background:'white', borderRadius:'14px', padding:'20px', border: plan.popular ? '1.5px solid #1a7a4a' : '1px solid #e8ede9', position:'relative'}}>
                  {plan.popular && <div style={{position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', background:'#1a7a4a', color:'white', padding:'3px 12px', borderRadius:'20px', fontSize:'0.68rem', fontWeight:700, whiteSpace:'nowrap'}}>Le plus populaire</div>}
                  <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:plan.color, marginBottom:'6px'}}>{plan.name}</h3>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', marginBottom:'3px', color:'#111a14'}}>{plan.price} <span style={{fontSize:'0.78rem', fontWeight:600, color:'#6b7c6e'}}>RWF</span></div>
                  <div style={{fontSize:'0.75rem', color:'#6b7c6e', marginBottom:'16px'}}>{plan.period}</div>
                  <div style={{marginBottom:'16px'}}>{plan.features.map((f, j) => <div key={j} style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px', fontSize:'0.8rem', color:'#111a14'}}><span style={{color:'#1a7a4a', fontWeight:700}}>✓</span> {f}</div>)}</div>
                  <button style={{width:'100%', padding:'10px', background: (plan as any).current ? '#f5f7f5' : plan.color, color: (plan as any).current ? '#6b7c6e' : 'white', border: (plan as any).current ? '1px solid #e8ede9' : 'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor: (plan as any).current ? 'default' : 'pointer'}}>
                    {(plan as any).current ? 'Plan actuel' : 'Choisir'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: BOOSTS */}
        {activeTab === 'boosts' && (
          <div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'6px', color:'#111a14'}}>Booster une annonce</h2>
            <p style={{color:'#6b7c6e', fontSize:'0.85rem', marginBottom:'16px'}}>Un boost met votre annonce en tete de liste.</p>
            <div className="boost-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px'}}>
              {boostPlans.map((boost, i) => (
                <div key={i} style={{background:'white', borderRadius:'14px', padding:'20px', border: boost.popular ? '1.5px solid #1a7a4a' : '1px solid #e8ede9', position:'relative', textAlign:'center'}}>
                  {boost.popular && <div style={{position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', background:'#1a7a4a', color:'white', padding:'3px 12px', borderRadius:'20px', fontSize:'0.68rem', fontWeight:700, whiteSpace:'nowrap'}}>Le plus vendu</div>}
                  <div style={{fontSize:'2rem', marginBottom:'6px'}}>{boost.icon}</div>
                  <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.9rem', color:boost.color, marginBottom:'4px'}}>{boost.name}</h3>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', marginBottom:'10px', color:'#111a14'}}>{boost.price} <span style={{fontSize:'0.75rem', fontWeight:600, color:'#6b7c6e'}}>RWF</span></div>
                  <div style={{marginBottom:'14px'}}>{boost.features.map((f, j) => <div key={j} style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', fontSize:'0.75rem', textAlign:'left', color:'#111a14'}}><span style={{color:boost.color, fontWeight:700}}>✓</span> {f}</div>)}</div>
                  <button onClick={() => { setSelectedBoost(boost); setSelectedAd(null) }} style={{width:'100%', padding:'10px', background:boost.color, color:'white', border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', cursor:'pointer'}}>Booster</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: STATS */}
        {activeTab === 'stats' && (
          <div style={{background:'white', borderRadius:'14px', padding:'40px', border:'1px solid #e8ede9', textAlign:'center'}}>
            <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>📊</div>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'8px', color:'#111a14'}}>Statistiques avancees</h3>
            <p style={{color:'#6b7c6e', marginBottom:'20px', fontSize:'0.88rem'}}>Disponible avec l abonnement Pro</p>
            <button onClick={() => setActiveTab('abonnement')} style={{padding:'10px 24px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, cursor:'pointer'}}>Passer au Pro</button>
          </div>
        )}

        {/* TAB: VENDUS */}
        {activeTab === 'vendus' && (
          <div style={{background:'white', borderRadius:'14px', padding:'40px', border:'1px solid #e8ede9', textAlign:'center'}}>
            <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>✅</div>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'8px', color:'#111a14'}}>Aucune vente</h3>
            <p style={{color:'#6b7c6e', fontSize:'0.88rem'}}>Vos articles vendus apparaitront ici</p>
          </div>
        )}

      </div>
    </div>
  )
}
