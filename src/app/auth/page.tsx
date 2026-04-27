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
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
        }
      }
    })
    if (error) { setMsg('❌ ' + error.message); setLoading(false); return; }
    setStep(3)
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f5233,#1a7a4a)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'20px', padding:'36px', maxWidth:'480px', width:'100%'}}>
        
        {/* Steps */}
        <div style={{display:'flex', justifyContent:'center', gap:'8px', marginBottom:'28px'}}>
          {[1,2,3].map(s => (
            <div key={s} style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background: step >= s ? '#1a7a4a' : '#e8ede9',
                color: step >= s ? 'white' : '#6b7c6e',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.9rem'
              }}>{s}</div>
              {s < 3 && <div style={{width:'40px', height:'2px', background: step > s ? '#1a7a4a' : '#e8ede9'}}></div>}
            </div>
          ))}
        </div>

        <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', marginBottom:'4px'}}>
          {step === 1 && '👤 Informations personnelles'}
          {step === 2 && '🪪 Vérification d\'identité'}
          {step === 3 && '✅ Compte créé !'}
        </h1>
        <p style={{color:'#6b7c6e', fontSize:'0.88rem', marginBottom:'24px'}}>
          {step === 1 && 'Créez votre compte SokoDeal'}
          {step === 2 && 'Obligatoire pour publier des annonces'}
          {step === 3 && 'Vérifiez votre email pour confirmer'}
        </p>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            {['fullName','email','phone','password'].map((field, i) => (
              <input key={field}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                placeholder={['Prénom & Nom', 'Email', 'Téléphone (+250...)', 'Mot de passe'][i]}
                value={(form as any)[field]}
                onChange={e => setForm({...form, [field]: e.target.value})}
                style={{
                  width:'100%', padding:'11px 14px', border:'1.5px solid #e8ede9',
                  borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem',
                  outline:'none', background:'#faf7f2', marginBottom:'12px', display:'block'
                }}
              />
            ))}
            <button onClick={() => setStep(2)} style={{
              width:'100%', padding:'13px', background:'#1a7a4a', border:'none',
              borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
              fontSize:'1rem', color:'white', cursor:'pointer'
            }}>Continuer →</button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div style={{background:'#fff8e1', borderLeft:'3px solid #f5a623', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px', fontSize:'0.83rem'}}>
              🔒 Vos documents sont chiffrés et sécurisés. Requis pour vérifier votre identité et protéger les acheteurs.
            </div>

            <select
              value={form.idType}
              onChange={e => setForm({...form, idType: e.target.value})}
              style={{width:'100%', padding:'11px 14px', border:'1.5px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', outline:'none', background:'#faf7f2', marginBottom:'12px'}}
            >
              <option value="">— Type de document —</option>
              <option value="indangamuntu">🇷🇼 Indangamuntu (Carte Nationale)</option>
              <option value="passeport">🌍 Passeport</option>
              <option value="permis">🪪 Permis de conduire</option>
            </select>

            <input
              type="text"
              placeholder="Numéro du document"
              value={form.idNumber}
              onChange={e => setForm({...form, idNumber: e.target.value})}
              style={{width:'100%', padding:'11px 14px', border:'1.5px solid #e8ede9', borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem', outline:'none', background:'#faf7f2', marginBottom:'12px', display:'block'}}
            />

            <div style={{marginBottom:'12px'}}>
              <label style={{display:'block', fontSize:'0.82rem', fontWeight:600, marginBottom:'6px'}}>📸 Recto de la pièce d'identité</label>
              <input type="file" accept="image/*,.pdf"
                onChange={e => setForm({...form, idFront: e.target.files?.[0] || null})}
                style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#faf7f2'}}
              />
            </div>

            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block', fontSize:'0.82rem', fontWeight:600, marginBottom:'6px'}}>📸 Verso de la pièce d'identité</label>
              <input type="file" accept="image/*,.pdf"
                onChange={e => setForm({...form, idBack: e.target.files?.[0] || null})}
                style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#faf7f2'}}
              />
            </div>

            {msg && <p style={{color:'red', fontSize:'0.85rem', marginBottom:'12px'}}>{msg}</p>}

            <button onClick={handleSignup} disabled={loading} style={{
              width:'100%', padding:'13px', background: loading ? '#ccc' : '#1a7a4a', border:'none',
              borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800,
              fontSize:'1rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer'
            }}>{loading ? '⏳ Création...' : '🚀 Créer mon compte'}</button>

            <button onClick={() => setStep(1)} style={{width:'100%', padding:'11px', background:'transparent', border:'1.5px solid #e8ede9', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:'0.9rem', color:'#6b7c6e', cursor:'pointer', marginTop:'10px'}}>← Retour</button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'4rem', marginBottom:'16px'}}>🎉</div>
            <p style={{fontSize:'0.95rem', lineHeight:1.7, color:'#111a14', marginBottom:'24px'}}>
              Votre compte a été créé ! <br/>
              Vérifiez votre email <strong>{form.email}</strong> pour confirmer votre inscription.
            </p>
            <a href="/" style={{display:'block', padding:'13px', background:'#1a7a4a', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white', textDecoration:'none'}}>
              Aller sur SokoDeal →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}