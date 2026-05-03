'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import imageCompression from 'browser-image-compression'

interface ImageCropModalProps {
  file: File
  aspect: number
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export default function ImageCropModal({ file, aspect, onConfirm, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const imgSrc = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => URL.revokeObjectURL(imgSrc)
  }, [imgSrc])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }

  const handleConfirm = useCallback(async () => {
    if (!completedCrop || !imgRef.current || processing) return
    setProcessing(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setProcessing(false)
      return
    }

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height

    canvas.width = Math.round(completedCrop.width * scaleX)
    canvas.height = Math.round(completedCrop.height * scaleY)

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setProcessing(false)
        return
      }

      try {
        const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        const compressed = await imageCompression(croppedFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        })
        onConfirm(compressed)
      } finally {
        setProcessing(false)
      }
    }, 'image/jpeg', 0.85)
  }, [completedCrop, file.name, onConfirm, processing])

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'16px', padding:'24px', maxWidth:'560px', width:'100%', maxHeight:'90vh', overflow:'auto'}}>
        <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'6px', color:'#111a14'}}>
          Recadrer la photo
        </h2>
        <p style={{fontSize:'0.78rem', color:'#6b7c6e', marginBottom:'16px'}}>
          Deplacez ou redimensionnez la zone de selection
        </p>

        <div style={{maxHeight:'400px', overflow:'auto', marginBottom:'16px', borderRadius:'10px', border:'1px solid #e8ede9'}}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
          >
            <img ref={imgRef} src={imgSrc} alt="crop" onLoad={onImageLoad} style={{maxWidth:'100%', display:'block'}} />
          </ReactCrop>
        </div>

        <div style={{display:'flex', gap:'10px'}}>
          <button
            onClick={handleConfirm}
            disabled={!completedCrop || processing}
            style={{flex:1, padding:'12px', background: !completedCrop || processing ? '#ccc' : '#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'white', cursor: !completedCrop || processing ? 'not-allowed' : 'pointer'}}
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
