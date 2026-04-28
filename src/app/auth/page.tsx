'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    idType: '', idNumber: '', idFront: null as File | null, idBack: null as File | null
  })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') setMode('signup')
    else setMode('login')
  }, [])

  const handleLogin = async () => {
    if (!form.email || !form.password) { setMsg('❌ Email et mot de passe obligatoires'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setMsg('❌ ' + error.message); setLoading(false); return }
    window.location.href = '/'
  }

  const handleSignup = async () => {
    if (!form.fullName) { setMsg('❌ Le nom est obligatoire'); return }
    if (!form.email) { setMsg('❌ L email est obligatoire'); return }
    if (!form.phone || form.phone.length < 9) { setMsg('❌ Numero de telephone invalide'); return }
    if (!form.password || form.password.length < 8) { setMsg('❌ Mot de passe trop court'); return }
    if (!form.idType) { setMsg('❌ Choisissez un type de document'); return }
    if (!form.idNumber) { setMsg('❌ Le numero du document est obligatoire'); return }
    if (!form.idFront) { setMsg('❌ Telechargez le recto de votre piece'); return }
    if (!form.idBack) { setMsg('❌ Telechargez le verso de votre piece'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } }
    })
    if (error) { setMsg('❌ ' + error.message); setLoading(false); return }
    setStep(3); setLoading(false)
  }

  const inp = {
    width:'100%', padding:'11px 14px', border:'1.5px solid #e8ede9',
    borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem',
    outline:'none', background:'#faf7f2', marginBottom:'12px', display:'block',
    boxSizing:'border-box' as const
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0f5233,#1a7a4a)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
      <div style={{background:'white', borderRadius:'20px', padding:'28px', maxWidth:'480px', width:'100%'}}>

        <div style={{textAlign:'center', marginBottom:'20px'}}>
          <a href="/" style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#111a14', textDecoration:'none'}}>
            🦁 Soko<span style={{color:'#1a7a4a'}}>Deal</span>
          </a>
        </div>

        {/* TABS */}
        <div style={{display:'flex', background:'#f0f0f0', borderRadius:'10px', padding:'4px', marginBottom:'20px'}}>
          {(['login','signup'] as const).map((m, i) => (
            <button key={m} onClick={() => { setMode(m); setMsg(''); setStep(1) }} style={{
              flex:1, padding:'10px', border:'none', borderRadius:'8px', cursor:'pointer',
              fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem',
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? '#1a7a4a' : '#6b7c6e',
              boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition:'all 0.2s'
            }}>{i === 0 ? 'Se connecter' : 'Creer un compte'}</button>
          ))}
        </div>

        {/* LOGIN */}
        {mode === 'login' && (
          <>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.15rem', marginBottom:'4px'}}>
              👋 Bon retour !
            </h2>
            <p style={{color:'#6b7c6e', fontSize:'0.82rem', marginBottom:'18px'}}>
              Connectez-vous a votre compte SokoDeal
            </p>
            <input type="email" placeholder="Email *" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} style={inp}/>
            <input type="password" placeholder="Mot de passe *" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inp}/>
            {msg && <p style={{color:'red', fontSize:'0.8rem', marginBottom:'12px', background:'#fce4ec', padding:'10px', borderRadius:'8px'}}>{msg}</p>}
            <button onClick={handleLogin} disabled={loading} style={{
              width:'100%', padding:'13px', background: loading ? '#ccc' : '#1a7a4a',
              border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif',
              fontWeight:800, fontSize:'1rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer'
            }}>{loading ? '⏳ Connexion...' : '🚀 Se connecter'}</button>
            <p style={{textAlign:'center', marginTop:'14px', fontSize:'0.82rem', color:'#6b7c6e'}}>
              Pas encore de compte ?{' '}
              <button onClick={() => { setMode('signup'); setMsg('') }} style={{background:'none', border:'none', color:'#1a7a4a', fontWeight:600, cursor:'pointer', fontSize:'0.82rem'}}>
                Creer un compte
              </button>
            </p>
          </>
        )}

        {/* SIGNUP */}
        {mode === 'signup' && (
          <>
            {/* STEPPER */}
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', marginBottom:'18px'}}>
              {[1,2,3].map(s => (
                <div key={s} style={{display:'flex', alignItems:'center', gap:'6px'}}>
                  <div style={{
                    width:'30px', height:'30px', borderRadius:'50%',
                    background: step >= s ? '#1a7a4a' : '#e8ede9',
                    color: step >= s ? 'white' : '#6b7c6e',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.8rem',
                    flexShrink:0
                  }}>{step > s ? '✓' : s}</div>
                  {s < 3 && <div style={{width:'24px', height:'2px', background: step > s ? '#1a7a4a' : '#e8ede9'}}/>}
                </div>
              ))}
            </div>

            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'4px'}}>
              {step === 1 && '👤 Informations personnelles'}
              {step === 2 && '🪪 Verification d identite'}
              {step === 3 && '✅ Compte cree !'}
            </h2>
            <p style={{color:'#6b7c6e', fontSize:'0.8rem', marginBottom:'16px'}}>
              {step === 1 && 'Tous les champs sont obligatoires'}
              {step === 2 && 'Obligatoire pour publier des annonces'}
              {step === 3 && 'Verifiez votre email pour confirmer'}
            </p>

            {step === 1 && (
              <>
                <input type="text" placeholder="Prenom et Nom *" value={form.fullName}
                  onChange={e => setForm({...form, fullName: e.target.value})} style={inp}/>
                <input type="email" placeholder="Email *" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} style={inp}/>
                <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
                  <div style={{padding:'11px 12px', border:'1.5px solid #e8ede9', borderRadius:'9px', background:'#faf7f2', fontWeight:600, fontSize:'0.88rem', whiteSpace:'nowrap', flexShrink:0}}>
                    🇷🇼 +250
                  </div>
                  <input type="tel" placeholder="780 000 000 *" value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    style={{...inp, marginBottom:'0', flex:1}}/>
                </div>
                <input type="password" placeholder="Mot de passe * (min. 8 caracteres)" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} style={inp}/>
                {msg && <p style={{color:'red', fontSize:'0.8rem', marginBottom:'12px', background:'#fce4ec', padding:'10px', borderRadius:'8px'}}>{msg}</p>}
                <button onClick={() => {
                  if (!form.fullName) { setMsg('❌ Le nom est obligatoire'); return }
                  if (!form.email) { setMsg('❌ L email est obligatoire'); return }
                  if (!form.phone || form.phone.length < 9) { setMsg('❌ Numero invalide'); return }
                  if (!form.password || form.password.length < 8) { setMsg('❌ Mot de passe trop court'); return }
                  setMsg(''); setStep(2)
                }} style={{width:'100%', padding:'13px', background:'#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white', cursor:'pointer'}}>
                  Continuer →
                </button>
                <p style={{textAlign:'center', marginTop:'14px', fontSize:'0.82rem', color:'#6b7c6e'}}>
                  Deja un compte ?{' '}
                  <button onClick={() => { setMode('login'); setMsg('') }} style={{background:'none', border:'none', color:'#1a7a4a', fontWeight:600, cursor:'pointer', fontSize:'0.82rem'}}>
                    Se connecter
                  </button>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{background:'#fff8e1', borderLeft:'3px solid #f5a623', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'0.8rem', lineHeight:'1.6'}}>
                  🔒 Vos documents sont chiffres et securises.
                </div>
                <select value={form.idType} onChange={e => setForm({...form, idType: e.target.value})}
                  style={{...inp, cursor:'pointer'}}>
                  <option value="">— Type de document * —</option>
                  <option value="indangamuntu">🇷🇼 Indangamuntu</option>
                  <option value="passeport">🌍 Passeport</option>
                  <option value="permis">🪪 Permis de conduire</option>
                </select>
                <input type="text" placeholder="Numero du document *" value={form.idNumber}
                  onChange={e => setForm({...form, idNumber: e.target.value})} style={inp}/>
                <div style={{marginBottom:'12px'}}>
                  <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'#111a14'}}>📸 Recto *</label>
                  <input type="file" accept="image/*,.pdf"
                    onChange={e => setForm({...form, idFront: e.target.files?.[0] || null})}
                    style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#faf7f2', boxSizing:'border-box'}}
                  />
                  {form.idFront && <p style={{color:'#1a7a4a', fontSize:'0.75rem', marginTop:'4px'}}>✅ {form.idFront.name}</p>}
                </div>
                <div style={{marginBottom:'14px'}}>
                  <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'#111a14'}}>📸 Verso *</label>
                  <input type="file" accept="image/*,.pdf"
                    onChange={e => setForm({...form, idBack: e.target.files?.[0] || null})}
                    style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#faf7f2', boxSizing:'border-box'}}
                  />
                  {form.idBack && <p style={{color:'#1a7a4a', fontSize:'0.75rem', marginTop:'4px'}}>✅ {form.idBack.name}</p>}
                </div>
                {msg && <p style={{color:'red', fontSize:'0.8rem', marginBottom:'12px', background:'#fce4ec', padding:'10px', borderRadius:'8px'}}>{msg}</p>}
                <button onClick={handleSignup} disabled={loading} style={{
                  width:'100%', padding:'13px', background: loading ? '#ccc' : '#1a7a4a',
                  border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif',
                  fontWeight:800, fontSize:'1rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer'
                }}>{loading ? '⏳ Creation...' : '🚀 Creer mon compte'}</button>
                <button onClick={() => { setMsg(''); setStep(1) }} style={{
                  width:'100%', padding:'11px', background:'transparent', border:'1.5px solid #e8ede9',
                  borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:600,
                  fontSize:'0.88rem', color:'#6b7c6e', cursor:'pointer', marginTop:'10px'
                }}>← Retour</button>
              </>
            )}

            {step === 3 && (
              <div style={{textAlign:'center', padding:'10px 0'}}>
                <div style={{fontSize:'4rem', marginBottom:'16px'}}>🎉</div>
                <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:'12px'}}>Bienvenue !</h2>
                <p style={{fontSize:'0.88rem', lineHeight:1.7, color:'#111a14', marginBottom:'24px'}}>
                  Email de confirmation envoye a<br/><strong>{form.email}</strong>
                </p>
                <a href="/" style={{display:'block', padding:'13px', background:'#1a7a4a', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'white', textDecoration:'none'}}>
                  🦁 Aller sur SokoDeal
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}