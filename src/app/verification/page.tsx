'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const PUBLISH_DRAFT_KEY = 'sokodeal:publish-draft'

const PASSWORD_RULES = [
  { label: '8 caracteres minimum', test: (value: string) => value.length >= 8 },
  { label: '1 majuscule', test: (value: string) => /[A-Z]/.test(value) },
  { label: '1 minuscule', test: (value: string) => /[a-z]/.test(value) },
  { label: '1 chiffre', test: (value: string) => /\d/.test(value) },
  { label: '1 symbole', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

const validatePassword = (value: string) => {
  const missingRule = PASSWORD_RULES.find(rule => !rule.test(value))
  return missingRule ? 'Mot de passe incomplet : ajoutez ' + missingRule.label.toLowerCase() + '.' : ''
}

const readableAuthError = (message: string) => {
  const lower = message.toLowerCase()
  const waitMatch = message.match(/(\d+)\s*seconds?/i)

  if (lower.includes('security purposes') || lower.includes('rate limit')) {
    return waitMatch
      ? 'Trop de tentatives avec cet email. Attendez ' + waitMatch[1] + ' secondes puis reessayez.'
      : 'Trop de tentatives avec cet email. Attendez un peu puis reessayez.'
  }

  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Un compte existe peut-etre deja avec cet email. Essayez de vous connecter.'
  }

  if (lower.includes('password')) {
    return 'Le mot de passe ne respecte pas les regles demandees.'
  }

  return message || 'Impossible de creer le compte. Reessayez.'
}

export default function VerificationPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'account' | 'identity' | 'cgu' | 'uploading' | 'success'>('account')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Étape 1 — Compte
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  // Étape 2 — Identité
  const [nationalId, setNationalId] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docPreview, setDocPreview] = useState<string | null>(null)

  // Étape 3 — CGU
  const [acceptCGU, setAcceptCGU] = useState(false)
  const [acceptArnaque, setAcceptArnaque] = useState(false)
  const [hasPublishDraft, setHasPublishDraft] = useState(false)

  useEffect(() => {
    const init = async () => {
      const hasDraft = !!window.localStorage.getItem(PUBLISH_DRAFT_KEY)
      setHasPublishDraft(hasDraft)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Déjà connecté — vérifier si déjà vérifié
        const { data: userData } = await supabase
          .from('users')
          .select('is_verified')
          .eq('id', user.id)
          .single()
        if (userData?.is_verified) {
          if (hasDraft) {
            window.location.href = '/publier?verified=1'
            return
          }
          setStep('success')
        } else {
          // Connecté mais pas vérifié → aller à l'identité
          setUser(user)
          setStep('identity')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  // ── Vérifier disponibilité username en temps réel ──
  useEffect(() => {
    if (!username || username.length < 3) { setUsernameAvailable(null); return }
    const timer = setTimeout(async () => {
      setCheckingUsername(true)
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle()
      setUsernameAvailable(!data)
      setCheckingUsername(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  // ── Étape 1 : créer le compte ──
  const handleAccount = async () => {
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim().toLowerCase()
    const passwordError = validatePassword(password)

    if (!fullName.trim()) return setError('Le nom complet est requis.')
    if (!cleanEmail.includes('@')) return setError('Email invalide.')
    if (!cleanUsername || cleanUsername.length < 3) return setError('Username : 3 caracteres minimum.')
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) return setError('Username : lettres, chiffres et _ uniquement.')
    if (checkingUsername) return setError('Verification du username en cours. Patientez une seconde.')
    if (usernameAvailable !== true) return setError('Attendez la verification du username.')
    if (passwordError) { setPasswordTouched(true); return setError(passwordError) }

    setStep('identity')
  }

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocFile(file)
    const reader = new FileReader()
    reader.onload = () => setDocPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── Étape 2 : valider identité ──
  const handleIdentity = () => {
    setError('')
    if (!nationalId.trim()) return setError('Le numéro de carte est requis.')
    if (!docFile) return setError('Veuillez uploader une photo de votre carte.')
    setStep('cgu')
  }

  // ── Étape 3 : CGU + upload final ──
  const handleFinal = async () => {
    setError('')
    if (!acceptCGU) return setError('Vous devez accepter les CGU.')
    if (!acceptArnaque) return setError('Vous devez accepter la politique anti-arnaque.')

    setStep('uploading')
    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanUsername = username.trim().toLowerCase()
      const passwordError = validatePassword(password)

      if (!docFile) throw new Error('Veuillez uploader une photo de votre carte.')
      if (passwordError) throw new Error(passwordError)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName.trim() } }
      })
      if (authError) throw new Error(readableAuthError(authError.message))

      const userId = authData.user?.id
      if (!userId) throw new Error('Erreur creation compte. Reessayez.')

      const ext = docFile.name.split('.').pop()
      const filePath = userId + '/id-card.' + ext
      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(filePath, docFile, { upsert: true })
      if (uploadError) throw uploadError

      const { error: profileError } = await supabase.from('users').upsert({
        id: userId,
        email: cleanEmail,
        full_name: fullName.trim(),
        username: cleanUsername,
        national_id: nationalId,
        id_document_url: filePath,
        id_verification_status: 'verified',
        is_verified: true,
      })
      if (profileError) throw profileError

      setUser(authData.user)
      setStep('success')
      if (window.localStorage.getItem(PUBLISH_DRAFT_KEY)) {
        window.location.href = '/publier?verified=1'
      }
    } catch (err: any) {
      setError(err.message || 'Erreur. Reessayez.')
      setStep('cgu')
    }
  }

  const stepIndex = { account: 0, identity: 1, cgu: 2, uploading: 2, success: 3 }[step]

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e0e0e0',
    borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem',
    outline: 'none', background: '#fafafa', color: '#222', boxSizing: 'border-box',
    marginBottom: '14px', display: 'block'
  }

  const passwordError = validatePassword(password)
  const showPasswordRules = passwordTouched || password.length > 0
  const accountFormReady = !!fullName.trim()
    && email.trim().includes('@')
    && username.trim().length >= 3
    && usernameAvailable === true
    && !checkingUsername
    && !passwordError

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7f5' }}>
      <p style={{ fontFamily: 'Syne,sans-serif', color: '#1a7a4a', fontWeight: 700 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', background: '#f5a623', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🦁</div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#111a14' }}>Soko<span style={{ color: '#1a7a4a' }}>Deal</span></span>
          </a>
        </div>

        {/* Progress */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {['Compte', 'Identité', 'CGU'].map((label, i) => {
              const done = i < stepIndex
              const active = i === stepIndex
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: done ? '#1a7a4a' : active ? '#f5a623' : '#e8ede9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', fontWeight: 800,
                      color: done || active ? 'white' : '#6b7c6e'
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: active ? '#111a14' : '#6b7c6e', fontWeight: active ? 700 : 400 }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ width: '40px', height: '2px', background: done ? '#1a7a4a' : '#e8ede9', marginBottom: '14px' }} />}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e8ede9', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* ── ÉTAPE 1 : COMPTE ── */}
          {step === 'account' && (
            <>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px', color: '#111a14' }}>Créer un compte</h1>
              <p style={{ color: '#6b7c6e', fontSize: '0.82rem', marginBottom: '20px' }}>Rejoignez la marketplace du Rwanda</p>

              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7c6e', marginBottom: '5px', textTransform: 'uppercase' }}>Nom complet</label>
              <input type="text" placeholder="Jean Mutabazi" value={fullName} onChange={e => setFullName(e.target.value)} style={inp} />

              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7c6e', marginBottom: '5px', textTransform: 'uppercase' }}>Email</label>
              <input type="email" placeholder="jean@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inp} />

              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7c6e', marginBottom: '5px', textTransform: 'uppercase' }}>Username</label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="jean123"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  style={{ ...inp, marginBottom: 0, paddingRight: '40px', borderColor: usernameAvailable === false ? '#e63946' : usernameAvailable === true ? '#1a7a4a' : '#e0e0e0' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem' }}>
                  {checkingUsername ? '⏳' : usernameAvailable === true ? '✅' : usernameAvailable === false ? '❌' : ''}
                </span>
              </div>
              {usernameAvailable === false && <p style={{ fontSize: '0.75rem', color: '#e63946', marginTop: '-10px', marginBottom: '10px' }}>Ce username est déjà pris</p>}
              {usernameAvailable === true && <p style={{ fontSize: '0.75rem', color: '#1a7a4a', marginTop: '-10px', marginBottom: '10px' }}>Username disponible ✓</p>}

              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7c6e', marginBottom: '5px', textTransform: 'uppercase' }}>Mot de passe</label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordTouched(true) }}
                  onBlur={() => setPasswordTouched(true)}
                  style={{ ...inp, marginBottom: 0, paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

                            {showPasswordRules && (
                <div style={{background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'10px', padding:'10px 12px', marginTop:'-6px', marginBottom:'14px'}}>
                  <p style={{fontSize:'0.72rem', color:'#6b7c6e', fontWeight:700, marginBottom:'7px', textTransform:'uppercase'}}>Mot de passe requis</p>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px'}}>
                    {PASSWORD_RULES.map(rule => {
                      const ok = rule.test(password)
                      return (
                        <span key={rule.label} style={{fontSize:'0.74rem', color: ok ? '#1a7a4a' : '#6b7c6e', fontWeight: ok ? 700 : 500}}>
                          {ok ? 'OK ' : '- '}{rule.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {error && <div style={{ background: '#fff1f0', border: '1px solid #ffd6d6', color: '#c0392b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px' }}>⚠️ {error}</div>}

              <button onClick={handleAccount} disabled={uploading || !accountFormReady} style={{ width: '100%', padding: '13px', background: uploading || !accountFormReady ? '#ccc' : '#1a7a4a', border: 'none', borderRadius: '10px', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'white', cursor: uploading || !accountFormReady ? 'not-allowed' : 'pointer', marginBottom: '14px' }}>
                {uploading ? '⏳ Création...' : 'Continuer →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b7c6e' }}>
                Déjà un compte ?{' '}
                <a href="/auth?mode=login" style={{ color: '#1a7a4a', fontWeight: 700, textDecoration: 'none' }}>Se connecter</a>
              </p>
            </>
          )}

          {/* ── ÉTAPE 2 : IDENTITÉ ── */}
          {step === 'identity' && (
            <>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px', color: '#111a14' }}>Vérification d'identité</h1>
              <p style={{ color: '#6b7c6e', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Uploadez votre carte nationale pour activer votre compte instantanément.
              </p>

              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7c6e', marginBottom: '5px', textTransform: 'uppercase' }}>Numéro de carte nationale</label>
              <input type="text" placeholder="1 1990 7 0000000 1 00" value={nationalId} onChange={e => setNationalId(e.target.value)} style={inp} />

              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7c6e', marginBottom: '8px', textTransform: 'uppercase' }}>Photo de votre carte</label>
              <div onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${docPreview ? '#1a7a4a' : '#e8ede9'}`, borderRadius: '12px', padding: docPreview ? '8px' : '28px', textAlign: 'center', background: '#fafaf9', cursor: 'pointer', marginBottom: '14px' }}>
                {docPreview ? (
                  <div>
                    <img src={docPreview} alt="CNI" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', marginBottom: '6px' }} />
                    <p style={{ fontSize: '0.75rem', color: '#1a7a4a', fontWeight: 600 }}>Appuyer pour changer</p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
                    <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#111a14', marginBottom: '4px' }}>Prendre une photo</p>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>JPG, PNG — Max 5MB</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

              <div style={{ background: '#f0f8f4', borderRadius: '10px', padding: '11px 14px', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.75rem', color: '#4a6b57' }}>🔒 Vos données sont stockées de manière sécurisée et ne sont jamais partagées.</p>
              </div>

              {error && <div style={{ background: '#fff1f0', border: '1px solid #ffd6d6', color: '#c0392b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px' }}>⚠️ {error}</div>}

              <button onClick={handleIdentity} disabled={!docFile || !nationalId.trim()}
                style={{ width: '100%', padding: '13px', background: !docFile || !nationalId.trim() ? '#e8ede9' : '#1a7a4a', border: 'none', borderRadius: '10px', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '0.95rem', color: !docFile || !nationalId.trim() ? '#6b7c6e' : 'white', cursor: !docFile || !nationalId.trim() ? 'not-allowed' : 'pointer' }}>
                Continuer →
              </button>
            </>
          )}

          {/* ── ÉTAPE 3 : CGU ── */}
          {step === 'cgu' && (
            <>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px', color: '#111a14' }}>Conditions d'utilisation</h1>
              <p style={{ color: '#6b7c6e', fontSize: '0.82rem', marginBottom: '20px' }}>Lisez et acceptez avant de continuer</p>

              {/* CGU */}
              <div style={{ background: '#f5f7f5', borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid #e8ede9', maxHeight: '160px', overflowY: 'auto' }}>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.82rem', marginBottom: '8px', color: '#111a14' }}>Conditions Générales d'Utilisation</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7c6e', lineHeight: 1.7 }}>
                  SokoDeal est une plateforme de mise en relation entre acheteurs et vendeurs. En utilisant SokoDeal, vous acceptez de fournir des informations exactes, de ne pas publier de contenu illégal, trompeur ou frauduleux. SokoDeal se réserve le droit de supprimer tout contenu ou compte ne respectant pas ces règles. L'utilisation de la plateforme est gratuite pour les particuliers dans la limite de 5 annonces actives. SokoDeal ne peut être tenu responsable des transactions effectuées entre utilisateurs.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '14px' }}>
                <input type="checkbox" checked={acceptCGU} onChange={e => setAcceptCGU(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#1a7a4a', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#333', lineHeight: 1.5 }}>
                  J'ai lu et j'accepte les <a href="/cgu" target="_blank" style={{ color: '#1a7a4a', fontWeight: 700 }}>Conditions Générales d'Utilisation</a>
                </span>
              </label>

              {/* Anti-arnaque */}
              <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid #fde68a' }}>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.82rem', marginBottom: '8px', color: '#78350f' }}>⚠️ Politique anti-arnaque</p>
                <p style={{ fontSize: '0.75rem', color: '#78350f', lineHeight: 1.7 }}>
                  SokoDeal ne rembourse pas les pertes liées à des arnaques ou fraudes entre utilisateurs. Nous vous conseillons de toujours rencontrer le vendeur en personne dans un lieu public, de vérifier l'article avant tout paiement, et de ne jamais envoyer d'argent à l'avance. En cas d'arnaque, signalez l'annonce via le bouton "Signaler" et contactez les autorités locales.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
                <input type="checkbox" checked={acceptArnaque} onChange={e => setAcceptArnaque(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#1a7a4a', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#333', lineHeight: 1.5 }}>
                  Je comprends que SokoDeal ne rembourse pas les arnaques et j'accepte d'utiliser la plateforme à mes risques
                </span>
              </label>

              {error && <div style={{ background: '#fff1f0', border: '1px solid #ffd6d6', color: '#c0392b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px' }}>⚠️ {error}</div>}

              <button onClick={handleFinal} disabled={!acceptCGU || !acceptArnaque}
                style={{ width: '100%', padding: '13px', background: !acceptCGU || !acceptArnaque ? '#e8ede9' : '#1a7a4a', border: 'none', borderRadius: '10px', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '0.95rem', color: !acceptCGU || !acceptArnaque ? '#6b7c6e' : 'white', cursor: !acceptCGU || !acceptArnaque ? 'not-allowed' : 'pointer', marginBottom: '10px' }}>
                ✅ Créer mon compte
              </button>
              <button onClick={() => setStep('identity')}
                style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid #e8ede9', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#6b7c6e', cursor: 'pointer' }}>
                ← Retour
              </button>
            </>
          )}

          {/* ── UPLOADING ── */}
          {step === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📤</div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px', color: '#111a14' }}>Création en cours...</h2>
              <p style={{ color: '#6b7c6e', fontSize: '0.88rem' }}>Quelques secondes...</p>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '10px', height: '10px', background: '#1a7a4a', borderRadius: '50%', animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <style>{`@keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }`}</style>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: '72px', height: '72px', background: '#e8f5ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>🎉</div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '8px', color: '#111a14' }}>Bienvenue sur SokoDeal !</h2>
              <p style={{ color: '#6b7c6e', marginBottom: '24px', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Votre compte est vérifié. Le badge ✅ apparaît sur votre profil.
              </p>
              <button onClick={() => window.location.href = '/publier?verified=1'}
                style={{ width: '100%', padding: '13px', background: '#1a7a4a', border: 'none', borderRadius: '10px', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'white', cursor: 'pointer', marginBottom: '10px' }}>
                {hasPublishDraft ? 'Reprendre mon annonce' : 'Publier une annonce'}
              </button>
              <button onClick={() => window.location.href = '/'}
                style={{ width: '100%', padding: '13px', background: '#f5f7f5', border: '1px solid #e8ede9', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#6b7c6e', cursor: 'pointer' }}>
                Voir les annonces
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: '#9ca3af' }}>
          © 2025 SokoDeal · Made in Africa 🌍
        </p>
      </div>
    </div>
  )
}
