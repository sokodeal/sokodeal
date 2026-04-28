'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('annonces')
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', location: '' })
  const [msg, setMsg] = useState('')
  const [selectedBoost, setSelectedBoost] = useState<any>(null)
  const [selectedAd, setSelectedAd] = useState<any>(null)
  const [boostMsg, setBoostMsg] = useState('')
  const [boostLoading, setBoostLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth?mode=login'; return }
      setUser(user)
      setProfileForm({
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || ''
      })
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setAds(data)
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleSaveProfile = async () => {
    const { error } = await supabase.auth.updateUser({ data: profileForm })
    if (error) { setMsg('❌ ' + error.message); return }
    setMsg('✅ Profil mis a jour !')
    setEditMode(false)
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
      ad_id: selectedAd.id,
      user_id: user.id,
      duration_days: days,
      price: parseInt(selectedBoost.price.replace(' ', '')),
      ends_at: ends.toISOString(),
    }])
    setBoostLoading(false)
    if (error) { setBoostMsg('❌ ' + error.message); return }
    setBoostMsg('✅ Annonce boostee avec succes !')
    setTimeout(() => {
      setSelectedBoost(null)
      setSelectedAd(null)
      setBoostMsg('')
    }, 2000)
  }

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿',
    'voiture':'🚗','moto':'🛵','electronique':'📱',
    'mode':'👗','maison':'🛋️','emploi':'💼','animaux':'🐄','services':'🏗️'
  }

  const boostPlans = [
    { name:'Boost 3 jours', price:'2 000', icon:'⚡', color:'#e67e22', features:['Top des resultats 3 jours','Badge Booste','2x plus de vues'] },
    { name:'Boost 7 jours', price:'4 000', icon:'🔥', color:'#1a7a4a', features:['Top des resultats 7 jours','Badge Booste','5x plus de vues'], popular:true },
    { name:'Boost 30 jours', price:'12 000', icon:'💎', color:'#1a3a5c', features:['Top des resultats 30 jours','Badge Premium','10x plus de vues'] },
  ]

  const tabs = [
    { id: 'annonces', label: '📋 Mes annonces', count: ads.length },
    { id: 'profil', label: '👤 Mon profil', count: null },
    { id: 'abonnement', label: '⭐ Abonnement', count: null },
    { id: 'boosts', label: '🚀 Boosts', count: null },
    { id: 'stats', label: '📊 Statistiques', count: null },
    { id: 'vendus', label: '✅ Vendus', count: 0 },
  ]

  if (loading) return (
    <div style={{minHeight:'100vh', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem', marginBottom:'12px'}}>⏳</div>
        <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>Chargement...</p>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f0f4f1'}}>

      {/* MODAL BOOST */}
      {selectedBoost && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
          <div style={{background:'white', borderRadius:'20px', padding:'32px', maxWidth:'440px', width:'100%'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px'}}>
              {selectedBoost.icon} {selectedBoost.name}
            </h2>
            {selectedAd ? (
              <>
                <p style={{color:'#6b7c6e', fontSize:'0.88rem', marginBottom:'16px'}}>
                  Annonce : <strong>{selectedAd.title}</strong>
                </p>
                <div style={{background:'#f0f4f1', borderRadius:'12px', padding:'16px', marginBottom:'20px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                    <span style={{fontSize:'0.85rem', color:'#6b7c6e'}}>Duree</span>
                    <span style={{fontWeight:700}}>{selectedBoost.name}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{fontSize:'0.85rem', color:'#6b7c6e'}}>Prix</span>
                    <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1a7a4a', fontSize:'1.1rem'}}>{selectedBoost.price} RWF</span>
                  </div>
                </div>
                {boostMsg && (
                  <p style={{background: boostMsg.includes('✅') ? '#e8f5ee' : '#fce4ec', color: boostMsg.includes('✅') ? '#1a7a4a' : 'red', padding:'10px', borderRadius:'8px', fontSize:'0.85rem', marginBottom:'12px'}}>{boostMsg}</p>
                )}
                <button onClick={handleBoost} disabled={boostLoading} style={{width:'100%', padding:'13px', background: boostLoading ? '#ccc' : '#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white', cursor: boostLoading ? 'not-allowed' : 'pointer', marginBottom:'10px'}}>
                  {boostLoading ? '⏳ En cours...' : '⚡ Confirmer le boost'}
                </button>
              </>
            ) : (
              <>
                <p style={{color:'#6b7c6e', fontSize:'0.88rem', marginBottom:'16px'}}>Choisissez l annonce a booster :</p>
                <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px', maxHeight:'250px', overflowY:'auto'}}>
                  {ads.length === 0 ? (
                    <p style={{color:'#6b7c6e', fontSize:'0.85rem'}}>Aucune annonce disponible.</p>
                  ) : (
                    ads.map((ad: any) => (
                      <div key={ad.id} onClick={() => setSelectedAd(ad)} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'#f5f7f5', borderRadius:'10px', cursor:'pointer', border: selectedAd?.id === ad.id ? '2px solid #1a7a4a' : '2px solid transparent'}}>
                        <span style={{fontSize:'1.5rem'}}>{catEmoji[ad.category] || '📦'}</span>
                        <div>
                          <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem'}}>{ad.title}</div>
                          <div style={{fontSize:'0.75rem', color:'#6b7c6e'}}>{Number(ad.price).toLocaleString()} RWF</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
            <button onClick={() => { setSelectedBoost(null); setSelectedAd(null); setBoostMsg('') }} style={{width:'100%', padding:'11px', background:'#f0f4f1', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', color:'#6b7c6e', cursor:'pointer'}}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <header style={{background:'#0f5233', boxShadow:'0 2px 16px rgba(0,0,0,0.18)', position:'sticky', top:0, zIndex:100}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'64px'}}>
          <a href="/" style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'white', textDecoration:'none'}}>
            🦁 Soko<span style={{color:'#f5a623'}}>Deal</span>
          </a>
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
            <button onClick={() => window.location.href='/publier'} style={{padding:'8px 18px', background:'#f5a623', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'#111a14', cursor:'pointer'}}>
              + Publier
            </button>
            <button onClick={handleLogout} style={{padding:'8px 18px', background:'transparent', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:'8px', color:'white', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      <div style={{background:'linear-gradient(135deg,#0f5233,#1a7a4a)', padding:'36px 5% 60px'}}>
        <div style={{maxWidth:'1100px', margin:'0 auto', display:'flex', alignItems:'center', gap:'24px'}}>
          <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:800, color:'#111a14', fontFamily:'Syne,sans-serif', flexShrink:0, border:'4px solid rgba(255,255,255,0.3)'}}>
            {(profileForm.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.6rem', color:'white', marginBottom:'4px'}}>
              {profileForm.full_name || 'Mon Profil'}
            </h1>
            <p style={{color:'rgba(255,255,255,0.7)', fontSize:'0.9rem', marginBottom:'8px'}}>{user?.email}</p>
            <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
              <span style={{background:'rgba(255,255,255,0.15)', color:'white', padding:'4px 12px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600}}>
                🏆 Membre SokoDeal
              </span>
              <span style={{background:'rgba(245,166,35,0.3)', color:'#f5a623', padding:'4px 12px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600}}>
                📋 {ads.length} annonce(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'1100px', margin:'-30px auto 0', padding:'0 5% 40px'}}>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px'}}>
          {[
            { label:'Mes annonces', value: ads.length, icon:'📋', color:'#1a7a4a' },
            { label:'Vues totales', value:'—', icon:'👁', color:'#1a3a5c' },
            { label:'Messages recus', value:'—', icon:'💬', color:'#7b3fa0' },
            { label:'Vendus', value:'0', icon:'✅', color:'#e67e22' },
          ].map((s, i) => (
            <div key={i} style={{background:'white', borderRadius:'14px', padding:'18px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', textAlign:'center'}}>
              <div style={{fontSize:'1.8rem', marginBottom:'6px'}}>{s.icon}</div>
              <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:s.color}}>{s.value}</div>
              <div style={{fontSize:'0.75rem', color:'#6b7c6e', marginTop:'2px'}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex', gap:'8px', marginBottom:'20px', overflowX:'auto', paddingBottom:'4px'}}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding:'10px 18px', border:'none', borderRadius:'10px', cursor:'pointer',
              fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', whiteSpace:'nowrap',
              background: activeTab === tab.id ? '#1a7a4a' : 'white',
              color: activeTab === tab.id ? 'white' : '#6b7c6e',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(26,122,74,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
              transition:'all 0.2s'
            }}>
              {tab.label}
              {tab.count !== null && (
                <span style={{marginLeft:'6px', background: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : '#e8ede9', color: activeTab === tab.id ? 'white' : '#1a7a4a', borderRadius:'10px', padding:'1px 7px', fontSize:'0.75rem'}}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: MES ANNONCES */}
        {activeTab === 'annonces' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem'}}>Mes annonces</h2>
              <button onClick={() => window.location.href='/publier'} style={{padding:'9px 20px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer'}}>
                + Nouvelle annonce
              </button>
            </div>
            {ads.length === 0 ? (
              <div style={{background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
                <div style={{fontSize:'3rem', marginBottom:'12px'}}>📭</div>
                <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px'}}>Aucune annonce pour l instant</h3>
                <p style={{color:'#6b7c6e', marginBottom:'20px', fontSize:'0.9rem'}}>Publiez votre premiere annonce gratuitement</p>
                <button onClick={() => window.location.href='/publier'} style={{padding:'12px 28px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, cursor:'pointer'}}>
                  + Publier une annonce
                </button>
              </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px'}}>
                {ads.map((ad: any) => (
                  <div key={ad.id} style={{background:'white', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
                    <div style={{height:'140px', background:'#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', position:'relative', overflow:'hidden'}}>
                      {ad.images && ad.images.length > 0 ? (
                        <img src={ad.images[0]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                      ) : (
                        <span>{catEmoji[ad.category] || '📦'}</span>
                      )}
                      <span style={{position:'absolute', top:'8px', left:'8px', background:'#1a7a4a', color:'white', fontSize:'0.7rem', fontWeight:700, padding:'3px 8px', borderRadius:'6px'}}>
                        ✅ Active
                      </span>
                    </div>
                    <div style={{padding:'12px'}}>
                      <div style={{fontSize:'0.7rem', color:'#1a7a4a', fontWeight:600, textTransform:'uppercase', marginBottom:'3px'}}>{ad.category}</div>
                      <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', marginBottom:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ad.title}</div>
                      <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1a7a4a', fontSize:'1rem', marginBottom:'10px'}}>{Number(ad.price).toLocaleString()} RWF</div>
                      <div style={{display:'flex', gap:'6px'}}>
                        <button onClick={() => window.location.href='/publier'} style={{flex:1, padding:'7px', background:'#f0f4f1', border:'none', borderRadius:'7px', fontSize:'0.78rem', fontWeight:600, color:'#1a7a4a', cursor:'pointer'}}>
                          ✏️ Modifier
                        </button>
                        <button onClick={() => handleDeleteAd(ad.id)} style={{flex:1, padding:'7px', background:'#fce4ec', border:'none', borderRadius:'7px', fontSize:'0.78rem', fontWeight:600, color:'#c0392b', cursor:'pointer'}}>
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

        {/* TAB: MON PROFIL */}
        {activeTab === 'profil' && (
          <div style={{background:'white', borderRadius:'16px', padding:'28px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem'}}>Informations personnelles</h2>
              <button onClick={() => setEditMode(!editMode)} style={{padding:'8px 18px', background: editMode ? '#fce4ec' : '#1a7a4a', color: editMode ? '#c0392b' : 'white', border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer'}}>
                {editMode ? 'Annuler' : '✏️ Modifier'}
              </button>
            </div>
            {msg && <p style={{background: msg.includes('✅') ? '#e8f5ee' : '#fce4ec', color: msg.includes('✅') ? '#1a7a4a' : 'red', padding:'10px 14px', borderRadius:'8px', fontSize:'0.85rem', marginBottom:'16px'}}>{msg}</p>}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
              {[
                { label:'Nom complet', key:'full_name', placeholder:'Votre nom', icon:'👤' },
                { label:'Telephone', key:'phone', placeholder:'+250 780 000 000', icon:'📞' },
                { label:'Localisation', key:'location', placeholder:'Kigali, Rwanda', icon:'📍' },
              ].map(field => (
                <div key={field.key} style={{gridColumn: field.key === 'full_name' ? 'span 2' : 'span 1'}}>
                  <label style={{display:'block', fontSize:'0.82rem', fontWeight:600, color:'#6b7c6e', marginBottom:'6px'}}>
                    {field.icon} {field.label}
                  </label>
                  {editMode ? (
                    <input type="text" value={(profileForm as any)[field.key]} placeholder={field.placeholder}
                      onChange={e => setProfileForm({...profileForm, [field.key]: e.target.value})}
                      style={{width:'100%', padding:'11px 14px', border:'1.5px solid #1a7a4a', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem', outline:'none', background:'#faf7f2'}}
                    />
                  ) : (
                    <div style={{padding:'11px 14px', background:'#f5f7f5', borderRadius:'9px', fontSize:'0.92rem', color:(profileForm as any)[field.key] ? '#111a14' : '#aaa'}}>
                      {(profileForm as any)[field.key] || field.placeholder}
                    </div>
                  )}
                </div>
              ))}
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block', fontSize:'0.82rem', fontWeight:600, color:'#6b7c6e', marginBottom:'6px'}}>📧 Email</label>
                <div style={{padding:'11px 14px', background:'#f0f0f0', borderRadius:'9px', fontSize:'0.92rem', color:'#6b7c6e'}}>
                  {user?.email} <span style={{fontSize:'0.75rem', color:'#1a7a4a', fontWeight:600}}>Verifie ✅</span>
                </div>
              </div>
            </div>
            {editMode && (
              <button onClick={handleSaveProfile} style={{marginTop:'20px', width:'100%', padding:'13px', background:'#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white', cursor:'pointer'}}>
                💾 Sauvegarder
              </button>
            )}
            <div style={{marginTop:'28px', paddingTop:'24px', borderTop:'1px solid #e8ede9'}}>
              <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:'16px', color:'#c0392b'}}>Zone dangereuse</h3>
              <button onClick={handleLogout} style={{padding:'10px 24px', background:'#fce4ec', border:'1.5px solid #f1afc0', borderRadius:'9px', color:'#c0392b', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer'}}>
                🚪 Se deconnecter
              </button>
            </div>
          </div>
        )}

        {/* TAB: ABONNEMENT */}
        {activeTab === 'abonnement' && (
          <div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'20px'}}>Choisir un abonnement</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px'}}>
              {[
                { name:'Gratuit', price:'0', period:'Pour toujours', color:'#6b7c6e', features:['3 annonces max','Photos limitees','Support standard'], current:true },
                { name:'Pro', price:'15 000', period:'par mois', color:'#1a7a4a', features:['Annonces illimitees','5 photos par annonce','Badge Pro','1 boost offert/mois','Support prioritaire'], popular:true },
                { name:'Agence', price:'50 000', period:'par mois', color:'#1a3a5c', features:['Tout du Pro','Page agence dediee','5 boosts/mois','Tableau de bord avance','Support dedie'] },
              ].map((plan, i) => (
                <div key={i} style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow: plan.popular ? '0 8px 32px rgba(26,122,74,0.2)' : '0 2px 12px rgba(0,0,0,0.07)', border: plan.popular ? '2px solid #1a7a4a' : '2px solid transparent', position:'relative'}}>
                  {plan.popular && (
                    <div style={{position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#1a7a4a', color:'white', padding:'4px 16px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap'}}>
                      Le plus populaire
                    </div>
                  )}
                  <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:plan.color, marginBottom:'8px'}}>{plan.name}</h3>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', marginBottom:'4px'}}>{plan.price} <span style={{fontSize:'0.85rem', fontWeight:600}}>RWF</span></div>
                  <div style={{fontSize:'0.8rem', color:'#6b7c6e', marginBottom:'20px'}}>{plan.period}</div>
                  <div style={{marginBottom:'20px'}}>
                    {plan.features.map((f, j) => (
                      <div key={j} style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', fontSize:'0.85rem'}}>
                        <span style={{color:'#1a7a4a', fontWeight:700}}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <button style={{width:'100%', padding:'11px', background: plan.current ? '#f0f4f1' : plan.color, color: plan.current ? '#6b7c6e' : 'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', cursor: plan.current ? 'default' : 'pointer'}}>
                    {plan.current ? 'Plan actuel' : 'Choisir ce plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: BOOSTS */}
        {activeTab === 'boosts' && (
          <div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px'}}>🚀 Booster une annonce</h2>
            <p style={{color:'#6b7c6e', fontSize:'0.88rem', marginBottom:'20px'}}>Un boost met votre annonce en tete de liste et lui donne 10x plus de visibilite.</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'28px'}}>
              {boostPlans.map((boost, i) => (
                <div key={i} style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow: boost.popular ? '0 8px 32px rgba(26,122,74,0.2)' : '0 2px 12px rgba(0,0,0,0.07)', border: boost.popular ? '2px solid #1a7a4a' : '2px solid transparent', position:'relative', textAlign:'center'}}>
                  {boost.popular && (
                    <div style={{position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#1a7a4a', color:'white', padding:'4px 16px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap'}}>
                      Le plus vendu
                    </div>
                  )}
                  <div style={{fontSize:'2.5rem', marginBottom:'8px'}}>{boost.icon}</div>
                  <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:boost.color, marginBottom:'6px'}}>{boost.name}</h3>
                  <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', marginBottom:'4px'}}>{boost.price} <span style={{fontSize:'0.85rem', fontWeight:600}}>RWF</span></div>
                  <div style={{marginBottom:'16px', marginTop:'12px'}}>
                    {boost.features.map((f, j) => (
                      <div key={j} style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', fontSize:'0.83rem', textAlign:'left'}}>
                        <span style={{color:boost.color, fontWeight:700}}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setSelectedBoost(boost); setSelectedAd(null) }} style={{width:'100%', padding:'11px', background:boost.color, color:'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', cursor:'pointer'}}>
                    Booster maintenant
                  </button>
                </div>
              ))}
            </div>
            <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
              <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', marginBottom:'16px'}}>📋 Choisir l annonce a booster</h3>
              {ads.length === 0 ? (
                <p style={{color:'#6b7c6e', fontSize:'0.9rem'}}>Vous n avez pas encore d annonce a booster.</p>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                  {ads.map((ad: any) => (
                    <div key={ad.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#f5f7f5', borderRadius:'10px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <span style={{fontSize:'1.5rem'}}>{catEmoji[ad.category] || '📦'}</span>
                        <div>
                          <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem'}}>{ad.title}</div>
                          <div style={{fontSize:'0.78rem', color:'#6b7c6e'}}>{Number(ad.price).toLocaleString()} RWF</div>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedAd(ad); setSelectedBoost(boostPlans[1]) }} style={{padding:'7px 16px', background:'#f5a623', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.8rem', color:'#111a14', cursor:'pointer'}}>
                        ⚡ Booster
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: STATS */}
        {activeTab === 'stats' && (
          <div style={{background:'white', borderRadius:'16px', padding:'28px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', textAlign:'center'}}>
            <div style={{fontSize:'3rem', marginBottom:'12px'}}>📊</div>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px'}}>Statistiques avancees</h3>
            <p style={{color:'#6b7c6e', marginBottom:'20px', fontSize:'0.9rem'}}>Disponible avec l abonnement Pro</p>
            <button onClick={() => setActiveTab('abonnement')} style={{padding:'12px 28px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, cursor:'pointer'}}>
              Passer au Pro
            </button>
          </div>
        )}

        {/* TAB: VENDUS */}
        {activeTab === 'vendus' && (
          <div style={{background:'white', borderRadius:'16px', padding:'48px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', textAlign:'center'}}>
            <div style={{fontSize:'3rem', marginBottom:'12px'}}>✅</div>
            <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px'}}>Aucune vente pour l instant</h3>
            <p style={{color:'#6b7c6e', fontSize:'0.9rem'}}>Vos articles vendus apparaitront ici</p>
          </div>
        )}

      </div>
    </div>
  )
}