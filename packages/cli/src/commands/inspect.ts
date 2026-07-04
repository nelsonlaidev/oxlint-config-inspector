import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { inspectConfig } from '@oxlint-config-inspector/core'

import { command } from './command'

type InspectArgs = {
  config?: string
  cwd: string
  output?: string
  pretty: boolean
}

export const InspectCommand = command<unknown, InspectArgs>({
  command: 'inspect',
  describe: 'Inspect an Oxlint configuration',
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
      .option('output', {
        alias: 'o',
        describe: 'Path to write the inspect JSON result',
        type: 'string',
      })
      .option('pretty', {
        default: true,
        describe: 'Pretty-print JSON output',
        type: 'boolean',
      })
  },
  async handler(argv) {
    const result = await inspectConfig({
      configFile: argv.config,
      cwd: argv.cwd,
    })

    if (!result) {
      throw new Error('No Oxlint config found')
    }

    const json = `${JSON.stringify(result, null, argv.pretty ? 2 : 0)}\n`

    if (argv.output) {
      const outputPath = path.resolve(argv.cwd, argv.output)
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, json)
      return
    }

    process.stdout.write(json)
  },
})
