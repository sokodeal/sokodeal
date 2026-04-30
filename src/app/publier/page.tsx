'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const INDICATIFS = [
  { code: '+250', flag: '🇷🇼', pays: 'Rwanda' },
  { code: '+243', flag: '🇨🇩', pays: 'RD Congo' },
  { code: '+256', flag: '🇺🇬', pays: 'Uganda' },
  { code: '+255', flag: '🇹🇿', pays: 'Tanzania' },
  { code: '+254', flag: '🇰🇪', pays: 'Kenya' },
  { code: '+257', flag: '🇧🇮', pays: 'Burundi' },
  { code: '+33', flag: '🇫🇷', pays: 'France' },
  { code: '+32', flag: '🇧🇪', pays: 'Belgique' },
  { code: '+1', flag: '🇺🇸', pays: 'USA/Canada' },
]

export default function PublierPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [form, setForm] = useState({
    title: '', category: '', price: '', description: '',
    ville: '', district: '',
    phone: '', phone_indicatif: '+250',
    whatsapp: '', whatsapp_indicatif: '+250',
    whatsapp_same: true,
    hide_phone: false,
  })
  const [msg, setMsg] = useState('')

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const combined = [...photos, ...newFiles]
    if (combined.length > 5) { setMsg('Maximum 5 photos au total'); return }
    setPhotos(combined); setMsg('')
  }

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.price) {
      setMsg('Titre, catégorie et prix sont obligatoires'); return
    }
    if (!form.hide_phone && !form.phone) {
      setMsg('Ajoutez un numéro ou activez "Contact via messagerie uniquement"'); return
    }
    setLoading(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth?mode=login'; return }

    // Vérifier identité
    const { data: userData } = await supabase
      .from('users')
      .select('plan, is_verified')
      .eq('id', user.id)
      .single()

    if (!userData?.is_verified) {
      setLoading(false)
      setMsg('🔒 Vous devez vérifier votre identité avant de publier une annonce.')
      setTimeout(() => window.location.href = '/verification', 2000)
      return
    }

    // Vérifier limite plan gratuit

    const plan = userData?.plan || 'gratuit'

    if (plan === 'gratuit') {
      const { count } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if ((count || 0) >= 5) {
        setMsg('🔒 Limite atteinte — Le plan gratuit permet 5 annonces actives maximum. Passez au plan Pro pour publier sans limite.')
        setLoading(false)
        return
      }
    }

    const imageUrls: string[] = []
    for (const photo of photos) {
      const fileName = `${Date.now()}-${photo.name}`
      const { data, error } = await supabase.storage.from('annonces').upload(fileName, photo)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('annonces').getPublicUrl(fileName)
        imageUrls.push(urlData.publicUrl)
      }
    }

    const fullPhone = form.phone ? form.phone_indicatif + ' ' + form.phone : ''
    const fullWhatsapp = form.whatsapp_same
      ? fullPhone
      : (form.whatsapp ? form.whatsapp_indicatif + ' ' + form.whatsapp : '')

    const { error } = await supabase.from('ads').insert([{
      title: form.title, category: form.category,
      price: parseFloat(form.price), description: form.description,
      province: form.ville, district: form.district,
      phone: fullPhone,
      whatsapp: fullWhatsapp,
      hide_phone: form.hide_phone,
      images: imageUrls,
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
        <div style={{width:'64px', height:'64px', background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 16px'}}>🎉</div>
        <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px', color:'#111a14'}}>Annonce publiée !</h2>
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

        <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.15rem', marginBottom:'4px', color:'#111a14'}}>Déposer une annonce</h1>
        <p style={{color:'#6b7c6e', fontSize:'0.82rem', marginBottom:'20px'}}>Gratuit · Publié en 2 minutes</p>

        {/* CATEGORIE */}
        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Catégorie</label>
        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{...inp, cursor:'pointer'}}>
          <option value="">Choisir une catégorie</option>
          <option value="immo-vente">🏡 Immobilier Vente</option>
          <option value="immo-location">🏢 Immobilier Location</option>
          <option value="immo-terrain">🌿 Terrain</option>
          <option value="voiture">🚗 Voitures</option>
          <option value="moto">🛵 Motos</option>
          <option value="electronique">📱 Électronique</option>
          <option value="mode">👗 Mode et Beauté</option>
          <option value="maison">🛋️ Maison et Jardin</option>
          <option value="emploi">💼 Emploi</option>
          <option value="animaux">🐄 Animaux</option>
          <option value="services">🏗️ Services</option>
          <option value="agriculture">🌾 Agriculture</option>
          <option value="materiaux">🧱 Matériaux Construction</option>
          <option value="sante">💊 Santé et Beauté</option>
          <option value="sport">⚽ Sport et Loisirs</option>
          <option value="education">📚 Éducation</option>
        </select>

        {/* TITRE */}
        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Titre</label>
        <input type="text" placeholder="Ex: iPhone 15 Pro Max 256Go" value={form.title}
          onChange={e => setForm({...form, title: e.target.value})} style={inp}/>

        {/* PRIX */}
        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Prix (RWF)</label>
        <input type="number" placeholder="Ex: 850000" value={form.price}
          onChange={e => setForm({...form, price: e.target.value})} style={inp}/>

        {/* DESCRIPTION */}
        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Description</label>
        <textarea placeholder="Décrivez votre article en détail..." value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          style={{...inp, minHeight:'80px', resize:'vertical'}}/>

        {/* VILLE */}
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

        {/* TELEPHONE */}
        <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>📞 Téléphone</label>
        <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
          <select value={form.phone_indicatif} onChange={e => setForm({...form, phone_indicatif: e.target.value})}
            style={{padding:'11px 8px', border:'1px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', outline:'none', background:'#fafaf9', color:'#111a14', cursor:'pointer', flexShrink:0}}>
            {INDICATIFS.map(i => (
              <option key={i.code} value={i.code}>{i.flag} {i.code}</option>
            ))}
          </select>
          <input type="tel" placeholder="780 000 000" value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            disabled={form.hide_phone}
            style={{flex:1, padding:'11px 14px', border:'1px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem', outline:'none', background: form.hide_phone ? '#f5f7f5' : '#fafaf9', color:'#111a14'}} />
        </div>

        {/* WHATSAPP */}
        <label style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', cursor:'pointer'}}>
          <input type="checkbox" checked={form.whatsapp_same} onChange={e => setForm({...form, whatsapp_same: e.target.checked})}
            style={{width:'15px', height:'15px', accentColor:'#1a7a4a', cursor:'pointer'}} />
          <span style={{fontSize:'0.82rem', color:'#6b7c6e', fontFamily:'DM Sans,sans-serif'}}>💬 Mon numéro WhatsApp est le même que mon téléphone</span>
        </label>

        {!form.whatsapp_same && (
          <>
            <label style={{display:'block', fontSize:'0.72rem', fontWeight:600, color:'#6b7c6e', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em'}}>💬 WhatsApp</label>
            <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
              <select value={form.whatsapp_indicatif} onChange={e => setForm({...form, whatsapp_indicatif: e.target.value})}
                style={{padding:'11px 8px', border:'1px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem', outline:'none', background:'#fafaf9', color:'#111a14', cursor:'pointer', flexShrink:0}}>
                {INDICATIFS.map(i => (
                  <option key={i.code} value={i.code}>{i.flag} {i.code}</option>
                ))}
              </select>
              <input type="tel" placeholder="780 000 000" value={form.whatsapp}
                onChange={e => setForm({...form, whatsapp: e.target.value})}
                style={{flex:1, padding:'11px 14px', border:'1px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem', outline:'none', background:'#fafaf9', color:'#111a14'}} />
            </div>
          </>
        )}

        {/* CACHER NUMERO */}
        <label style={{display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer', padding:'12px', background:'#f5f7f5', borderRadius:'9px', border:'1px solid #e8ede9', marginBottom:'16px'}}>
          <input type="checkbox" checked={form.hide_phone} onChange={e => setForm({...form, hide_phone: e.target.checked, phone: e.target.checked ? '' : form.phone})}
            style={{width:'16px', height:'16px', accentColor:'#1a7a4a', cursor:'pointer', marginTop:'2px'}} />
          <div>
            <div style={{fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.85rem', color:'#111a14'}}>🔒 Cacher mon numéro de téléphone</div>
            <div style={{fontSize:'0.72rem', color:'#6b7c6e', marginTop:'2px'}}>Les acheteurs pourront me contacter uniquement via la messagerie SokoDeal</div>
          </div>
        </label>

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
              <p style={{fontSize:'0.75rem', color:'#6b7c6e', marginBottom:'8px'}}>Cliquez sur une photo pour la mettre en première position</p>
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
                      style={{width:'76px', height:'76px', objectFit:'cover', borderRadius:'9px', border: i === 0 ? '2.5px solid #1a7a4a' : '2px solid #e8ede9'}}
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
          width:'100%', padding:'13px', background: loading ? '#ccc' : '#1a7a4a', border:'none',
          borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
          fontSize:'0.95rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer', marginBottom:'12px'
        }}>{loading ? '⏳ Publication...' : 'Publier mon annonce'}</button>

        <a href="/" style={{display:'block', textAlign:'center', color:'#6b7c6e', fontSize:'0.82rem', textDecoration:'none'}}>
          ← Retour à l'accueil
        </a>
      </div>
    </div>
  )
}