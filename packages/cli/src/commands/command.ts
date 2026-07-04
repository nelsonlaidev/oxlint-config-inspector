import type { CommandModule } from 'yargs'

export function command<T, U>(input: CommandModule<T, U>) {
  return input
}
