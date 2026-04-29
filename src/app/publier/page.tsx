'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PublierPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [form, setForm] = useState({
    title: '', category: '', price: '', description: '',
    ville: '', district: '', phone: ''
  })
  const [msg, setMsg] = useState('')

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const combined = [...photos, ...newFiles]
    if (combined.length > 5) { setMsg('Maximum 5 photos au total'); return }
    setPhotos(combined); setMsg('')
  }

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.price || !form.phone) {
      setMsg('Titre, categorie, prix et telephone sont obligatoires'); return
    }
    setLoading(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth?mode=login'; return }

    const imageUrls: string[] = []
    for (const photo of photos) {
      const fileName = `${Date.now()}-${photo.name}`
      const { data, error } = await supabase.storage.from('annonces').upload(fileName, photo)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('annonces').getPublicUrl(fileName)
        imageUrls.push(urlData.publicUrl)
      }
    }

    const { error } = await supabase.from('ads').insert([{
      title: form.title, category: form.category,
      price: parseFloat(form.price), description: form.description,
      province: form.ville, district: form.district,
      phone: form.phone, images: imageUrls,
      is_active: true, user_id: user.id,
    }])

    if (error) { setMsg(error.message); setLoading(false); return }
    setSuccess(true); setLoading(false)
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:'1px solid #e8ede9',
    borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem',
    outline:'none', background:'#fafaf9', marginBottom:'12px', display:'block',
    boxSizing:'border-box', color:'#111a14'
  }

  const villes = [
    'Kigali','Butare','Musanze','Ruhengeri','Gisenyi','Cyangugu','Kibuye',
    'Byumba','Rwamagana','Nyamata','Kibungo','Gitarama','Muhanga','Huye',
    'Rubavu','Rusizi','Karongi','Ngoma','Bugesera','Nyagatare','Gatsibo'
  ]

  if (success) return (
    <div style={{minHeight:'100vh', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'16px', padding:'40px', maxWidth:'440px', width:'100%', textAlign:'center', border:'1px solid #e8ede9', boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
        <div style={{width:'64px', height:'64px', background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 16px'}}>
          🎉
        </div>
        <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px', color:'#111a14'}}>Annonce publiee !</h2>
        <p style={{color:'#6b7c6e', marginBottom:'24px', fontSize:'0.88rem', lineHeight:1.6}}>Votre annonce est maintenant visible sur SokoDeal.</p>
        <a href="/publier" style={{display:'block', padding:'12px', background:'#f5a623', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'#111a14', textDecoration:'none', marginBottom:'10px'}}>
          + Publier une autre annonce
        </a>
        <a href="/" style={{display:'block', padding:'12px', background:'#1a7a4a', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', textDecoration:'none'}}>
          Voir les annonces →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
      <div style={{background:'white', borderRadius:'16px', padding:'28px', maxWidth:'540px', width:'100%', border:'1px solid #e8ede9', boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>

        <div style={{textAlign:'center', marginBottom:'20px'}}>
          <a href="/" style={{display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
            <div style={{width:'34px', height:'34px', background:'#f5a623', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
          </a>
        </div>

        <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.15rem', marginBottom:'4px', color:'#111a14'}}>
          Deposer une annonce
        </h1>
        <p style={{color:'#6b7c6e', fontSize:'0.82rem', marginBottom:'20px'}}>Gratuit · Publie en 2 minutes</p>

        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Categorie</label>
        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{...inp, cursor:'pointer'}}>
          <option value="">Choisir une categorie</option>
          <option value="immo-vente">🏡 Immobilier Vente</option>
          <option value="immo-location">🏢 Immobilier Location</option>
          <option value="immo-terrain">🌿 Terrain</option>
          <option value="voiture">🚗 Voitures</option>
          <option value="moto">🛵 Motos</option>
          <option value="electronique">📱 Electronique</option>
          <option value="mode">👗 Mode et Beaute</option>
          <option value="maison">🛋️ Maison et Jardin</option>
          <option value="emploi">💼 Emploi</option>
          <option value="animaux">🐄 Animaux</option>
          <option value="services">🏗️ Services</option>
          <option value="agriculture">🌾 Agriculture</option>
          <option value="materiaux">🧱 Materiaux Construction</option>
          <option value="sante">💊 Sante et Beaute</option>
          <option value="sport">⚽ Sport et Loisirs</option>
          <option value="education">📚 Education</option>
        </select>

        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Titre</label>
        <input type="text" placeholder="Ex: iPhone 15 Pro Max 256Go" value={form.title}
          onChange={e => setForm({...form, title: e.target.value})} style={inp}/>

        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Prix (RWF)</label>
        <input type="number" placeholder="Ex: 850000" value={form.price}
          onChange={e => setForm({...form, price: e.target.value})} style={inp}/>

        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Description</label>
        <textarea placeholder="Decrivez votre article en detail..." value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          style={{...inp, minHeight:'80px', resize:'vertical'}}/>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Ville</label>
            <select value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
              style={{...inp, cursor:'pointer', marginBottom:'12px'}}>
              <option value="">Choisir</option>
              {villes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Quartier</label>
            <input type="text" placeholder="Ex: Kicukiro" value={form.district}
              onChange={e => setForm({...form, district: e.target.value})} style={inp}/>
          </div>
        </div>

        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Telephone</label>
        <input type="tel" placeholder="+250 780 000 000" value={form.phone}
          onChange={e => setForm({...form, phone: e.target.value})} style={inp}/>

        {/* PHOTOS */}
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.04em'}}>
            Photos ({photos.length}/5)
          </label>
          {photos.length < 5 && (
            <input type="file" accept="image/*" multiple onChange={handlePhotos}
              style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#fafaf9', cursor:'pointer', boxSizing:'border-box', marginBottom:'10px'}}
            />
          )}
          {photos.length > 0 && (
            <div>
              <p style={{fontSize:'0.75rem', color:'#6b7c6e', marginBottom:'8px'}}>
                Cliquez sur une photo pour la mettre en premiere position
              </p>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {photos.map((photo, i) => (
                  <div key={i} style={{position:'relative', cursor:'pointer'}} onClick={() => {
                    if (i === 0) return
                    const newPhotos = [...photos]
                    const [selected] = newPhotos.splice(i, 1)
                    newPhotos.unshift(selected)
                    setPhotos(newPhotos)
                  }}>
                    <img src={URL.createObjectURL(photo)} alt=""
                      style={{
                        width:'76px', height:'76px', objectFit:'cover', borderRadius:'9px',
                        border: i === 0 ? '2.5px solid #1a7a4a' : '2px solid #e8ede9',
                      }}
                    />
                    {i === 0 && (
                      <div style={{position:'absolute', bottom:'4px', left:'50%', transform:'translateX(-50%)', background:'#1a7a4a', color:'white', fontSize:'0.52rem', fontWeight:800, padding:'2px 5px', borderRadius:'4px', whiteSpace:'nowrap'}}>
                        PRINCIPALE
                      </div>
                    )}
                    <button onClick={ev => { ev.stopPropagation(); setPhotos(photos.filter((_,j) => j !== i)) }}
                      style={{position:'absolute', top:'-5px', right:'-5px', width:'18px', height:'18px', background:'#e74c3c', color:'white', border:'none', borderRadius:'50%', fontSize:'0.65rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800}}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {msg && (
          <div style={{background:'#fff1f0', border:'1px solid #ffd6d6', color:'#c0392b', padding:'10px 14px', borderRadius:'8px', fontSize:'0.82rem', marginBottom:'14px'}}>
            {msg}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%', padding:'13px',
          background: loading ? '#ccc' : '#1a7a4a', border:'none',
          borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
          fontSize:'0.95rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom:'12px'
        }}>{loading ? '⏳ Publication...' : 'Publier mon annonce'}</button>

        <a href="/" style={{display:'block', textAlign:'center', color:'#6b7c6e', fontSize:'0.82rem', textDecoration:'none'}}>
          ← Retour a l accueil
        </a>
      </div>
    </div>
  )
}