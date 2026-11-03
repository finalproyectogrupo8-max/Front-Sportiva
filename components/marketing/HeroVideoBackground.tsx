// 'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// URL del video. Se puede sobrescribir mediante variable de entorno NEXT_PUBLIC_HERO_VIDEO_URL
const DEFAULT_VIDEO_URL =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL ??
  'https://ulaiskmixjtowlmoejke.supabase.co/storage/v1/object/public/fondo-sportiva/sportiva-hero-muted.mp4'

/**
 * Componente que muestra un video de fondo en el hero.
 * - Reproduce automáticamente, sin sonido, en bucle.
 * - Si la preferencia del usuario es "reduced motion" o la pantalla es < md (768px), muestra solo la imagen estática.
 * - Utiliza IntersectionObserver para pausar el video cuando el hero sale del viewport.
 * - Mientras el video carga o ocurre un error, muestra la imagen estática de fallback.
 */
export default function HeroVideoBackground({
  fallbackImage = '/hero-court.jpg', // la imagen estática actual
}: {
  fallbackImage?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showVideo, setShowVideo] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Detectar preferencia de movimiento reducido
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Mostrar video solo si la pantalla es >= md y no hay preferencia reduce motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const check = () => {
      if (mediaQuery.matches && !prefersReducedMotion) {
        setShowVideo(true)
      } else {
        setShowVideo(false)
      }
    }
    check()
    mediaQuery.addEventListener('change', check)
    return () => mediaQuery.removeEventListener('change', check)
  }, [prefersReducedMotion])

  // IntersectionObserver para pausar/reanudar
  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              videoRef.current.play().catch(() => {})
            } else {
              videoRef.current.pause()
            }
          }
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Si el video falla, se mostrará la imagen de fallback
  const handleError = () => {
    setHasError(true)
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* Video */}
      {showVideo && !hasError && (
        <video
          ref={videoRef}
          src={DEFAULT_VIDEO_URL}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={handleError}
        />
      )}
      {/* Fallback imagen */}
      {(hasError || !showVideo) && (
        <Image
          src={fallbackImage}
          alt=""
          fill
          priority
          className="object-cover opacity-20"
        />
      )}
      {/* Overlay de legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1F1B18] via-[#1F1B18]/30 to-transparent" />
    </div>
  )
}

