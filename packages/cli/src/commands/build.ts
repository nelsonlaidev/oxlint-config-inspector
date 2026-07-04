import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { inspectConfig } from '@oxlint-config-inspector/core'

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

    const result = await inspectConfig({ configFile: argv.config, cwd })

    if (!result) {
      throw new Error('No Oxlint config found')
    }

    await rm(outDir, { force: true, recursive: true })
    await mkdir(outDir, { recursive: true })
    await cp(resolveAppRoot(), outDir, { force: true, recursive: true })
    await writeFile(path.join(outDir, 'data.json'), `${JSON.stringify(result, null, argv.pretty ? 2 : 0)}\n`)

    process.stdout.write(`Built inspector site to ${outDir}\n`)
  },
})
