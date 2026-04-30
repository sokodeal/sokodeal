'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function VerificationPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docPreview, setDocPreview] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [step, setStep] = useState<'upload' | 'verifying' | 'success' | 'failed'>('upload')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth?mode=login'; return }
      setUser(user)

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(userData)

      if (userData?.is_verified) {
        setStep('success')
      }

      setLoading(false)
    }
    init()
  }, [])

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocFile(file)
    const reader = new FileReader()
    reader.onload = () => setDocPreview(reader.result as string)
    reader.readAsDataURL(file)
    setMsg('')
    setResult(null)
  }

  const handleVerify = async () => {
    if (!docFile || !user) return
    setVerifying(true)
    setStep('verifying')

    try {
      // Upload du document
      const ext = docFile.name.split('.').pop()
      const path = `identity/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('ads-images')
        .upload(path, docFile)

      if (uploadError) {
        setMsg('Erreur upload : ' + uploadError.message)
        setStep('upload')
        setVerifying(false)
        return
      }

      const { data: urlData } = supabase.storage.from('ads-images').getPublicUrl(path)
      const docUrl = urlData.publicUrl

      // Convertir l'image en base64 pour l'API
      const base64 = docPreview?.split(',')[1]
      if (!base64) {
        setMsg('Erreur lecture image')
        setStep('upload')
        setVerifying(false)
        return
      }

      // Appel API Anthropic pour lire le document
      const response = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: docFile.type,
          userName: profile?.full_name || '',
        })
      })

      const data = await response.json()

      if (data.verified) {
        // Marquer comme verifie dans Supabase
        await supabase.from('users').update({
          is_verified: true,
          id_document_url: docUrl,
          id_verification_status: 'verified',
        }).eq('id', user.id)

        setStep('success')
      } else {
        await supabase.from('users').update({
          id_document_url: docUrl,
          id_verification_status: 'failed',
        }).eq('id', user.id)

        setResult(data)
        setStep('failed')
      }
    } catch (err) {
      setMsg('Erreur inattendue. Reessayez.')
      setStep('upload')
    }

    setVerifying(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f7f5'}}>
      <p style={{fontFamily:'Syne,sans-serif', color:'#1a7a4a', fontWeight:700}}>Chargement...</p>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f5f7f5'}}>

      <header style={{background:'white', borderBottom:'1px solid #e8ede9', position:'sticky', top:0, zIndex:100}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 5%', height:'58px', maxWidth:'800px', margin:'0 auto'}}>
          <a href="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
            <div style={{width:'32px', height:'32px', background:'#f5a623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>🦁</div>
            <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#111a14'}}>Soko<span style={{color:'#1a7a4a'}}>Deal</span></span>
          </a>
          <a href="/profil" style={{padding:'7px 14px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'8px', color:'#111a14', fontFamily:'DM Sans,sans-serif', fontSize:'0.85rem', textDecoration:'none'}}>
            Mon compte
          </a>
        </div>
      </header>

      <div style={{maxWidth:'560px', margin:'32px auto', padding:'0 5% 60px'}}>

        {/* ETAPES */}
        <div style={{display:'flex', alignItems:'center', gap:'0', marginBottom:'28px'}}>
          {['Document', 'Verification', 'Confirme'].map((label, i) => {
            const stepIndex = step === 'upload' ? 0 : step === 'verifying' ? 1 : 2
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <div key={i} style={{display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none'}}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}}>
                  <div style={{width:'32px', height:'32px', borderRadius:'50%', background: done ? '#1a7a4a' : active ? '#f5a623' : '#e8ede9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:800, color: done || active ? 'white' : '#6b7c6e'}}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{fontSize:'0.68rem', color: active ? '#111a14' : '#6b7c6e', fontWeight: active ? 700 : 400, whiteSpace:'nowrap'}}>{label}</span>
                </div>
                {i < 2 && <div style={{flex:1, height:'2px', background: done ? '#1a7a4a' : '#e8ede9', margin:'0 8px', marginBottom:'18px'}} />}
              </div>
            )
          })}
        </div>

        {/* STEP: SUCCESS */}
        {step === 'success' && (
          <div style={{background:'white', borderRadius:'16px', padding:'40px', border:'1px solid #e8ede9', textAlign:'center'}}>
            <div style={{width:'72px', height:'72px', background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 16px'}}>✅</div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', marginBottom:'8px', color:'#111a14'}}>
              Identite verifiee !
            </h2>
            <p style={{color:'#6b7c6e', marginBottom:'24px', fontSize:'0.88rem', lineHeight:1.6}}>
              Votre compte est maintenant verifie. Le badge ✅ apparait sur votre profil et vous pouvez publier des annonces.
            </p>
            <button onClick={() => window.location.href='/publier'} style={{width:'100%', padding:'13px', background:'#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', cursor:'pointer', marginBottom:'10px'}}>
              Publier une annonce
            </button>
            <button onClick={() => window.location.href='/profil'} style={{width:'100%', padding:'13px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.88rem', color:'#6b7c6e', cursor:'pointer'}}>
              Mon profil
            </button>
          </div>
        )}

        {/* STEP: FAILED */}
        {step === 'failed' && (
          <div style={{background:'white', borderRadius:'16px', padding:'40px', border:'1px solid #ffd6d6', textAlign:'center'}}>
            <div style={{width:'72px', height:'72px', background:'#fff1f0', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 16px'}}>❌</div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px', color:'#111a14'}}>
              Verification echouee
            </h2>
            <p style={{color:'#6b7c6e', marginBottom:'16px', fontSize:'0.88rem', lineHeight:1.6}}>
              {result?.reason || 'Le nom sur le document ne correspond pas au nom de votre profil.'}
            </p>
            <div style={{background:'#fff1f0', borderRadius:'10px', padding:'14px', marginBottom:'20px', border:'1px solid #ffd6d6', textAlign:'left'}}>
              <p style={{fontSize:'0.82rem', color:'#c0392b', marginBottom:'6px', fontWeight:600}}>Raisons possibles :</p>
              <div style={{fontSize:'0.78rem', color:'#c0392b'}}>
                <div>• Le nom sur votre profil ne correspond pas exactement au document</div>
                <div>• Le document est illisible ou mal cadre</div>
                <div>• Le document n est pas un document d identite valide</div>
              </div>
            </div>
            <button onClick={() => { setStep('upload'); setDocFile(null); setDocPreview(null); setResult(null) }}
              style={{width:'100%', padding:'13px', background:'#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', cursor:'pointer', marginBottom:'10px'}}>
              Reessayer
            </button>
            <a href="/profil" style={{display:'block', padding:'13px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.88rem', color:'#6b7c6e', textDecoration:'none', textAlign:'center'}}>
              Modifier mon nom de profil
            </a>
          </div>
        )}

        {/* STEP: VERIFYING */}
        {step === 'verifying' && (
          <div style={{background:'white', borderRadius:'16px', padding:'48px', border:'1px solid #e8ede9', textAlign:'center'}}>
            <div style={{width:'64px', height:'64px', background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', margin:'0 auto 16px'}}>
              🔍
            </div>
            <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'8px', color:'#111a14'}}>
              Verification en cours...
            </h2>
            <p style={{color:'#6b7c6e', fontSize:'0.88rem', lineHeight:1.6}}>
              Claude analyse votre document et compare le nom avec votre profil. Cela prend quelques secondes.
            </p>
            <div style={{marginTop:'24px', display:'flex', justifyContent:'center', gap:'8px'}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:'10px', height:'10px', background:'#1a7a4a', borderRadius:'50%', animation:`bounce 1s ease-in-out ${i * 0.2}s infinite`}} />
              ))}
            </div>
            <style>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); opacity: 0.4; }
                50% { transform: translateY(-8px); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {/* STEP: UPLOAD */}
        {step === 'upload' && (
          <div>
            <div style={{background:'white', borderRadius:'16px', padding:'28px', border:'1px solid #e8ede9', marginBottom:'14px'}}>
              <h1 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'6px', color:'#111a14'}}>
                Verification d identite
              </h1>
              <p style={{color:'#6b7c6e', fontSize:'0.85rem', lineHeight:1.6, marginBottom:'20px'}}>
                Pour publier des annonces sur SokoDeal, vous devez verifier votre identite. Uploadez une photo de votre CNI, passeport ou permis de conduire.
              </p>

              {/* INFO NOM */}
              <div style={{background:'#e8f5ee', borderRadius:'10px', padding:'12px 14px', marginBottom:'20px', border:'1px solid #b7dfca'}}>
                <p style={{fontSize:'0.82rem', color:'#1a7a4a', fontWeight:600, marginBottom:'3px'}}>Nom sur votre profil :</p>
                <p style={{fontSize:'0.9rem', color:'#111a14', fontWeight:800, fontFamily:'Syne,sans-serif'}}>
                  {profile?.full_name || 'Non renseigne'}
                </p>
                {!profile?.full_name && (
                  <p style={{fontSize:'0.75rem', color:'#c0392b', marginTop:'6px'}}>
                    Ajoutez votre nom complet dans votre profil avant de continuer.
                  </p>
                )}
              </div>

              {/* UPLOAD ZONE */}
              <label style={{display:'block', cursor:'pointer'}}>
                <div style={{border:'2px dashed #e8ede9', borderRadius:'12px', padding:'32px', textAlign:'center', background:'#fafaf9', transition:'border-color 0.2s'}}>
                  {docPreview ? (
                    <div>
                      <img src={docPreview} alt="Document" style={{maxWidth:'100%', maxHeight:'200px', objectFit:'contain', borderRadius:'8px', marginBottom:'12px'}} />
                      <p style={{fontSize:'0.82rem', color:'#1a7a4a', fontWeight:600}}>{docFile?.name}</p>
                      <p style={{fontSize:'0.75rem', color:'#6b7c6e', marginTop:'4px'}}>Cliquez pour changer</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{fontSize:'2.5rem', marginBottom:'12px'}}>📄</div>
                      <p style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem', color:'#111a14', marginBottom:'6px'}}>
                        Uploader votre document
                      </p>
                      <p style={{fontSize:'0.78rem', color:'#6b7c6e'}}>
                        CNI, Passeport ou Permis de conduire
                      </p>
                      <p style={{fontSize:'0.72rem', color:'#9ca3af', marginTop:'6px'}}>
                        JPG, PNG ou PDF - Max 10MB
                      </p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{display:'none'}} />
              </label>

              {msg && (
                <div style={{background:'#fff1f0', color:'#c0392b', padding:'10px', borderRadius:'8px', fontSize:'0.82rem', marginTop:'12px', border:'1px solid #ffd6d6'}}>
                  {msg}
                </div>
              )}
            </div>

            {/* CONSEILS */}
            <div style={{background:'#fffbeb', borderRadius:'12px', padding:'16px', border:'1px solid #fde68a', marginBottom:'16px'}}>
              <h3 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', marginBottom:'10px', color:'#78350f'}}>
                Conseils pour une verification reussie
              </h3>
              {[
                'Assurez-vous que le document est bien eclaire et lisible',
                'Le nom sur le document doit correspondre exactement a votre nom de profil',
                'Evitez les reflets et les zones floues',
                'Le document doit etre entier et non coupe',
              ].map((tip, i) => (
                <div key={i} style={{display:'flex', gap:'8px', marginBottom:'6px', fontSize:'0.78rem', color:'#78350f'}}>
                  <span style={{fontWeight:700, flexShrink:0}}>✓</span> {tip}
                </div>
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={!docFile || verifying || !profile?.full_name}
              style={{
                width:'100%', padding:'14px',
                background: !docFile || !profile?.full_name ? '#e8ede9' : '#1a7a4a',
                border:'none', borderRadius:'12px', fontFamily:'Syne,sans-serif', fontWeight:800,
                fontSize:'0.95rem', color: !docFile || !profile?.full_name ? '#6b7c6e' : 'white',
                cursor: !docFile || !profile?.full_name ? 'not-allowed' : 'pointer'
              }}>
              {verifying ? 'Verification...' : 'Verifier mon identite'}
            </button>

            {!profile?.full_name && (
              <button onClick={() => window.location.href='/profil'} style={{width:'100%', marginTop:'10px', padding:'12px', background:'#f5a623', border:'none', borderRadius:'12px', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem', color:'#111a14', cursor:'pointer'}}>
                Ajouter mon nom dans mon profil
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}