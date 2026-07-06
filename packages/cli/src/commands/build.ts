import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { inspectConfig } from '@oxlint-config-inspector/core'

import {
  formatCommand,
  formatDisplayPath,
  formatFilepath,
  formatHighlightedCount,
  formatSuccessWord,
  logger,
} from '@/logger'
import { resolveAppRoot } from '@/utils'

import { command } from './command'

type BuildArgs = {
  base?: string
  config?: string
  cwd: string
  'out-dir': string
  pretty: boolean
}

export const BuildCommand = command<unknown, BuildArgs>({
  command: 'build',
  describe: 'Build a static inspector site',
  builder(yargs) {
    return yargs
      .option('base', {
        describe: 'Base path to prepend to static asset and data URLs',
        type: 'string',
      })
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
      .option('out-dir', {
        alias: 'o',
        default: 'dist/oxlint-config-inspector',
        describe: 'Directory to write the static inspector site',
        type: 'string',
      })
      .option('pretty', {
        default: true,
        describe: 'Pretty-print JSON output',
        type: 'boolean',
      })
  },
  async handler(argv) {
    const cwd = path.resolve(argv.cwd)
    const outDir = path.resolve(cwd, argv.outDir)
    const displayOutDir = formatFilepath(cwd, outDir)
    const serveCommand = `npx serve ${displayOutDir}`
    const configFilepath = argv.config ? path.resolve(cwd, argv.config) : undefined
    const basePath = resolveBasePath(argv)

    logger.info('Building static Oxlint config inspector...')

    if (configFilepath) {
      logger.info(`Reading Oxlint config from ${formatDisplayPath(cwd, configFilepath)}`)
    }

    const result = await inspectConfig({ configFile: argv.config, cwd })

    if (!result) {
      throw new Error('No Oxlint config found')
    }

    if (!configFilepath) {
      logger.info(`Read Oxlint config from ${formatDisplayPath(cwd, result.configFilepath)}`)
    }

    logger.success(
      `Loaded with ${formatHighlightedCount(result.configFiles.length, 'config file')} and ${formatHighlightedCount(
        result.stats.totalRules,
        'rule',
      )}`,
    )
    logger.info(`Copying inspector app to ${formatDisplayPath(cwd, outDir)}`)
    await rm(outDir, { force: true, recursive: true })
    await mkdir(outDir, { recursive: true })
    await cp(resolveAppRoot(), outDir, { force: true, recursive: true })
    await writeIndexHtmlBasePath(outDir, basePath)

    const dataPath = path.join(outDir, 'data.json')

    logger.info(`Writing inspect data to ${formatDisplayPath(cwd, dataPath)}`)
    await writeFile(dataPath, `${JSON.stringify(result, null, argv.pretty ? 2 : 0)}\n`)

    logger.success(`${formatSuccessWord('Built')} to ${formatDisplayPath(cwd, outDir)}`)
    logger.info(`Serve with ${formatCommand(serveCommand)}`)
  },
})

function resolveBasePath(argv: Pick<BuildArgs, 'base'>) {
  return normalizeBasePath(argv.base)
}

function normalizeBasePath(basePath: string | undefined) {
  const trimmedBasePath = basePath?.trim()

  if (!trimmedBasePath || trimmedBasePath === '/') {
    return '/'
  }

  if (/^[a-z][\d+.a-z-]*:/i.test(trimmedBasePath) || trimmedBasePath.startsWith('//')) {
    throw new Error('--base must be a URL path, such as /oxlint-inspector/')
  }

  const normalizedBasePath = `/${trimmedBasePath.replace(/^\/+/, '')}`

  return normalizedBasePath.endsWith('/') ? normalizedBasePath : `${normalizedBasePath}/`
}

async function writeIndexHtmlBasePath(outDir: string, basePath: string) {
  if (basePath === '/') {
    return
  }

  const indexHtmlPath = path.join(outDir, 'index.html')
  const indexHtml = await readFile(indexHtmlPath, 'utf-8')

  await writeFile(indexHtmlPath, applyIndexHtmlBasePath(indexHtml, basePath))
}

function applyIndexHtmlBasePath(indexHtml: string, basePath: string) {
  const runtimeConfigScript = `    <script>globalThis.__OXLINT_CONFIG_INSPECTOR_BASE_PATH__=${JSON.stringify(basePath)}</script>\n`
  const htmlWithRuntimeBasePath = indexHtml.replace('</head>', `${runtimeConfigScript}  </head>`)

  return htmlWithRuntimeBasePath.replaceAll(/\b(?:href|src)="\/(?!\/)/g, (match) => `${match.slice(0, -1)}${basePath}`)
}
