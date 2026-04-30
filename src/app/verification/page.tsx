'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function VerificationPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docPreview, setDocPreview] = useState<string | null>(null)
  const [nationalId, setNationalId] = useState('')
  const [step, setStep] = useState<'upload' | 'uploading' | 'success'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (userData?.is_verified) setStep('success')
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
  }

  const handleVerify = async () => {
    if (!docFile || !user || !nationalId.trim()) return
    setUploading(true)
    setStep('uploading')

    try {
      // 1. Upload la photo dans Storage
      const ext = docFile.name.split('.').pop()
      const filePath = `${user.id}/id-card.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(filePath, docFile, { upsert: true })
      if (uploadError) throw uploadError

      // 2. Mettre à jour le profil : vérifié immédiatement
      const { error: updateError } = await supabase
        .from('users')
        .update({
          national_id: nationalId,
          id_document_url: filePath,
          id_verification_status: 'verified',
          is_verified: true,
        })
        .eq('id', user.id)
      if (updateError) throw updateError

      setStep('success')
    } catch (err: any) {
      console.error(err)
      alert('Erreur lors de l\'upload. Réessayez.')
      setStep('upload')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7f5' }}>
      <p style={{ fontFamily: 'Syne,sans-serif', color: '#1a7a4a', fontWeight: 700 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f5' }}>
      <Header />

      <div style={{ maxWidth: '520px', margin: '32px auto', padding: '0 5% 60px' }}>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
          {['Document', 'Upload', 'Confirmé'].map((label, i) => {
            const stepIndex = step === 'upload' ? 0 : step === 'uploading' ? 1 : 2
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: done ? '#1a7a4a' : active ? '#f5a623' : '#e8ede9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800,
                    color: done || active ? 'white' : '#6b7c6e'
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: active ? '#111a14' : '#6b7c6e', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: '2px', background: done ? '#1a7a4a' : '#e8ede9', margin: '0 8px', marginBottom: '18px' }} />}
              </div>
            )
          })}
        </div>

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px', border: '1px solid #e8ede9', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', background: '#e8f5ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>✅</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '8px', color: '#111a14' }}>
              Identité vérifiée !
            </h2>
            <p style={{ color: '#6b7c6e', marginBottom: '24px', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Votre compte est maintenant vérifié. Le badge ✅ apparaît sur votre profil et vous pouvez publier des annonces.
            </p>
            <button onClick={() => window.location.href = '/publier'}
              style={{ width: '100%', padding: '13px', background: '#1a7a4a', border: 'none', borderRadius: '10px', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'white', cursor: 'pointer', marginBottom: '10px' }}>
              Publier une annonce
            </button>
            <button onClick={() => window.location.href = '/profil'}
              style={{ width: '100%', padding: '13px', background: '#f5f7f5', border: '1px solid #e8ede9', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#6b7c6e', cursor: 'pointer' }}>
              Mon profil
            </button>
          </div>
        )}

        {/* ── UPLOADING ── */}
        {step === 'uploading' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', border: '1px solid #e8ede9', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📤</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px', color: '#111a14' }}>
              Upload en cours...
            </h2>
            <p style={{ color: '#6b7c6e', fontSize: '0.88rem' }}>Quelques secondes...</p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '10px', height: '10px', background: '#1a7a4a', borderRadius: '50%', animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <style>{`@keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }`}</style>
          </div>
        )}

        {/* ── UPLOAD FORM ── */}
        {step === 'upload' && (
          <div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e8ede9', marginBottom: '14px' }}>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '6px', color: '#111a14' }}>
                Vérification d'identité
              </h1>
              <p style={{ color: '#6b7c6e', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Uploadez votre carte nationale d'identité pour activer votre compte instantanément.
              </p>

              {/* Champ numéro CNI */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#333', marginBottom: '6px' }}>
                  Numéro de carte nationale
                </label>
                <input
                  type="text"
                  placeholder="1 1990 7 0000000 1 00"
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #e0e0e0', borderRadius: '10px',
                    fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem',
                    outline: 'none', background: '#fafafa', color: '#222',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Upload zone */}
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#333', marginBottom: '6px' }}>
                Photo de votre carte d'identité
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${docPreview ? '#1a7a4a' : '#e8ede9'}`,
                  borderRadius: '12px', padding: docPreview ? '8px' : '32px',
                  textAlign: 'center', background: '#fafaf9', cursor: 'pointer',
                  transition: 'border-color 0.2s', marginBottom: '10px'
                }}
              >
                {docPreview ? (
                  <div>
                    <img src={docPreview} alt="Document" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.78rem', color: '#1a7a4a', fontWeight: 600 }}>Appuyez pour changer</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>📷</div>
                    <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#111a14', marginBottom: '4px' }}>
                      Prendre une photo
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>JPG, PNG — Max 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Note sécurité */}
              <div style={{ background: '#f0f8f4', borderRadius: '10px', padding: '11px 14px', marginTop: '16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.78rem', color: '#4a6b57' }}>
                  🔒 Vos données sont stockées de manière sécurisée et ne sont jamais partagées.
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={!docFile || !nationalId.trim() || uploading}
                style={{
                  width: '100%', padding: '14px',
                  background: !docFile || !nationalId.trim() ? '#e8ede9' : '#1a7a4a',
                  border: 'none', borderRadius: '12px',
                  fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '0.95rem',
                  color: !docFile || !nationalId.trim() ? '#6b7c6e' : 'white',
                  cursor: !docFile || !nationalId.trim() ? 'not-allowed' : 'pointer'
                }}>
                ✅ Vérifier mon identité
              </button>
            </div>

            {/* Conseils */}
            <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '16px', border: '1px solid #fde68a' }}>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.82rem', marginBottom: '10px', color: '#78350f' }}>
                Conseils pour une vérification réussie
              </h3>
              {[
                'Document bien éclairé et entier',
                'Évitez les reflets et zones floues',
                'Recto de la carte suffisant',
                'Photo nette, pas de document froissé',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontSize: '0.78rem', color: '#78350f' }}>
                  <span style={{ fontWeight: 700 }}>✓</span> {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
