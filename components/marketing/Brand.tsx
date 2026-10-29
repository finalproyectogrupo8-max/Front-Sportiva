import Link from 'next/link'

export default function Brand({ light = true }: { light?: boolean }) {
  return (
    <Link className={`brand ${light ? 'brand--light' : ''}`} href="/" aria-label="Sportiva, inicio">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="brand-word">
        {/* "ı" sin punto: el punto lo pone el ::before en naranja */}
        sport<span>ı</span>va
      </span>
    </Link>
  )
}