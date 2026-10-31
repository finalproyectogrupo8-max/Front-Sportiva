import 'server-only'

import { cache } from 'react'
import { getPersonalCallup, getPublicCallup } from '@/lib/api/public-callups'

// Cacheadas por request: las usan generateMetadata y la página.

export const loadPublicCallup = cache(async (token: string) => {
  try {
    const result = await getPublicCallup(token)
    return result.ok ? result.data.data : null
  } catch {
    return null
  }
})

export const loadPersonalCallup = cache(async (token: string) => {
  try {
    const result = await getPersonalCallup(token)
    return result.ok ? result.data.data : null
  } catch {
    return null
  }
})
