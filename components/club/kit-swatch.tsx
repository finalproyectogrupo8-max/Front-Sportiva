import { colorName } from '@/lib/kit-colors'
import { cn } from '@/lib/utils'

export function KitSwatch({ camiseta, short, className }: { camiseta: string; short: string; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 flex-col items-center gap-px', className)}
      role="img"
      aria-label={`Camiseta ${colorName(camiseta)}, short ${colorName(short)}`}
    >
      <span className="h-3 w-5 rounded-t-sm rounded-b-[2px] ring-1 ring-foreground/15" style={{ backgroundColor: camiseta }} />
      <span className="h-2 w-4 rounded-b-sm ring-1 ring-foreground/15" style={{ backgroundColor: short }} />
    </span>
  )
}
