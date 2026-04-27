'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [activeSection, setActiveSection] = useState('main')
  const [postOpen, setPostOpen] = useState(false)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6)
      if (data) setAds(data)
      setLoading(false)
    }
    fetchAds()
  }, [])

  const catEmoji: any = {
    'immo-vente':'🏡', 'immo-location':'🏢', 'immo-terrain':'🌿',
    'voiture':'🚗', 'moto':'🛵', 'electronique':'📱',
    'mode':'👗', 'maison':'🛋️', 'emploi':'💼', 'animaux':'🐄', 'services':'🏗️'
  }
  const catBg: any = {
    'immo-vente':'#e8f5ee', 'immo-location':'#f3e5f5', 'immo-terrain':'#e0f2f1',
    'voiture':'#fff3e0', 'moto':'#fff8e1', 'electronique':'#e3f2fd',
    'mode':'#fce4ec', 'maison':'#efebe9', 'emploi':'#e0f7fa', 'animaux':'#efebe9', 'services':'#f9fbe7'
  }

  const mockAds = [
    {id:'m1', category:'immo-vente', title:'Villa 4 chambres — Kigali, Niboye', price:185000000},
    {id:'m2', category:'voiture', title:'Toyota RAV4 2019 — 45 000 km', price:26500000},
    {id:'m3', category:'electronique', title:'Samsung Galaxy S24 Ultra — Neuf', price:980000},
    {id:'m4', category:'immo-location', title:'Appartement 3 pièces meublé', price:450000},
    {id:'m5', category:'moto', title:'Honda CB125 2022 — 18 000 km', price:3200000},
    {id:'m6', category:'animaux', title:'Vache laitière Ankole — 2 ans', price:1800000},
  ]

  const displayAds = ads.length > 0 ? ads : mockAds

  return (
    <>
      {/* HEADER */}
      <header style={{background:'#0f5233', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 16px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'68px', gap:'16px'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'10px', textDecoration:'none'}}>
            <div style={{width:'40px', height:'40px', background:'#f5a623', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'white'}}>Soko<span style={{color:'#f5a623'}}>Deal</span></span>
          </a>
          <div style={{flex:1, maxWidth:'520px', display:'flex', background:'white', borderRadius:'10px', overflow:'hidden'}}>
            <input type="text" placeholder="Que recherchez-vous ?" style={{flex:1, padding:'10px 16px', border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:'0.95rem'}}/>
            <button style={{background:'#f5a623', border:'none', cursor:'pointer', padding:'10px 18px', fontSize:'1.1rem'}}>🔍</button>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={() => window.location.href='/auth'} style={{padding:'8px 18px', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:'8px', color:'white', background:'transparent', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', cursor:'pointer'}}>Se connecter</button>
            <button onClick={() => window.location.href='/publier'} style={{padding:'9px 20px', background:'#f5a623', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', color:'#111a14', cursor:'pointer'}}>+ Déposer une annonce</button>
          </div>
        </div>
        <nav style={{background:'#1a7a4a', padding:'0 5%', display:'flex', overflowX:'auto'}}>
          {[
            {id:'main', label:'🏠 Immobilier'},
            {id:'main', label:'🚗 Véhicules'},
            {id:'main', label:'📱 Électronique'},
            {id:'main', label:'👗 Mode'},
            {id:'jobs', label:'💼 Jobs'},
            {id:'main', label:'🛵 Motos'},
            {id:'main', label:'🐄 Animaux'},
          ].map((item, i) => (
            <a key={i} href="#" onClick={() => setActiveSection(item.id)} style={{
              display:'flex', alignItems:'center', gap:'6px', padding:'11px 18px',
              color: item.label.includes('Jobs') ? '#f5a623' : 'rgba(255,255,255,0.8)',
              textDecoration:'none', fontSize:'0.88rem', fontWeight: item.label.includes('Jobs') ? 700 : 500,
              whiteSpace:'nowrap', borderBottom: activeSection===item.id ? '3px solid #f5a623' : '3px solid transparent'
            }}>{item.label}</a>
          ))}
        </nav>
      </header>

      {/* HERO */}
      {activeSection === 'main' && (
        <div style={{background:'linear-gradient(135deg, #0f5233 0%, #1a7a4a 60%, #2d9e5f 100%)', padding:'52px 5% 40px'}}>
          <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'2.4rem', color:'white', lineHeight:1.15, marginBottom:'12px'}}>
            Le marché <span style={{color:'#f5a623'}}>N°1</span> d'Afrique
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

      {/* ANNONCES */}
      {activeSection === 'main' && (
        <div style={{padding:'28px 5%', maxWidth:'1300px', margin:'0 auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700}}>
              {ads.length > 0 ? `${ads.length} annonces récentes` : 'Annonces récentes'}
            </h2>
            <button onClick={() => window.location.href='/publier'} style={{padding:'8px 18px', background:'#1a7a4a', color:'white', border:'none', borderRadius:'8px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer'}}>
              + Publier une annonce
            </button>
          </div>

          {loading ? (
            <div style={{textAlign:'center', padding:'40px', color:'#6b7c6e'}}>⏳ Chargement des annonces...</div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px'}}>
              {displayAds.map((ad: any) => (
                <div key={ad.id} style={{background:'white', borderRadius:'14px', overflow:'hidden', boxShadow:'0 4px 24px rgba(10,60,25,0.10)', cursor:'pointer'}}>
                  <div style={{height:'160px', background: catBg[ad.category] || '#e8f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3.5rem'}}>
                    {catEmoji[ad.category] || '📦'}
                  </div>
                  <div style={{padding:'13px 14px'}}>
                    <div style={{fontSize:'0.72rem', fontWeight:600, color:'#1a7a4a', textTransform:'uppercase', marginBottom:'4px'}}>{ad.category}</div>
                    <div style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.97rem', marginBottom:'6px'}}>{ad.title}</div>
                    <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#1a7a4a'}}>
                      {Number(ad.price).toLocaleString()} RWF
                    </div>
                    {ad.province && <div style={{fontSize:'0.75rem', color:'#6b7c6e', marginTop:'4px'}}>📍 {ad.province} {ad.district && `· ${ad.district}`}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JOBS */}
      {activeSection === 'jobs' && (
        <div style={{padding:'40px 5%', maxWidth:'1300px', margin:'0 auto'}}>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', marginBottom:'24px'}}>💼 Offres d'emploi</h2>
          {[
            {co:'🏦', title:'Développeur Full-Stack Senior', company:'Bank of Kigali', loc:'Kigali', salary:'1 200 000 – 1 800 000 RWF/mois', type:'CDI'},
            {co:'🏥', title:'Infirmier(ère) diplômé(e)', company:'King Faisal Hospital', loc:'Kigali', salary:'700 000 – 950 000 RWF/mois', type:'CDI'},
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

      {/* FOOTER */}
      <footer style={{background:'#111a14', color:'rgba(255,255,255,0.7)', padding:'40px 5%', marginTop:'40px'}}>
        <div style={{maxWidth:'1300px', margin:'0 auto', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'20px'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:'white', marginBottom:'8px'}}>
              Soko<span style={{color:'#f5a623'}}>Deal</span>
            </div>
            <p style={{fontSize:'0.88rem', lineHeight:1.7, maxWidth:'280px'}}>La première plateforme d'annonces d'Afrique.</p>
          </div>
          <div style={{fontSize:'0.83rem'}}>© 2025 SokoDeal — Made in Africa 🌍</div>
        </div>
      </footer>
    </>
  )
}