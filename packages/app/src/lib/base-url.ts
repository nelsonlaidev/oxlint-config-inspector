declare global {
  var __OXLINT_CONFIG_INSPECTOR_BASE_PATH__: string | undefined
}

export function resolveBaseUrlPath(filepath: string) {
  return `${getBaseUrl()}${filepath.replace(/^\/+/, '')}`
}

function getBaseUrl() {
  const runtimeBaseUrl = globalThis.__OXLINT_CONFIG_INSPECTOR_BASE_PATH__
  const baseUrl = runtimeBaseUrl ?? import.meta.env.BASE_URL

  if (!baseUrl || baseUrl === '.') {
    return '/'
  }

  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}
