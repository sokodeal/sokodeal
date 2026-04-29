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
    if (!form.email || !form.password) { setMsg('Email et mot de passe obligatoires'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setMsg(error.message); setLoading(false); return }
    window.location.href = '/'
  }

  const handleSignup = async () => {
    if (!form.fullName) { setMsg('Le nom est obligatoire'); return }
    if (!form.email) { setMsg('L email est obligatoire'); return }
    if (!form.phone || form.phone.length < 9) { setMsg('Numero de telephone invalide'); return }
    if (!form.password || form.password.length < 8) { setMsg('Mot de passe trop court (min 8 caracteres)'); return }
    if (!form.idType) { setMsg('Choisissez un type de document'); return }
    if (!form.idNumber) { setMsg('Le numero du document est obligatoire'); return }
    if (!form.idFront) { setMsg('Telechargez le recto de votre piece'); return }
    if (!form.idBack) { setMsg('Telechargez le verso de votre piece'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } }
    })
    if (error) { setMsg(error.message); setLoading(false); return }
    setStep(3); setLoading(false)
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:'1px solid #e8ede9',
    borderRadius:'9px', fontFamily:'DM Sans,sans-serif', fontSize:'0.92rem',
    outline:'none', background:'#fafaf9', marginBottom:'12px', display:'block',
    boxSizing:'border-box', color:'#111a14'
  }

  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
      <div style={{width:'100%', maxWidth:'440px'}}>

        {/* LOGO */}
        <div style={{textAlign:'center', marginBottom:'28px'}}>
          <a href="/" style={{display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
            <div style={{width:'38px', height:'38px', background:'#f5a623', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'19px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
          </a>
        </div>

        {/* CARD */}
        <div style={{background:'white', borderRadius:'16px', padding:'28px', border:'1px solid #e8ede9', boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>

          {/* TABS */}
          <div style={{display:'flex', background:'#f5f7f5', borderRadius:'10px', padding:'4px', marginBottom:'24px', border:'1px solid #e8ede9'}}>
            {(['login','signup'] as const).map((m, i) => (
              <button key={m} onClick={() => { setMode(m); setMsg(''); setStep(1) }} style={{
                flex:1, padding:'9px', border:'none', borderRadius:'8px', cursor:'pointer',
                fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? '#111a14' : '#6b7c6e',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition:'all 0.2s'
              }}>{i === 0 ? 'Se connecter' : 'Creer un compte'}</button>
            ))}
          </div>

          {/* LOGIN */}
          {mode === 'login' && (
            <>
              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.15rem', marginBottom:'4px', color:'#111a14'}}>
                Bon retour 👋
              </h2>
              <p style={{color:'#6b7c6e', fontSize:'0.82rem', marginBottom:'20px'}}>
                Connectez-vous a votre compte SokoDeal
              </p>
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} style={inp}/>
              <input type="password" placeholder="Mot de passe" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inp}/>
              {msg && (
                <div style={{background:'#fff1f0', border:'1px solid #ffd6d6', color:'#c0392b', padding:'10px 14px', borderRadius:'8px', fontSize:'0.82rem', marginBottom:'14px'}}>
                  {msg}
                </div>
              )}
              <button onClick={handleLogin} disabled={loading} style={{
                width:'100%', padding:'12px', background: loading ? '#ccc' : '#1a7a4a',
                border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif',
                fontWeight:800, fontSize:'0.95rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom:'14px'
              }}>{loading ? '⏳ Connexion...' : 'Se connecter'}</button>
              <p style={{textAlign:'center', fontSize:'0.82rem', color:'#6b7c6e'}}>
                Pas encore de compte ?{' '}
                <button onClick={() => { setMode('signup'); setMsg('') }} style={{background:'none', border:'none', color:'#1a7a4a', fontWeight:700, cursor:'pointer', fontSize:'0.82rem', textDecoration:'underline'}}>
                  Creer un compte
                </button>
              </p>
            </>
          )}

          {/* SIGNUP */}
          {mode === 'signup' && (
            <>
              {/* STEPPER */}
              <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', marginBottom:'20px'}}>
                {[1,2,3].map(s => (
                  <div key={s} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{
                      width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
                      background: step > s ? '#1a7a4a' : step === s ? '#0f5233' : '#e8ede9',
                      color: step >= s ? 'white' : '#6b7c6e',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.78rem',
                      transition:'all 0.3s'
                    }}>{step > s ? '✓' : s}</div>
                    {s < 3 && <div style={{width:'28px', height:'2px', background: step > s ? '#1a7a4a' : '#e8ede9', borderRadius:'2px', transition:'background 0.3s'}}/>}
                  </div>
                ))}
              </div>

              <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'4px', color:'#111a14'}}>
                {step === 1 && 'Informations personnelles'}
                {step === 2 && 'Verification d identite'}
                {step === 3 && 'Compte cree !'}
              </h2>
              <p style={{color:'#6b7c6e', fontSize:'0.8rem', marginBottom:'18px'}}>
                {step === 1 && 'Tous les champs sont obligatoires'}
                {step === 2 && 'Requis pour publier des annonces'}
                {step === 3 && 'Verifiez votre email pour confirmer'}
              </p>

              {step === 1 && (
                <>
                  <input type="text" placeholder="Prenom et Nom" value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})} style={inp}/>
                  <input type="email" placeholder="Email" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} style={inp}/>
                  <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
                    <div style={{padding:'11px 12px', border:'1px solid #e8ede9', borderRadius:'9px', background:'#fafaf9', fontWeight:600, fontSize:'0.88rem', whiteSpace:'nowrap', flexShrink:0, color:'#111a14'}}>
                      🇷🇼 +250
                    </div>
                    <input type="tel" placeholder="780 000 000" value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      style={{...inp, marginBottom:'0', flex:1}}/>
                  </div>
                  <input type="password" placeholder="Mot de passe (min. 8 caracteres)" value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} style={inp}/>
                  {msg && (
                    <div style={{background:'#fff1f0', border:'1px solid #ffd6d6', color:'#c0392b', padding:'10px 14px', borderRadius:'8px', fontSize:'0.82rem', marginBottom:'14px'}}>
                      {msg}
                    </div>
                  )}
                  <button onClick={() => {
                    if (!form.fullName) { setMsg('Le nom est obligatoire'); return }
                    if (!form.email) { setMsg('L email est obligatoire'); return }
                    if (!form.phone || form.phone.length < 9) { setMsg('Numero invalide'); return }
                    if (!form.password || form.password.length < 8) { setMsg('Mot de passe trop court'); return }
                    setMsg(''); setStep(2)
                  }} style={{width:'100%', padding:'12px', background:'#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', cursor:'pointer', marginBottom:'14px'}}>
                    Continuer →
                  </button>
                  <p style={{textAlign:'center', fontSize:'0.82rem', color:'#6b7c6e'}}>
                    Deja un compte ?{' '}
                    <button onClick={() => { setMode('login'); setMsg('') }} style={{background:'none', border:'none', color:'#1a7a4a', fontWeight:700, cursor:'pointer', fontSize:'0.82rem', textDecoration:'underline'}}>
                      Se connecter
                    </button>
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <div style={{background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'9px', padding:'11px 14px', marginBottom:'16px', fontSize:'0.8rem', color:'#78350f', lineHeight:1.6}}>
                    🔒 Vos documents sont chiffres et securises.
                  </div>
                  <select value={form.idType} onChange={e => setForm({...form, idType: e.target.value})}
                    style={{...inp, cursor:'pointer'}}>
                    <option value="">Type de document</option>
                    <option value="indangamuntu">🇷🇼 Indangamuntu</option>
                    <option value="passeport">🌍 Passeport</option>
                    <option value="permis">🪪 Permis de conduire</option>
                  </select>
                  <input type="text" placeholder="Numero du document" value={form.idNumber}
                    onChange={e => setForm({...form, idNumber: e.target.value})} style={inp}/>
                  <div style={{marginBottom:'12px'}}>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'#6b7c6e'}}>Recto du document</label>
                    <input type="file" accept="image/*,.pdf"
                      onChange={e => setForm({...form, idFront: e.target.files?.[0] || null})}
                      style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#fafaf9', boxSizing:'border-box', cursor:'pointer'}}
                    />
                    {form.idFront && <p style={{color:'#1a7a4a', fontSize:'0.75rem', marginTop:'4px'}}>✅ {form.idFront.name}</p>}
                  </div>
                  <div style={{marginBottom:'14px'}}>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'#6b7c6e'}}>Verso du document</label>
                    <input type="file" accept="image/*,.pdf"
                      onChange={e => setForm({...form, idBack: e.target.files?.[0] || null})}
                      style={{width:'100%', padding:'10px', border:'1.5px dashed #e8ede9', borderRadius:'9px', background:'#fafaf9', boxSizing:'border-box', cursor:'pointer'}}
                    />
                    {form.idBack && <p style={{color:'#1a7a4a', fontSize:'0.75rem', marginTop:'4px'}}>✅ {form.idBack.name}</p>}
                  </div>
                  {msg && (
                    <div style={{background:'#fff1f0', border:'1px solid #ffd6d6', color:'#c0392b', padding:'10px 14px', borderRadius:'8px', fontSize:'0.82rem', marginBottom:'14px'}}>
                      {msg}
                    </div>
                  )}
                  <button onClick={handleSignup} disabled={loading} style={{
                    width:'100%', padding:'12px', background: loading ? '#ccc' : '#1a7a4a',
                    border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif',
                    fontWeight:800, fontSize:'0.95rem', color:'white', cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom:'10px'
                  }}>{loading ? '⏳ Creation...' : 'Creer mon compte'}</button>
                  <button onClick={() => { setMsg(''); setStep(1) }} style={{
                    width:'100%', padding:'10px', background:'transparent', border:'1px solid #e8ede9',
                    borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontWeight:600,
                    fontSize:'0.88rem', color:'#6b7c6e', cursor:'pointer'
                  }}>← Retour</button>
                </>
              )}

              {step === 3 && (
                <div style={{textAlign:'center', padding:'16px 0'}}>
                  <div style={{width:'64px', height:'64px', background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 16px'}}>
                    🎉
                  </div>
                  <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px', color:'#111a14'}}>Bienvenue !</h2>
                  <p style={{fontSize:'0.88rem', lineHeight:1.7, color:'#6b7c6e', marginBottom:'24px'}}>
                    Email de confirmation envoye a<br/><strong style={{color:'#111a14'}}>{form.email}</strong>
                  </p>
                  <a href="/" style={{display:'block', padding:'12px', background:'#1a7a4a', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', textDecoration:'none'}}>
                    Aller sur SokoDeal →
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        <p style={{textAlign:'center', marginTop:'16px', fontSize:'0.78rem', color:'#6b7c6e'}}>
          © 2025 SokoDeal · Made in Africa 🌍
        </p>
      </div>
    </div>
  )
}