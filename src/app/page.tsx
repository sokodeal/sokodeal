'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [activeSection, setActiveSection] = useState('main')
  const [ads, setAds] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterVille, setFilterVille] = useState('')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<any>(null)

  const villes = [
    'Kigali','Butare','Musanze','Ruhengeri','Gisenyi','Cyangugu','Kibuye',
    'Byumba','Rwamagana','Nyamata','Kibungo','Gitarama','Muhanga','Huye',
    'Rubavu','Rusizi','Karongi','Ngoma','Bugesera','Nyagatare','Gatsibo'
  ]

  const categories = [
    { value:'immo-vente', label:'🏡 Immobilier Vente' },
    { value:'immo-location', label:'🏢 Immobilier Location' },
    { value:'immo-terrain', label:'🌿 Terrain' },
    { value:'voiture', label:'🚗 Voitures' },
    { value:'moto', label:'🛵 Motos' },
    { value:'electronique', label:'📱 Electronique' },
    { value:'mode', label:'👗 Mode et Beaute' },
    { value:'maison', label:'🛋️ Maison et Jardin' },
    { value:'emploi', label:'💼 Emploi' },
    { value:'animaux', label:'🐄 Animaux' },
    { value:'services', label:'🏗️ Services' },
    { value:'agriculture', label:'🌾 Agriculture' },
    { value:'materiaux', label:'🧱 Materiaux Construction' },
    { value:'sante', label:'💊 Sante et Beaute' },
    { value:'sport', label:'⚽ Sport et Loisirs' },
    { value:'education', label:'📚 Education' },
  ]

  const catEmoji: any = {
    'immo-vente':'🏡','immo-location':'🏢','immo-terrain':'🌿',
    'voiture':'🚗','moto':'🛵','electronique':'📱','mode':'👗',
    'maison':'🛋️','emploi':'💼','animaux':'🐄','services':'🏗️',
    'agriculture':'🌾','materiaux':'🧱','sante':'💊','sport':'⚽','education':'📚'
  }

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase.from('ads').select('*').eq('is_active', true).order('created_at', { ascending: false })
      if (data) {
        const now = new Date().toISOString()
        const { data: boosts } = await supabase.from('boosts').select('ad_id').eq('is_active', true).gt('ends_at', now)
        const boostedIds = new Set((boosts || []).map((b: any) => b.ad_id))
        const adsWithBoost = data.map(ad => ({ ...ad, is_boosted: boostedIds.has(ad.id) }))
        const sorted = [...adsWithBoost.filter(a => a.is_boosted), ...adsWithBoost.filter(a => !a.is_boosted)]
        setAds(sorted); setFiltered(sorted)
      }
      setLoading(false)
    }
    fetchAds()

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUnread = async (userId: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    if (!user) return
    loadUnread(user.id)
    const channelName = 'notifs-' + user.id.slice(0, 8)
    const ch = supabase.channel(channelName)
    ch.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
      filter: 'receiver_id=eq.' + user.id
    }, () => {
      setUnreadCount(c => c + 1)
      setToast({ text: 'Nouveau message recu !', icon: '💬' })
      setTimeout(() => setToast(null), 4000)
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  useEffect(() => {
    let result = [...ads]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(ad => ad.title?.toLowerCase().includes(q) || ad.description?.toLowerCase().includes(q) || ad.category?.toLowerCase().includes(q))
    }
    if (filterCat) result = result.filter(ad => ad.category === filterCat)
    if (filterVille) result = result.filter(ad => ad.province?.toLowerCase().includes(filterVille.toLowerCase()) || ad.district?.toLowerCase().includes(filterVille.toLowerCase()))
    if (filterPriceMin) result = result.filter(ad => ad.price >= parseInt(filterPriceMin))
    if (filterPriceMax) result = result.filter(ad => ad.price <= parseInt(filterPriceMax))
    if (sortBy === 'recent') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'moins-cher') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'plus-cher') result.sort((a, b) => b.price - a.price)
    setFiltered(result)
  }, [search, filterCat, filterVille, filterPriceMin, filterPriceMax, sortBy, ads])

  const resetFilters = () => {
    setSearch(''); setFilterCat(''); setFilterVille('')
    setFilterPriceMin(''); setFilterPriceMax(''); setSortBy('recent')
  }

  const hasFilters = search || filterCat || filterVille || filterPriceMin || filterPriceMax || sortBy !== 'recent'

  const mockAds = [
    {id:'m1', category:'immo-vente', title:'Villa 4 chambres Kigali Niboye', price:185000000, images:[], province:'Kigali', is_boosted:true},
    {id:'m2', category:'voiture', title:'Toyota RAV4 2019 45 000 km', price:26500000, images:[], province:'Kigali', is_boosted:false},
    {id:'m3', category:'electronique', title:'Samsung Galaxy S24 Ultra Neuf', price:980000, images:[], province:'Musanze', is_boosted:false},
    {id:'m4', category:'immo-location', title:'Appartement 3 pieces meuble', price:450000, images:[], province:'Butare', is_boosted:false},
    {id:'m5', category:'moto', title:'Honda CB125 2022 18 000 km', price:3200000, images:[], province:'Gisenyi', is_boosted:false},
    {id:'m6', category:'animaux', title:'Vache laitiere Ankole 2 ans', price:1800000, images:[], province:'Rwamagana', is_boosted:false},
  ]

  const displayAds = ads.length > 0 ? filtered : mockAds

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .hero-title { font-size: 1.7rem !important; }
          .ads-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .filters-grid { grid-template-columns: 1fr 1fr !important; }
          .btn-signup { display: none !important; }
          .header-inner { padding: 0 4% !important; height: 56px !important; }
          .deposer-btn { padding: 7px 12px !important; font-size: 0.8rem !important; }
          .hero-section { padding: 36px 4% 32px !important; }
          .mon-compte-label { display: none !important; }
        }
        @media (max-width: 480px) {
          .ads-grid { grid-template-columns: 1fr !important; }
          .filters-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 1.4rem !important; }
        }
        .ad-card { transition: transform 0.18s, box-shadow 0.18s; }
        .ad-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.10) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {toast && (
        <div style={{position:'fixed', bottom:'20px', right:'20px', zIndex:9999, background:'#0f5233', color:'white', padding:'12px 18px', borderRadius:'12px', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', display:'flex', alignItems:'center', gap:'10px', fontFamily:'DM Sans,sans-serif', fontSize:'0.88rem', animation:'fadeUp 0.3s ease', maxWidth:'260px'}}>
          <span style={{fontSize:'1.2rem'}}>💬</span>
          <div>
            <div style={{fontWeight:700, marginBottom:'4px'}}>Nouveau message !</div>
            <button onClick={() => window.location.href='/messages'} style={{background:'#f5a623', border:'none', borderRadius:'6px', padding:'3px 10px', fontSize:'0.75rem', fontWeight:700, color:'#111', cursor:'pointer'}}>
              Voir →
            </button>
          </div>
          <button onClick={() => setToast(null)} style={{background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'1rem', padding:'0 4px'}}>×</button>
        </div>
      )}

      <header style={{background:'white', position:'sticky', top:0, zIndex:100, borderBottom:'1px solid #e8ede9'}}>
        <div className="header-inner" style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'62px', gap:'14px', maxWidth:'1300px', margin:'0 auto'}}>

          <a href="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none', flexShrink:0}}>
            <div style={{width:'34px', height:'34px', background:'#f5a623', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.25rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
          </a>

          <div style={{flex:1, maxWidth:'480px', display:'flex', background:'#f5f7f5', borderRadius:'9px', overflow:'hidden', border:'1px solid #e8ede9'}}>
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={e => { setSearch(e.target.value); setActiveSection('main') }}
              style={{flex:1, padding:'9px 14px', border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', background:'transparent', color:'#111a14'}}
            />
            <button style={{background:'#f5a623', border:'none', cursor:'pointer', padding:'9px 16px', fontSize:'1rem', color:'#111a14'}}>🔍</button>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:'8px', flexShrink:0}}>
            {user ? (
              <>
                <button onClick={() => window.location.href='/messages'} style={{position:'relative', width:'38px', height:'38px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'9px', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  💬
                  {unreadCount > 0 && (
                    <div style={{position:'absolute', top:'-4px', right:'-4px', width:'16px', height:'16px', background:'#e74c3c', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.58rem', fontWeight:800, color:'white'}}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </button>
                <button onClick={() => window.location.href='/profil'} style={{display:'flex', alignItems:'center', gap:'7px', padding:'7px 14px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'9px', color:'#111a14', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
                  <div style={{width:'24px', height:'24px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.78rem', color:'#111a14'}}>
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="mon-compte-label">Mon compte</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => window.location.href='/auth?mode=login'} style={{padding:'8px 16px', border:'1px solid #e8ede9', borderRadius:'9px', color:'#111a14', background:'white', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', cursor:'pointer'}}>
                  Connexion
                </button>
                <button className="btn-signup" onClick={() => window.location.href='/auth?mode=signup'} style={{padding:'8px 16px', border:'none', borderRadius:'9px', color:'white', background:'#1a7a4a', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer'}}>
                  S inscrire
                </button>
              </>
            )}
            <button className="deposer-btn" onClick={() => window.location.href='/publier'} style={{padding:'8px 18px', background:'#f5a623', border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'#111a14', cursor:'pointer', whiteSpace:'nowrap'}}>
              + Deposer
            </button>
          </div>
        </div>

        <div style={{borderTop:'1px solid #f0f4f1', padding:'0 5%', display:'flex', overflowX:'auto', scrollbarWidth:'none', maxWidth:'1300px', margin:'0 auto'}}>
          {[
            {cat:'', label:'Tout'},
            {cat:'immo-vente', label:'🏡 Immo'},
            {cat:'voiture', label:'🚗 Autos'},
            {cat:'electronique', label:'📱 Tech'},
            {cat:'mode', label:'👗 Mode'},
            {cat:'agriculture', label:'🌾 Agri'},
            {cat:'materiaux', label:'🧱 BTP'},
            {cat:'sante', label:'💊 Sante'},
            {cat:'sport', label:'⚽ Sport'},
            {cat:'education', label:'📚 Educ'},
            {cat:'animaux', label:'🐄 Animaux'},
            {cat:'services', label:'🏗️ Services'},
          ].map((item, i) => (
            <a key={i} href="#" onClick={() => { setActiveSection('main'); setFilterCat(item.cat) }} style={{
              display:'flex', alignItems:'center', padding:'9px 14px',
              color: filterCat === item.cat ? '#1a7a4a' : '#6b7c6e',
              textDecoration:'none', fontSize:'0.82rem',
              fontWeight: filterCat === item.cat ? 700 : 400,
              whiteSpace:'nowrap',
              borderBottom: filterCat === item.cat ? '2px solid #f5a623' : '2px solid transparent',
              transition:'all 0.15s'
            }}>{item.label}</a>
          ))}
          <a href="#" onClick={() => setActiveSection('jobs')} style={{
            display:'flex', alignItems:'center', padding:'9px 14px',
            color: activeSection === 'jobs' ? '#1a7a4a' : '#6b7c6e',
            textDecoration:'none', fontSize:'0.82rem', fontWeight: activeSection === 'jobs' ? 700 : 400,
            whiteSpace:'nowrap',
            borderBottom: activeSection === 'jobs' ? '2px solid #f5a623' : '2px solid transparent'
          }}>💼 Jobs</a>
        </div>
      </header>

      {activeSection === 'main' && !search && !filterCat && (
        <div className="hero-section" style={{background:'linear-gradient(135deg, #0f5233 0%, #1a7a4a 100%)', padding:'52px 5% 44px'}}>
          <div style={{maxWidth:'1300px', margin:'0 auto'}}>
            <p style={{color:'rgba(255,255,255,0.6)', fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'12px'}}>
              Marketplace N°1 d Afrique
            </p>
            <h1 className="hero-title" style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'2.4rem', color:'white', lineHeight:1.15, marginBottom:'14px'}}>
              Achetez et vendez<br/>partout en Afrique
            </h1>
            <p style={{color:'rgba(255,255,255,0.65)', fontSize:'0.95rem', marginBottom:'32px', maxWidth:'420px', lineHeight:1.6}}>
              Immobilier, vehicules, electronique et bien plus.
            </p>
            <div style={{display:'flex', gap:'28px'}}>
              {[['48K+','Annonces'],['120K+','Membres'],['10+','Pays']].map(([n,l]) => (
                <div key={l}>
                  <strong style={{display:'block', fontFamily:'Syne,sans-serif', fontSize:'1.4rem', fontWeight:800, color:'#f5a623'}}>{n}</strong>
                  <span style={{fontSize:'0.72rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.06em'}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'main' && (
        <div style={{padding:'24px 5%', maxWidth:'1300px', margin:'0 auto'}}>

          <div style={{background:'white', borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', border:'1px solid #e8ede9'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', flexWrap:'wrap'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <button onClick={() => setShowFilters(!showFilters)} style={{display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', background: showFilters ? '#1a7a4a' : '#f5f7f5', color: showFilters ? 'white' : '#111a14', border:'1px solid ' + (showFilters ? '#1a7a4a' : '#e8ede9'), borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.82rem', cursor:'pointer'}}>
                  🎛️ Filtres {showFilters ? '▲' : '▼'}
                </button>
                {hasFilters && (
                  <button onClick={resetFilters} style={{padding:'7px 12px', background:'#fff7ed', color:'#ea580c', border:'1px solid #fed7aa', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.78rem', cursor:'pointer'}}>
                    ✕ Effacer
                  </button>
                )}
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{padding:'7px 10px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', outline:'none', background:'white', cursor:'pointer', color:'#111a14'}}>
                  <option value="recent">Plus recent</option>
                  <option value="moins-cher">Moins cher</option>
                  <option value="plus-cher">Plus cher</option>
                </select>
                <span style={{fontSize:'0.8rem', color:'#6b7c6e', whiteSpace:'nowrap'}}>
                  {ads.length > 0 ? filtered.length + ' annonce(s)' : '6 annonces'}
                </span>
              </div>
            </div>

            {showFilters && (
              <div className="filters-grid" style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #f0f4f1'}}>
                {[
                  { label:'Categorie', el: <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{width:'100%', padding:'8px 10px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', outline:'none', background:'white', cursor:'pointer'}}><option value="">Toutes</option>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select> },
                  { label:'Ville', el: <select value={filterVille} onChange={e => setFilterVille(e.target.value)} style={{width:'100%', padding:'8px 10px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', outline:'none', background:'white', cursor:'pointer'}}><option value="">Toutes</option>{villes.map(v => <option key={v} value={v}>{v}</option>)}</select> },
                  { label:'Prix min (RWF)', el: <input type="number" placeholder="0" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} style={{width:'100%', padding:'8px 10px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', outline:'none', background:'white'}}/> },
                  { label:'Prix max (RWF)', el: <input type="number" placeholder="Max" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} style={{width:'100%', padding:'8px 10px', border:'1px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', outline:'none', background:'white'}}/> },
                ].map((f, i) => (
                  <div key={i}>
                    <label style={{display:'block', fontSize:'0.7rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>{f.label}</label>
                    {f.el}
                  </div>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{textAlign:'center', padding:'60px', color:'#6b7c6e'}}>⏳ Chargement...</div>
          ) : displayAds.length === 0 ? (
            <div style={{background:'white', borderRadius:'14px', padding:'56px', textAlign:'center', border:'1px solid #e8ede9'}}>
              <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>🔍</div>
              <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px', color:'#111a14'}}>Aucun resultat</h3>
              <p style={{color:'#6b7c6e', marginBottom:'20px', fontSize:'0.9rem'}}>Essayez d autres termes ou filtres</p>
              <button onClick={resetFilters} style={{padding:'10px 24px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'9px', fontFamily:'Syne,sans-serif', fontWeight:700, cursor:'pointer'}}>
                Voir toutes les annonces
              </button>
            </div>
          ) : (
            <div className="ads-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px'}}>
              {displayAds.map((ad: any) => (
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
                  </div>
                  <div style={{padding:'14px'}}>
                    <div style={{fontSize:'0.66rem', fontWeight:600, color:'#1a7a4a', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px'}}>{ad.category}</div>
                    <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.93rem', marginBottom:'5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#111a14'}}>{ad.title}</div>
                    <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'#0f5233', marginBottom:'8px'}}>
                      {Number(ad.price).toLocaleString()} <span style={{fontSize:'0.75rem', fontWeight:600}}>RWF</span>
                    </div>
                    {ad.province && <div style={{fontSize:'0.72rem', color:'#6b7c6e', marginBottom:'10px'}}>📍 {ad.province}</div>}
                    <button onClick={e => { e.stopPropagation(); window.location.href='/annonce/' + ad.id }} style={{
                      width:'100%', padding:'8px', background:'#f5f7f5', color:'#0f5233',
                      border:'1px solid #d4e6da', borderRadius:'8px', fontFamily:'Syne,sans-serif',
                      fontWeight:700, fontSize:'0.8rem', cursor:'pointer'
                    }}>
                      Voir l annonce →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'jobs' && (
        <div style={{padding:'32px 5%', maxWidth:'1300px', margin:'0 auto'}}>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', marginBottom:'20px', color:'#111a14'}}>💼 Offres d emploi</h2>
          {[
            {co:'🏦', title:'Developpeur Full-Stack Senior', company:'Bank of Kigali', loc:'Kigali', salary:'1 200 000 – 1 800 000 RWF/mois', type:'CDI'},
            {co:'🏥', title:'Infirmier diplome', company:'King Faisal Hospital', loc:'Kigali', salary:'700 000 – 950 000 RWF/mois', type:'CDI'},
            {co:'🌍', title:'Responsable Programmes', company:'Save the Children Rwanda', loc:'Kigali', salary:'1 500 000 – 2 000 000 RWF/mois', type:'CDD'},
          ].map((job, i) => (
            <div key={i} style={{background:'white', borderRadius:'12px', padding:'18px 20px', border:'1px solid #e8ede9', marginBottom:'10px', display:'flex', alignItems:'center', gap:'14px', cursor:'pointer'}}>
              <div style={{fontSize:'1.6rem', flexShrink:0}}>{job.co}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.92rem', marginBottom:'3px', color:'#111a14', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{job.title}</div>
                <div style={{fontSize:'0.8rem', color:'#1a7a4a', fontWeight:600, marginBottom:'2px'}}>{job.company}</div>
                <div style={{fontSize:'0.75rem', color:'#6b7c6e'}}>📍 {job.loc} · {job.type}</div>
              </div>
              <div style={{textAlign:'right', flexShrink:0}}>
                <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, color:'#111a14', fontSize:'0.82rem', marginBottom:'6px'}}>{job.salary}</div>
                <button onClick={() => window.location.href='/auth'} style={{padding:'6px 14px', background:'#0f5233', color:'white', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.78rem', cursor:'pointer'}}>Postuler</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer style={{background:'#0f5233', color:'rgba(255,255,255,0.6)', padding:'36px 5%', marginTop:'40px'}}>
        <div style={{maxWidth:'1300px', margin:'0 auto', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'16px', alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.15rem', color:'white', marginBottom:'4px'}}>
              Soko<span style={{color:'#f5a623'}}>Deal</span>
            </div>
            <p style={{fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', maxWidth:'240px', lineHeight:1.6}}>
              La premiere plateforme d annonces d Afrique.
            </p>
          </div>
          <div style={{display:'flex', gap:'20px', fontSize:'0.8rem', alignItems:'center'}}>
           <a href="/admin" style={{color:'rgba(255,255,255,0.3)', textDecoration:'none'}}>Admin</a>
<a href="/cgu" style={{color:'rgba(255,255,255,0.3)', textDecoration:'none'}}>CGU</a>
            <span style={{color:'rgba(255,255,255,0.4)'}}>© 2025 SokoDeal · Made in Africa 🌍</span>
          </div>
        </div>
      </footer>
    </>
  )
}