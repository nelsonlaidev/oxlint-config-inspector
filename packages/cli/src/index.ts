import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import pkgJson from '../package.json'
import { BuildCommand } from './commands/build'
import { DevCommand } from './commands/dev'
import { InspectCommand } from './commands/inspect'

const cli = yargs(hideBin(process.argv))
  .scriptName(pkgJson.name)
  .help('help', 'show help')
  .alias('help', 'h')
  .version(pkgJson.version)
  .alias('version', 'v')
  .command(InspectCommand)
  .command(BuildCommand)
  .command(DevCommand)
  .strict()

await cli.parseAsync()
