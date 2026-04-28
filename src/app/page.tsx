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
  const catBg: any = {
    'immo-vente':'#e8f5ee','immo-location':'#f3e5f5','immo-terrain':'#e0f2f1',
    'voiture':'#fff3e0','moto':'#fff8e1','electronique':'#e3f2fd','mode':'#fce4ec',
    'maison':'#efebe9','emploi':'#e0f7fa','animaux':'#efebe9','services':'#f9fbe7',
    'agriculture':'#f1f8e9','materiaux':'#fbe9e7','sante':'#fce4ec','sport':'#e8eaf6','education':'#fff8e1'
  }

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (data) { setAds(data); setFiltered(data) }
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

  useEffect(() => {
    let result = [...ads]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(ad =>
        ad.title?.toLowerCase().includes(q) ||
        ad.description?.toLowerCase().includes(q) ||
        ad.category?.toLowerCase().includes(q)
      )
    }
    if (filterCat) result = result.filter(ad => ad.category === filterCat)
    if (filterVille) result = result.filter(ad =>
      ad.province?.toLowerCase().includes(filterVille.toLowerCase()) ||
      ad.district?.toLowerCase().includes(filterVille.toLowerCase())
    )
    if (filterPriceMin) result = result.filter(ad => ad.price >= parseInt(filterPriceMin))
    if (filterPriceMax) result = result.filter(ad => ad.price <= parseInt(filterPriceMax))

    if (sortBy === 'recent') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'moins-cher') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'plus-cher') result.sort((a, b) => b.price - a.price)

    setFiltered(result)
  }, [search, filterCat, filterVille, filterPriceMin, filterPriceMax, sortBy, ads])

  const resetFilters = () => {
    setSearch('')
    setFilterCat('')
    setFilterVille('')
    setFilterPriceMin('')
    setFilterPriceMax('')
    setSortBy('recent')
  }

  const hasFilters = search || filterCat || filterVille || filterPriceMin || filterPriceMax || sortBy !== 'recent'

  const mockAds = [
    {id:'m1', category:'immo-vente', title:'Villa 4 chambres — Kigali, Niboye', price:185000000, images:[], province:'Kigali'},
    {id:'m2', category:'voiture', title:'Toyota RAV4 2019 — 45 000 km', price:26500000, images:[], province:'Kigali'},
    {id:'m3', category:'electronique', title:'Samsung Galaxy S24 Ultra — Neuf', price:980000, images:[], province:'Musanze'},
    {id:'m4', category:'immo-location', title:'Appartement 3 pieces meuble', price:450000, images:[], province:'Butare'},
    {id:'m5', category:'moto', title:'Honda CB125 2022 — 18 000 km', price:3200000, images:[], province:'Gisenyi'},
    {id:'m6', category:'animaux', title:'Vache laitiere Ankole — 2 ans', price:1800000, images:[], province:'Rwamagana'},
  ]

  const displayAds = ads.length > 0 ? filtered : mockAds

  const navCats = [
    {cat:'', label:'🏠 Tout'},
    {cat:'immo-vente', label:'🏡 Immobilier'},
    {cat:'voiture', label:'🚗 Vehicules'},
    {cat:'electronique', label:'📱 Electronique'},
    {cat:'mode', label:'👗 Mode'},
    {cat:'agriculture', label:'🌾 Agriculture'},
    {cat:'materiaux', label:'🧱 Construction'},
    {cat:'sante', label:'💊 Sante'},
    {cat:'sport', label:'⚽ Sport'},
    {cat:'education', label:'📚 Education'},
    {cat:'animaux', label:'🐄 Animaux'},
    {cat:'services', label:'🏗️ Services'},
  ]

  return (
    <>
      <header style={{background:'#0f5233', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 16px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'68px', gap:'16px'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'10px', textDecoration:'none'}}>
            <div style={{width:'40px', height:'40px', background:'#f5a623', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'white'}}>Soko<span style={{color:'#f5a623'}}>Deal</span></span>
          </a>
          <div style={{flex:1, maxWidth:'520px', display:'flex', background:'white', borderRadius:'10px', overflow:'hidden'}}>
            <input
              type="text"
              placeholder="Que recherchez-vous ?"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveSection('main') }}
              style={{flex:1, padding:'10px 16px', border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:'0.95rem'}}
            />
            <button style={{background:'#f5a623', border:'none', cursor:'pointer', padding:'10px 18px', fontSize:'1.1rem'}}>🔍</button>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            {user ? (
              <button onClick={() => window.location.href='/profil'} style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px 18px', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:'8px', color:'white', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', cursor:'pointer'}}>
                <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'#f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.85rem', color:'#111a14', fontFamily:'Syne,sans-serif', flexShrink:0}}>
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                Mon compte
              </button>
            ) : (
              <>
                <button onClick={() => window.location.href='/auth?mode=login'} style={{padding:'8px 18px', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:'8px', color:'white', background:'transparent', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', cursor:'pointer'}}>
                  Se connecter
                </button>
                <button onClick={() => window.location.href='/auth?mode=signup'} style={{padding:'8px 18px', border:'1.5px solid #f5a623', borderRadius:'8px', color:'#111a14', background:'#f5a623', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.9rem', cursor:'pointer'}}>
                  Creer un compte
                </button>
              </>
            )}
            <button onClick={() => window.location.href='/publier'} style={{padding:'9px 20px', background:'white', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', color:'#0f5233', cursor:'pointer'}}>
              + Deposer une annonce
            </button>
          </div>
        </div>
        <nav style={{background:'#1a7a4a', padding:'0 5%', display:'flex', overflowX:'auto'}}>
          {navCats.map((item, i) => (
            <a key={i} href="#" onClick={() => { setActiveSection('main'); setFilterCat(item.cat) }} style={{
              display:'flex', alignItems:'center', gap:'6px', padding:'11px 16px',
              color:'rgba(255,255,255,0.85)', textDecoration:'none', fontSize:'0.85rem',
              fontWeight: filterCat === item.cat ? 700 : 500, whiteSpace:'nowrap',
              borderBottom: filterCat === item.cat ? '3px solid #f5a623' : '3px solid transparent'
            }}>{item.label}</a>
          ))}
          <a href="#" onClick={() => setActiveSection('jobs')} style={{
            display:'flex', alignItems:'center', gap:'6px', padding:'11px 16px',
            color:'#f5a623', textDecoration:'none', fontSize:'0.85rem', fontWeight:700, whiteSpace:'nowrap',
            borderBottom: activeSection === 'jobs' ? '3px solid #f5a623' : '3px solid transparent'
          }}>💼 Jobs</a>
        </nav>
      </header>

      {activeSection === 'main' && (
        <div style={{background:'linear-gradient(135deg, #0f5233 0%, #1a7a4a 60%, #2d9e5f 100%)', padding:'52px 5% 40px'}}>
          <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'2.4rem', color:'white', lineHeight:1.15, marginBottom:'12px'}}>
            Le marche <span style={{color:'#f5a623'}}>N1</span> d Afrique
          </h1>
          <p style={{color:'rgba(255,255,255,0.75)', fontSize:'1rem', marginBottom:'24px'}}>
            Achetez, vendez et louez facilement partout en Afrique
          </p>
          <div style={{display:'flex', gap:'28px'}}>
            {[['48K+','Annonces'],['120K+','Membres'],['10+','Pays']].map(([n,l]) => (
              <div key={l} style={{textAlign:'center'}}>
                <strong style={{display:'block', fontFamily:'Syne,sans-serif', fontSize:'1.6rem', fontWeight:800, color:'#f5a623'}}>{n}</strong>
                <span style={{fontSize:'0.8rem', color:'rgba(255,255,255,0.6)', textTransform:'uppercase'}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'main' && (
        <div style={{padding:'28px 5%', maxWidth:'1300px', margin:'0 auto'}}>

          {/* BARRE FILTRES */}
          <div style={{background:'white', borderRadius:'14px', padding:'16px 20px', marginBottom:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <button onClick={() => setShowFilters(!showFilters)} style={{display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background: showFilters ? '#1a7a4a' : '#f0f4f1', color: showFilters ? 'white' : '#1a7a4a', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer'}}>
                  🎛️ Filtres {showFilters ? '▲' : '▼'}
                </button>
                {hasFilters && (
                  <button onClick={resetFilters} style={{padding:'8px 14px', background:'#fce4ec', color:'#c0392b', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', cursor:'pointer'}}>
                    ✕ Effacer tout
                  </button>
                )}
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{padding:'8px 12px', border:'1.5px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', outline:'none', background:'#faf7f2', cursor:'pointer'}}>
                  <option value="recent">📅 Plus recent</option>
                  <option value="moins-cher">💰 Moins cher</option>
                  <option value="plus-cher">💎 Plus cher</option>
                </select>
                <span style={{fontSize:'0.85rem', color:'#6b7c6e', fontWeight:600}}>
                  {ads.length > 0 ? filtered.length + ' annonce(s)' : mockAds.length + ' annonces'}
                </span>
              </div>
            </div>

            {showFilters && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #e8ede9'}}>
                <div>
                  <label style={{display:'block', fontSize:'0.78rem', fontWeight:600, color:'#6b7c6e', marginBottom:'6px'}}>Categorie</label>
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', outline:'none', background:'#faf7f2', cursor:'pointer'}}>
                    <option value="">Toutes</option>
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{display:'block', fontSize:'0.78rem', fontWeight:600, color:'#6b7c6e', marginBottom:'6px'}}>Ville / Region</label>
                  <select value={filterVille} onChange={e => setFilterVille(e.target.value)} style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', outline:'none', background:'#faf7f2', cursor:'pointer'}}>
                    <option value="">Toutes les villes</option>
                    {villes.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{display:'block', fontSize:'0.78rem', fontWeight:600, color:'#6b7c6e', marginBottom:'6px'}}>Prix min (RWF)</label>
                  <input type="number" placeholder="0" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', outline:'none', background:'#faf7f2'}}/>
                </div>
                <div>
                  <label style={{display:'block', fontSize:'0.78rem', fontWeight:600, color:'#6b7c6e', marginBottom:'6px'}}>Prix max (RWF)</label>
                  <input type="number" placeholder="999 999 999" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} style={{width:'100%', padding:'9px 12px', border:'1.5px solid #e8ede9', borderRadius:'8px', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', outline:'none', background:'#faf7f2'}}/>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{textAlign:'center', padding:'40px', color:'#6b7c6e'}}>⏳ Chargement...</div>
          ) : displayAds.length === 0 ? (
            <div style={{background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
              <div style={{fontSize:'3rem', marginBottom:'12px'}}>🔍</div>
              <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'8px'}}>Aucun resultat</h3>
              <p style={{color:'#6b7c6e', marginBottom:'16px', fontSize:'0.9rem'}}>Essayez d autres termes ou filtres</p>
              <button onClick={resetFilters} style={{padding:'10px 24px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:700, cursor:'pointer'}}>
                Voir toutes les annonces
              </button>
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px'}}>
              {displayAds.map((ad: any) => (
                <div key={ad.id} onClick={() => window.location.href='/annonce/' + ad.id} style={{background:'white', borderRadius:'14px', overflow:'hidden', boxShadow:'0 4px 24px rgba(10,60,25,0.10)', cursor:'pointer'}}>
                  <div style={{height:'160px', background: catBg[ad.category] || '#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3.5rem', overflow:'hidden', position:'relative'}}>
                    {ad.images && ad.images.length > 0 ? (
                      <img src={ad.images[0]} alt={ad.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                    ) : (
                      catEmoji[ad.category] || '📦'
                    )}
                  </div>
                  <div style={{padding:'13px 14px'}}>
                    <div style={{fontSize:'0.72rem', fontWeight:600, color:'#1a7a4a', textTransform:'uppercase', marginBottom:'4px'}}>{ad.category}</div>
                    <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.97rem', marginBottom:'6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ad.title}</div>
                    <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#1a7a4a', marginBottom:'8px'}}>
                      {Number(ad.price).toLocaleString()} RWF
                    </div>
                    {ad.province && <div style={{fontSize:'0.75rem', color:'#6b7c6e', marginBottom:'8px'}}>📍 {ad.province}{ad.district ? ' · ' + ad.district : ''}</div>}
                    <button onClick={e => { e.stopPropagation(); window.location.href='/annonce/' + ad.id }} style={{
                      width:'100%', padding:'8px', background:'#1a7a4a', color:'white',
                      border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif',
                      fontWeight:700, fontSize:'0.82rem', cursor:'pointer'
                    }}>Voir l annonce</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'jobs' && (
        <div style={{padding:'40px 5%', maxWidth:'1300px', margin:'0 auto'}}>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', marginBottom:'24px'}}>💼 Offres d emploi</h2>
          {[
            {co:'🏦', title:'Developpeur Full-Stack Senior', company:'Bank of Kigali', loc:'Kigali', salary:'1 200 000 – 1 800 000 RWF/mois', type:'CDI'},
            {co:'🏥', title:'Infirmier diplome', company:'King Faisal Hospital', loc:'Kigali', salary:'700 000 – 950 000 RWF/mois', type:'CDI'},
            {co:'🌍', title:'Responsable Programmes', company:'Save the Children Rwanda', loc:'Kigali', salary:'1 500 000 – 2 000 000 RWF/mois', type:'CDD'},
          ].map((job, i) => (
            <div key={i} style={{background:'white', borderRadius:'16px', padding:'22px 24px', boxShadow:'0 4px 24px rgba(10,60,25,0.10)', marginBottom:'14px', display:'flex', alignItems:'center', gap:'16px', cursor:'pointer'}}>
              <div style={{fontSize:'2rem'}}>{job.co}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', marginBottom:'4px'}}>{job.title}</div>
                <div style={{fontSize:'0.85rem', color:'#1a7a4a', fontWeight:600, marginBottom:'4px'}}>{job.company}</div>
                <div style={{fontSize:'0.8rem', color:'#6b7c6e'}}>📍 {job.loc} · {job.type}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1a7a4a', fontSize:'0.95rem'}}>{job.salary}</div>
                <button onClick={() => window.location.href='/auth'} style={{marginTop:'8px', padding:'7px 16px', background:'#1a3a5c', color:'white', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.8rem', cursor:'pointer'}}>Postuler</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer style={{background:'#111a14', color:'rgba(255,255,255,0.7)', padding:'40px 5%', marginTop:'40px'}}>
        <div style={{maxWidth:'1300px', margin:'0 auto', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'20px'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:'white', marginBottom:'8px'}}>
              Soko<span style={{color:'#f5a623'}}>Deal</span>
            </div>
            <p style={{fontSize:'0.88rem', lineHeight:1.7, maxWidth:'280px'}}>La premiere plateforme d annonces d Afrique.</p>
          </div>
          <div style={{fontSize:'0.83rem'}}>© 2025 SokoDeal — Made in Africa 🌍</div>
        </div>
      </footer>
    </>
  )
}