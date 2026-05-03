'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropModalProps {
  file: File
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export default function ImageCropModal({ file, onConfirm, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const imgSrc = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => URL.revokeObjectURL(imgSrc)
  }, [imgSrc])

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || processing) return
    setProcessing(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setProcessing(false)
      return
    }

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height

    const cropX = completedCrop ? completedCrop.x * scaleX : 0
    const cropY = completedCrop ? completedCrop.y * scaleY : 0
    const cropW = completedCrop ? completedCrop.width * scaleX : imgRef.current.naturalWidth
    const cropH = completedCrop ? completedCrop.height * scaleY : imgRef.current.naturalHeight

    canvas.width = Math.round(cropW)
    canvas.height = Math.round(cropH)

    ctx.drawImage(imgRef.current, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setProcessing(false)
        return
      }

      try {
        const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        let finalFile = croppedFile

        if (croppedFile.size > 1024 * 1024) {
          const imageCompression = (await import('browser-image-compression')).default
          finalFile = await imageCompression(croppedFile, {
            maxSizeMB: 1,
            useWebWorker: true,
          })
        }

        onConfirm(finalFile)
      } finally {
        setProcessing(false)
      }
    }, 'image/jpeg', 0.92)
  }, [completedCrop, file.name, onConfirm, processing])

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'16px', padding:'20px', maxWidth:'640px', width:'100%', maxHeight:'90vh', display:'flex', flexDirection:'column', gap:'14px'}}>
        <div>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.05rem', color:'#111a14', marginBottom:'4px'}}>
            Recadrer la photo
          </h2>
          <p style={{fontSize:'0.75rem', color:'#6b7c6e'}}>
            Selectionnez la zone a garder. Laissez vide pour garder la photo entiere.
          </p>
        </div>

        <div style={{overflow:'auto', maxHeight:'55vh', borderRadius:'10px', border:'1px solid #e8ede9', background:'#f5f7f5'}}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img ref={imgRef} src={imgSrc} alt="crop" style={{display:'block', maxWidth:'100%'}} />
          </ReactCrop>
        </div>

        <div style={{display:'flex', gap:'10px'}}>
          <button
            onClick={handleConfirm}
            disabled={processing}
            style={{flex:1, padding:'12px', background: processing ? '#ccc' : '#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.92rem', color:'white', cursor: processing ? 'not-allowed' : 'pointer'}}
          >
            {processing ? 'Traitement...' : 'Confirmer'}
          </button>
          <button
            onClick={onCancel}
            disabled={processing}
            style={{flex:1, padding:'12px', background:'#f5f7f5', border:'1px solid #e8ede9', borderRadius:'10px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.88rem', color:'#6b7c6e', cursor: processing ? 'not-allowed' : 'pointer'}}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
