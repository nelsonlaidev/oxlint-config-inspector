import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
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

    const dataPath = path.join(outDir, 'data.json')

    logger.info(`Writing inspect data to ${formatDisplayPath(cwd, dataPath)}`)
    await writeFile(dataPath, `${JSON.stringify(result, null, argv.pretty ? 2 : 0)}\n`)

    logger.success(`${formatSuccessWord('Built')} to ${formatDisplayPath(cwd, outDir)}`)
    logger.info(`Serve with ${formatCommand(serveCommand)}`)
  },
})
