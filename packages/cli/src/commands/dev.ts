import type { ServerResponse } from 'node:http'
import type { InspectConfigResult } from '@oxlint-config-inspector/core'
import type { Plugin, ViteDevServer } from 'vite'

import path from 'node:path'
import { performance } from 'node:perf_hooks'

import { inspectConfig, searchPlaces } from '@oxlint-config-inspector/core'
import colors from 'picocolors'
import sirv from 'sirv'
import { createServer } from 'vite'

import { formatCount, formatFilepath, formatNumber, logger } from '@/logger'

import pkgJson from '../../package.json'
import { resolveAppRoot } from '../utils'
import { command } from './command'

const dataPath = '/data.json'

type DevArgs = {
  config?: string
  cwd: string
  host?: string | boolean
  port: number
}

type DevServerState = {
  result?: InspectConfigResult
}

export const DevCommand = command<unknown, DevArgs>({
  command: ['$0', 'dev'],
  describe: 'Run the development server',
  builder(yargs) {
    return yargs
      .option('config', {
        alias: 'c',
        describe: 'Path to an Oxlint config file',
        type: 'string',
      })
      .option('cwd', {
        default: process.cwd(),
        describe: 'Directory to search from',
        type: 'string',
      })
      .option('host', {
        coerce: coerceHost,
        describe: 'Host to expose the development server on',
        requiresArg: false,
        type: 'string',
      })
      .option('port', {
        describe: 'Port to run the development server on',
        type: 'number',
        default: 3000,
      })
  },
  async handler(argv) {
    const cwd = path.resolve(argv.cwd)
    const state: DevServerState = {}

    const server = await createServer({
      appType: 'spa',
      configFile: false,
      plugins: [serveBuiltAppAssets(), inspectData({ config: argv.config, cwd, state })],
      root: resolveAppRoot(),
      server: {
        host: argv.host,
        port: argv.port,
      },
    })

    await server.listen()

    const configFilepath = state.result?.configFilepath ?? (argv.config ? path.resolve(cwd, argv.config) : undefined)

    const versionString = `${colors.bold('Oxlint Config Inspector')} v${pkgJson.version}`

    logger.info(`\n  ${colors.green(versionString)}\n`)
    logger.info(
      `  ${colors.green('➜')}  ${colors.bold('Config')}:  ${configFilepath ? formatFilepath(cwd, configFilepath) : 'not found'}`,
    )
    logger.info(
      `  ${colors.green('➜')}  ${colors.bold('Rules')}:   ${state.result ? formatNumber(state.result.stats.totalRules) : '-'}`,
    )

    server.printUrls()
    server.bindCLIShortcuts({ print: true })
    logger.info('')
  },
})

function coerceHost(value: string | undefined) {
  return value === '' ? true : value
}

function serveBuiltAppAssets(): Plugin {
  return {
    name: 'oxlint-config-inspector-built-app-assets',
    enforce: 'pre',
    configureServer(server) {
      const appRoot = resolveAppRoot()
      const assetsDir = path.join(appRoot, 'assets')

      const serveAssets = sirv(assetsDir, {
        dev: true,
        etag: true,
        maxAge: 0,
      })

      server.middlewares.use('/assets', (request, response, next) => {
        response.setHeader('Cache-Control', 'no-store')
        serveAssets(request, response, next)
      })
    },
  }
}

function inspectData(options: Pick<DevArgs, 'config' | 'cwd'> & { state: DevServerState }): Plugin {
  const cwd = path.resolve(options.cwd)

  const searchPaths = [
    ...searchPlaces.map((filename) => path.resolve(cwd, filename)),
    ...(options.config ? [path.resolve(cwd, options.config)] : []),
  ]

  const knownConfigPaths = new Set(searchPaths)
  const suppressedAddFiles = new Set<string>()

  let reloadTimer: ReturnType<typeof setTimeout> | undefined
  let watcherReady = false

  async function loadConfig() {
    const result = await inspectConfig({
      cache: false,
      configFile: options.config,
      cwd,
    })

    if (!result) {
      throw new Error('No Oxlint config found')
    }

    for (const filepath of result.configFiles) {
      knownConfigPaths.add(filepath)
    }

    options.state.result = result

    return result
  }

  async function reloadData(server: ViteDevServer, changedFilepath: string) {
    const start = performance.now()

    logReloadStart(cwd, changedFilepath)

    try {
      const result = await loadConfig()

      registerConfig(server, result.configFiles)
      server.ws.send({ type: 'full-reload' })
      logReloadSuccess(result, performance.now() - start)
    } catch (error) {
      server.ws.send({ type: 'full-reload' })
      logReloadFailure(error)
    }
  }

  function debounceReload(server: ViteDevServer, filepath: string) {
    if (reloadTimer) {
      clearTimeout(reloadTimer)
    }

    reloadTimer = setTimeout(async () => {
      await reloadData(server, filepath)
    }, 100)
  }

  function shouldReload(filepath: string) {
    return knownConfigPaths.has(filepath)
  }

  function registerConfig(server: ViteDevServer, filepaths: string[]) {
    for (const filepath of filepaths) {
      suppressedAddFiles.add(path.resolve(filepath))
    }

    server.watcher.add(filepaths)
  }

  return {
    name: 'oxlint-config-inspector-data',
    async configureServer(server) {
      server.watcher.add(searchPaths)

      server.watcher.on('ready', () => {
        watcherReady = true
      })

      server.watcher.on('add', (filepath) => {
        const resolvedPath = path.resolve(filepath)

        if (suppressedAddFiles.delete(resolvedPath)) {
          return
        }

        if (watcherReady && shouldReload(resolvedPath)) {
          debounceReload(server, resolvedPath)
        }
      })

      server.watcher.on('change', (filepath) => {
        const resolvedPath = path.resolve(filepath)

        if (watcherReady && shouldReload(resolvedPath)) {
          debounceReload(server, resolvedPath)
        }
      })

      server.watcher.on('unlink', (filepath) => {
        const resolvedPath = path.resolve(filepath)

        if (watcherReady && shouldReload(resolvedPath)) {
          debounceReload(server, resolvedPath)
        }
      })

      await registerCurrentConfigs(server)

      server.middlewares.use((request, response, next) => {
        const requestPath = new URL(request.url ?? '/', 'http://localhost').pathname

        if (requestPath !== dataPath) {
          next()
          return
        }

        void sendDataResponse(response, server, next)
      })
    },
  }

  async function registerCurrentConfigs(server: ViteDevServer) {
    try {
      const result = await loadConfig()

      registerConfig(server, result.configFiles)
    } catch {
      // The first /data.json request will surface the load error in the app.
    }
  }

  async function sendDataResponse(response: ServerResponse, server: ViteDevServer, next: (error?: unknown) => void) {
    try {
      const result = await loadConfig()

      registerConfig(server, result.configFiles)

      response.statusCode = 200
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(`${JSON.stringify(result, null, 2)}\n`)
    } catch (error) {
      try {
        const message = error instanceof Error ? error.message : String(error)

        response.statusCode = message === 'No Oxlint config found' ? 404 : 500
        response.setHeader('Cache-Control', 'no-store')
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(`${JSON.stringify({ message }, null, 2)}\n`)
      } catch (responseError) {
        next(responseError)
      }
    }
  }
}

function logReloadStart(cwd: string, filepath: string) {
  logger.info(`${formatFilepath(cwd, filepath)} changed`, { timestamp: true })
}

function logReloadSuccess(result: InspectConfigResult, duration: number) {
  logger.info(
    `reloaded in ${Math.round(duration)}ms (${formatCount(result.configFiles.length, 'config')}, ${formatCount(
      result.stats.totalRules,
      'rule',
    )})`,
    { timestamp: true },
  )
}

function logReloadFailure(error: unknown) {
  logger.error(`failed to reload\n\n${error instanceof Error ? error.message : String(error)}\n`, { timestamp: true })
}
