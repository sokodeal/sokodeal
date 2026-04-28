'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    idType: '', idNumber: '', idFront: null as File | null, idBack: null as File | null
  })
  const [msg, setMsg] = useState('')

  const handleSignup = async () => {
    if (!form.fullName) { setMsg('❌ Le nom est obligatoire'); return }
    if (!form.email) { setMsg('❌ L\'email est obligatoire'); return }
    if (!form.phone || form.phone.length < 9) { setMsg('❌ Numéro de téléphone invalide'); return }
    if (!form.password || form.password.length < 8) { setMsg('❌ Mot de passe trop court (minimum 8 caractères)'); return }
    if (!form.idType) { setMsg('❌ Choisissez un type de document'); return }
    if (!form.idNumber) { setMsg('❌ Le numéro du document est obligatoire'); return }
    if (!form.idFront) { setMsg('❌ Téléversez le recto de votre pièce d\'identité'); return }
    if (!form.idBack) { setMsg('❌ Téléversez le verso de votre pièce d\'identité'); return }
    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } }
    })
    if (error) { setMsg('❌ ' + error.message); setLoading(false); return }
    setStep(3)
    setLoading(false)
  }

  const inp = {
    width:'100%', padding:'11px 14px', border:'1.5px solid #e8ede9',
    borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem',
    outline:'none', background:'#faf7f2', marginBottom:'12px', display:'block'
  } as React.CSSProperties

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f5233,#1a7a4a)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'20px', padding:'36px', maxWidth:'480px', width:'100%'}}>

        <div style={{textAlign:'center', marginBottom:'20px'}}>
          <a href="/" style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.6rem', color:'#111a14', textDecoration:'none'}}>
            🦁 Soko<span style={{color:'#1a7a4a'}}>Deal</span>
          </a>
        </div>

        <div style={{display:'flex', justifyContent:'center', gap:'8px', marginBottom:'28px'}}>
          {[1,2,3].map(s => (
            <div key={s} style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background: step >= s ? '#1a7a4a' : '#e8ede9',
                color: step >= s ? 'white' : '#6b7c6e',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.9rem'
              }}>{step > s ? '✓' : s}</div>
              {s < 3 && <div style={{width:'40px', height:'2px', background: step > s ? '#1a7a4a' : '#e8ede9'}}></div>}
            </div>
          ))}
        </div>

        <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', marginBottom:'4px'}}>
          {step === 1 && '👤 Informations personnelles'}
          {step === 2 && '🪪 Vérification d\'identité'}
          {step === 3 && '✅ Compte créé !'}
        </h1>
        <p style={{color:'#6b7c6e', fontSize:'0.85rem', marginBottom:'20px'}}>
          {step === 1 && 'Tous les champs sont obligatoires'}
          {step === 2 && 'Obligatoire pour publier des annonces'}
          {step === 3 && 'Vérifiez votre email pour confirmer'}
        </p>

        {step === 1 && (
          <>
            <input type="text" placeholder="Prénom & Nom *" value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})} style={inp}/>
            <input type="email" placeholder="Email *" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} style={inp}/>
            <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
              <div style={{padding:'11px 12px', border:'1.5px solid #e8ede9', borderRadius:'9px', background:'#faf7f2', fontWeight:600, fontSize:'0.9rem', whiteSpace:'nowrap'}}>
                🇷🇼 +250
              </div>
              <input type="tel" placeholder="Téléphone * (ex: 780000000)" value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                style={{...inp, marginBottom:'0', flex:1}}/>
            </div>
            <input type="password" placeholder="Mot de passe * (min. 8 caractères)" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} style={inp}/>
            {msg && <p style={{color:'red', fontSize:'0.83rem', marginBottom:'12px', background:'#fce4ec', padding:'10px', borderRadius:'8px'}}>{msg}</p>}
            <button onClick={() => {
              if (!form.fullName) { setMsg('❌ Le nom est obligatoire'); return }
              if (!form.email) { setMsg('❌ L\'email est obligatoire'); return }
              if (!form.phone || form.phone.length < 9) { setMsg('❌ Numéro de téléphone invalide'); return }
              if (!form.password || form.password.length < 8) { setMsg('❌ Mot de passe trop court'); return }
              setMsg(''); setStep(2)
            }} style={{width:'100%', padding:'13px', background:'#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white', cursor:'pointer'}}>
              Continuer →
            </button>
            <p style={{textAlign:'center', marginTop:'16px', fontSize:'0.85rem', color:'#6b7c6e'}}>
              Déjà un compte ? <a href="/" style={{color:'#1a7a4a', fontWeight:600}}>Retour à l'accueil</a>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{background:'#fff8e1', borderLeft:'3px solid #f5a623', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px', fontSize:'0.83rem', lineHeight:'1.6'}}>
              🔒 Vos documents sont chiffrés et sécurisés. La vérification protège les acheteurs contre les arnaques.
            </div>
            <select value={form.idType} onChange={e => setForm({...form, idType: e.target.value})}
              style={{...inp, cursor:'pointer'}}>
              <option value="">— Type de document * —</option>
              <option value="indangamuntu">🇷🇼 Indangamuntu (Carte Nationale)</option>
              <option value="passeport">🌍 Passeport</option>
              <option value="permis">🪪 Permis de conduire</option>
            </select>
            <input type="text" placeholder="Numéro du document *" value={form.idNumber}
              onChange={e => setForm({...form, idNumber: e.target.value})} style={inp}/>
            <div style={{marginBottom:'12px'}}>
              <label style={{display:'block', fontSize:'0.82rem', fontWeight:600, marginBottom:'6px'}}>
                📸 Recto de la pièce d'identité *
              </label>
              <input type="file" accept="image/*,.pdf"
                onChange={e => setForm({...form, idFront: e.target.files?.[0] || null})}
                style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#faf7f2'}}
              />
              {form.idFront && <p style={{color:'#1a7a4a', fontSize:'0.78rem', marginTop:'4px'}}>✅ {form.idFront.name}</p>}
            </div>
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block', fontSize:'0.82rem', fontWeight:600, marginBottom:'6px'}}>
                📸 Verso de la pièce d'identité *
              </label>
              <input type="file" accept="image/*,.pdf"
                onChange={e => setForm({...form, idBack: e.target.files?.[0] || null})}
                style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#faf7f2'}}
              />
              {form.idBack && <p style={{color:'#1a7a4a', fontSize:'0.78rem', marginTop:'4px'}}>✅ {form.idBack.name}</p>}
            </div>
            {msg && <p style={{color:'red', fontSize:'0.83rem', marginBottom:'12px', background:'#fce4ec', padding:'10px', borderRadius:'8px'}}>{msg}</p>}
            <button onClick={handleSignup} disabled={loading} style={{
              width:'100%', padding:'13px',
              background: loading ? '#ccc' : '#1a7a4a', border:'none',
              borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
              fontSize:'1rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer'
            }}>{loading ? '⏳ Création en cours...' : '🚀 Créer mon compte'}</button>
            <button onClick={() => { setMsg(''); setStep(1) }} style={{
              width:'100%', padding:'11px', background:'transparent',
              border:'1.5px solid #e8ede9', borderRadius:'10px',
              fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:'0.9rem',
              color:'#6b7c6e', cursor:'pointer', marginTop:'10px'
            }}>← Retour</button>
          </>
        )}

        {step === 3 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'4rem', marginBottom:'16px'}}>🎉</div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'12px'}}>Bienvenue sur SokoDeal !</h2>
            <p style={{fontSize:'0.92rem', lineHeight:1.7, color:'#111a14', marginBottom:'8px'}}>
              Un email de confirmation a été envoyé à<br/>
              <strong>{form.email}</strong>
            </p>
            <p style={{fontSize:'0.85rem', color:'#6b7c6e', marginBottom:'24px'}}>
              Confirmez votre email puis publiez vos annonces.
            </p>
            <a href="/" style={{
              display:'block', padding:'13px', background:'#1a7a4a',
              borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
              fontSize:'1rem', color:'white', textDecoration:'none'
            }}>🦁 Aller sur SokoDeal →</a>
          </div>
        )}

      </div>
    </div>
  )
}