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
    const files = Array.from(e.target.files || [])
    if (files.length > 5) { setMsg('❌ Maximum 5 photos'); return }
    setPhotos(files)
    setMsg('')
  }

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.price || !form.phone) {
      setMsg('❌ Titre, categorie, prix et telephone sont obligatoires')
      return
    }
    setLoading(true)
    setMsg('')

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
      title: form.title,
      category: form.category,
      price: parseFloat(form.price),
      description: form.description,
      province: form.ville,
      district: form.district,
      phone: form.phone,
      images: imageUrls,
      is_active: true,
      user_id: user.id,
    }])

    if (error) { setMsg('❌ ' + error.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  const inp = {
    width:'100%', padding:'11px 14px', border:'1.5px solid #e8ede9',
    borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem',
    outline:'none', background:'#faf7f2', marginBottom:'12px', display:'block',
    boxSizing:'border-box' as const
  }

  const villes = [
    'Kigali','Butare','Musanze','Ruhengeri','Gisenyi','Cyangugu','Kibuye',
    'Byumba','Rwamagana','Nyamata','Kibungo','Gitarama','Muhanga','Huye',
    'Rubavu','Rusizi','Karongi','Ngoma','Bugesera','Nyagatare','Gatsibo'
  ]

  if (success) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f5233,#1a7a4a)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'20px', padding:'36px', maxWidth:'480px', width:'100%', textAlign:'center'}}>
        <div style={{fontSize:'4rem', marginBottom:'16px'}}>🎉</div>
        <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'12px'}}>Annonce publiee !</h2>
        <p style={{color:'#6b7c6e', marginBottom:'24px'}}>Votre annonce est maintenant visible sur SokoDeal.</p>
        <a href="/publier" style={{display:'block', padding:'13px', background:'#f5a623', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'#111a14', textDecoration:'none', marginBottom:'10px'}}>
          + Publier une autre annonce
        </a>
        <a href="/" style={{display:'block', padding:'13px', background:'#1a7a4a', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white', textDecoration:'none'}}>
          🦁 Voir les annonces
        </a>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f5233,#1a7a4a)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
      <div style={{background:'white', borderRadius:'20px', padding:'28px', maxWidth:'560px', width:'100%'}}>

        <div style={{textAlign:'center', marginBottom:'16px'}}>
          <a href="/" style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#111a14', textDecoration:'none'}}>
            🦁 Soko<span style={{color:'#1a7a4a'}}>Deal</span>
          </a>
        </div>

        <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'4px'}}>
          📝 Deposer une annonce
        </h1>
        <p style={{color:'#6b7c6e', fontSize:'0.82rem', marginBottom:'18px'}}>Gratuit · Publie en 2 minutes</p>

        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
          style={{...inp, cursor:'pointer'}}>
          <option value="">— Categorie * —</option>
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

        <input type="text" placeholder="Titre de l annonce *" value={form.title}
          onChange={e => setForm({...form, title: e.target.value})} style={inp}/>

        <input type="number" placeholder="Prix (RWF) *" value={form.price}
          onChange={e => setForm({...form, price: e.target.value})} style={inp}/>

        <textarea placeholder="Description de votre annonce..." value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          style={{...inp, minHeight:'80px', resize:'vertical'}}/>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <select value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
            style={{...inp, cursor:'pointer', marginBottom:'12px'}}>
            <option value="">Ville *</option>
            {villes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <input type="text" placeholder="Quartier / District" value={form.district}
            onChange={e => setForm({...form, district: e.target.value})} style={inp}/>
        </div>

        <input type="tel" placeholder="Telephone * (+250...)" value={form.phone}
          onChange={e => setForm({...form, phone: e.target.value})} style={inp}/>

        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'0.82rem', fontWeight:600, marginBottom:'8px', color:'#111a14'}}>
            📸 Photos (maximum 5)
          </label>
          <input type="file" accept="image/*" multiple onChange={handlePhotos}
            style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#faf7f2', cursor:'pointer', boxSizing:'border-box'}}
          />
          {photos.length > 0 && (
            <div style={{marginTop:'10px'}}>
              <p style={{fontSize:'0.78rem', color:'#1a7a4a', fontWeight:600, marginBottom:'8px'}}>
                ✅ {photos.length} photo(s)
              </p>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {photos.map((photo, i) => (
                  <div key={i} style={{position:'relative'}}>
                    <img src={URL.createObjectURL(photo)} alt=""
                      style={{width:'64px', height:'64px', objectFit:'cover', borderRadius:'8px', border:'2px solid #e8ede9'}}
                    />
                    <button onClick={() => setPhotos(photos.filter((_,j) => j !== i))}
                      style={{position:'absolute', top:'-5px', right:'-5px', width:'18px', height:'18px', background:'red', color:'white', border:'none', borderRadius:'50%', fontSize:'0.65rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {msg && <p style={{color:'red', fontSize:'0.8rem', marginBottom:'12px', background:'#fce4ec', padding:'10px', borderRadius:'8px'}}>{msg}</p>}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%', padding:'13px',
          background: loading ? '#ccc' : '#1a7a4a', border:'none',
          borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
          fontSize:'1rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer'
        }}>{loading ? '⏳ Publication...' : '🚀 Publier mon annonce'}</button>

        <a href="/" style={{display:'block', textAlign:'center', marginTop:'12px', color:'#6b7c6e', fontSize:'0.82rem'}}>
          ← Retour
        </a>
      </div>
    </div>
  )
}