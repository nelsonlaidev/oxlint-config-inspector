import type { InspectConfigResult } from '@oxlint-config-inspector/core'

import { createContext, use } from 'react'

type ConfigContextValue = {
  config: InspectConfigResult
}

const ConfigContext = createContext<ConfigContextValue | null>(null)
ConfigContext.displayName = 'ConfigContext'

export function useConfig() {
  const context = use(ConfigContext)

  if (!context) {
    throw new Error('useConfig must be used within a <ConfigProvider />')
  }

  return context
}

export const ConfigProvider = ConfigContext.Provider
