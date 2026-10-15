'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function useUrlParam(name: string) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const value = params.get(name)

  const setValue = useCallback(
    (next: string | null) => {
      const sp = new URLSearchParams(params.toString())
      if (next === null) sp.delete(name)
      else sp.set(name, next)
      const qs = sp.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [name, params, pathname, router],
  )

  return [value, setValue] as const
}

export function useCreateDialog() {
  const [value, setValue] = useUrlParam('nuevo')
  const open = value === '1'
  const setOpen = useCallback((next: boolean) => setValue(next ? '1' : null), [setValue])
  return [open, setOpen] as const
}
