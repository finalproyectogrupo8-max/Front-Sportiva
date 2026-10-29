import Link from 'next/link'

export default function Brand({ light = true }: { light?: boolean }) {
  return (
    <Link className={`brand ${light ? 'brand--light' : ''}`} href="/" aria-label="Sportiva, inicio">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="brand-word">
        sport<span>i</span>va
      </span>
    </Link>
  )
}