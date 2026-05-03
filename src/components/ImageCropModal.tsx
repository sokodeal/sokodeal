'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'

interface ImageCropModalProps {
  file: File
  aspect: number
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export default function ImageCropModal({ file, aspect, onConfirm, onCancel }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const dragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, frameX: 0, frameY: 0 })

  const [processing, setProcessing] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [framePos, setFramePos] = useState({ x: 0, y: 0 })
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 })
  const [imgDisplaySize, setImgDisplaySize] = useState({ w: 0, h: 0 })
  const imgSrc = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => URL.revokeObjectURL(imgSrc)
  }, [imgSrc])

  const onImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return

    const displayW = img.offsetWidth
    const displayH = img.offsetHeight
    setImgDisplaySize({ w: displayW, h: displayH })

    let frameW: number
    let frameH: number

    if (aspect >= 1) {
      frameW = Math.min(displayW * 0.85, displayH * aspect * 0.85)
      frameH = frameW / aspect
    } else {
      frameH = Math.min(displayH * 0.85, (displayW / aspect) * 0.85)
      frameW = frameH * aspect
    }

    setFrameSize({ w: frameW, h: frameH })
    setFramePos({
      x: (displayW - frameW) / 2,
      y: (displayH - frameH) / 2,
    })
    setLoaded(true)
  }, [aspect])

  const moveFrame = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current) return

    const dx = clientX - dragStart.current.mouseX
    const dy = clientY - dragStart.current.mouseY
    const maxX = Math.max(0, imgDisplaySize.w - frameSize.w)
    const maxY = Math.max(0, imgDisplaySize.h - frameSize.h)
    const newX = Math.max(0, Math.min(maxX, dragStart.current.frameX + dx))
    const newY = Math.max(0, Math.min(maxY, dragStart.current.frameY + dy))

    setFramePos({ x: newX, y: newY })
  }, [frameSize, imgDisplaySize])

  const startDrag = useCallback((clientX: number, clientY: number) => {
    dragging.current = true
    dragStart.current = {
      mouseX: clientX,
      mouseY: clientY,
      frameX: framePos.x,
      frameY: framePos.y,
    }
  }, [framePos])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    startDrag(touch.clientX, touch.clientY)
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => moveFrame(e.clientX, e.clientY)
    const onMouseUp = () => {
      dragging.current = false
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [moveFrame])

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return
      e.preventDefault()
      const touch = e.touches[0]
      moveFrame(touch.clientX, touch.clientY)
    }
    const onTouchEnd = () => {
      dragging.current = false
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [moveFrame])

  const handleConfirm = useCallback(async () => {
    const img = imgRef.current
    if (!img || processing || !loaded) return
    setProcessing(true)

    const scaleX = img.naturalWidth / img.offsetWidth
    const scaleY = img.naturalHeight / img.offsetHeight
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setProcessing(false)
      return
    }

    canvas.width = Math.round(frameSize.w * scaleX)
    canvas.height = Math.round(frameSize.h * scaleY)

    ctx.drawImage(
      img,
      framePos.x * scaleX,
      framePos.y * scaleY,
      frameSize.w * scaleX,
      frameSize.h * scaleY,
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
        let finalFile = croppedFile

        if (croppedFile.size > 800 * 1024) {
          finalFile = await imageCompression(croppedFile, {
            maxSizeMB: 0.8,
            useWebWorker: true,
          })
        }

        onConfirm(finalFile)
      } finally {
        setProcessing(false)
      }
    }, 'image/jpeg', 0.9)
  }, [file.name, framePos, frameSize, loaded, onConfirm, processing])

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{background:'white', borderRadius:'16px', padding:'20px', maxWidth:'640px', width:'100%', maxHeight:'90vh', display:'flex', flexDirection:'column', gap:'14px'}}>
        <div>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.05rem', color:'#111a14', marginBottom:'4px'}}>
            Recadrer la photo
          </h2>
          <p style={{fontSize:'0.75rem', color:'#6b7c6e'}}>
            Deplacez le cadre pour choisir la zone a afficher
          </p>
        </div>

        <div style={{position:'relative', overflow:'hidden', borderRadius:'10px', border:'1px solid #e8ede9', background:'#111', maxHeight:'55vh', display:'flex', alignItems:'center', justifyContent:'center', userSelect:'none'}}>
          <img
            ref={imgRef}
            src={imgSrc}
            alt="crop"
            onLoad={onImageLoad}
            style={{display:'block', maxWidth:'100%', maxHeight:'55vh'}}
          />

          {loaded && (
            <div
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              style={{position:'absolute', left:framePos.x, top:framePos.y, width:frameSize.w, height:frameSize.h, border:'2px solid #f5a623', boxShadow:'0 0 0 9999px rgba(0,0,0,0.5)', cursor:'move', boxSizing:'border-box', touchAction:'none'}}
            >
              {[
                { top: -2, left: -2 },
                { top: -2, right: -2 },
                { bottom: -2, left: -2 },
                { bottom: -2, right: -2 },
              ].map((pos, i) => (
                <div key={i} style={{position:'absolute', width:'12px', height:'12px', background:'#f5a623', borderRadius:'2px', ...pos}} />
              ))}
            </div>
          )}
        </div>

        <div style={{display:'flex', gap:'10px'}}>
          <button
            onClick={handleConfirm}
            disabled={processing || !loaded}
            style={{flex:1, padding:'12px', background: processing || !loaded ? '#ccc' : '#1a7a4a', border:'none', borderRadius:'10px', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.92rem', color:'white', cursor: processing || !loaded ? 'not-allowed' : 'pointer'}}
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
