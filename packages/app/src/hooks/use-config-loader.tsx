import type { InspectConfigResult } from '@oxlint-config-inspector/core'

import { useEffect, useState } from 'react'

import { resolveBaseUrlPath } from '@/lib/base-url'
import { isInspectConfigResult } from '@/lib/config'

export type ConfigLoadState =
  | { data: InspectConfigResult; message?: undefined; status: 'ready' }
  | { data?: undefined; message: string; status: 'error' }
  | { data?: undefined; message?: undefined; status: 'loading' }

type ConfigLoaderOptions = {
  enabled?: boolean
}

export function useConfigLoader(options: ConfigLoaderOptions = {}) {
  const { enabled = true } = options

  const [loadState, setLoadState] = useState<ConfigLoadState>({ status: 'loading' })

  useEffect(() => {
    if (!enabled) {
      return
    }

    let ignore = false

    async function loadData() {
      try {
        const response = await fetch(resolveBaseUrlPath('data.json'), { cache: 'no-store' })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`)
        }

        const json: unknown = await response.json()

        if (!isInspectConfigResult(json)) {
          throw new TypeError('The JSON payload does not match InspectConfigResult.')
        }

        if (!ignore) {
          setLoadState({ data: json, status: 'ready' })
        }
      } catch (error) {
        if (!ignore) {
          setLoadState({
            message: error instanceof Error ? error.message : String(error),
            status: 'error',
          })
        }
      }
    }

    void loadData()

    return () => {
      ignore = true
    }
  }, [enabled])

  return loadState
}
