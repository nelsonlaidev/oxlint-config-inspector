import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

import { afterEach, describe, expect, test } from 'vitest'

const execFile = promisify(execFileCallback)
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(async (dir) => rm(dir, { force: true, recursive: true })))
})

describe('inspectConfig rule discovery', () => {
  test.each([
    { vitePlus: false, configName: 'oxlint.config.ts', command: 'oxlint' },
    { vitePlus: true, configName: 'oxlint.config.ts', command: 'vp' },
    { vitePlus: true, configName: 'vite.config.ts', command: 'vp' },
    { vitePlus: false, configName: 'vite.config.ts', command: 'vp' },
  ])('inspects $configName with Vite+ installed: $vitePlus', async ({ vitePlus, configName, command }) => {
    const root = await mkdtemp(path.join(tmpdir(), 'oxlint-inspector-vite-plus-'))

    temporaryDirectories.push(root)

    const cwd = path.join(root, 'packages/app')
    const configDir = path.join(cwd, 'scripts/a11y')

    await mkdir(configDir, { recursive: true })

    const configFile = path.join(configDir, configName)
    await writeFile(configFile, configName === 'vite.config.ts' ? 'export default { lint: {} }' : 'export default {}')

    const bin = path.join(root, 'launcher-bin')
    const calls = path.join(root, 'calls.jsonl')
    const commandCwd = path.join(root, 'command-cwd')

    const scriptFor = (binary: string) => `\
#!/usr/bin/env node
require('node:fs').appendFileSync(${JSON.stringify(calls)}, JSON.stringify([${JSON.stringify(binary)}, ...process.argv.slice(2)]) + '\\n');
require('node:fs').writeFileSync(${JSON.stringify(commandCwd)}, process.cwd());
console.log('[]');
    `

    await mkdir(bin, { recursive: true })
    await Promise.all(
      ['vp', 'oxlint'].map(async (binary) => {
        const script = path.join(bin, process.platform === 'win32' ? `${binary}.cjs` : binary)
        // A different vp on PATH must not override the project's installation.
        const content = vitePlus && binary === 'vp' ? '#!/usr/bin/env node\nprocess.exit(1)' : scriptFor(binary)
        await writeFile(script, content, { mode: 0o755 })

        if (process.platform === 'win32') {
          await writeFile(path.join(bin, `${binary}.cmd`), `@"${process.execPath}" "${script}" %*`)
        }
      }),
    )

    if (vitePlus) {
      const pkg = path.join(root, 'node_modules/vite-plus')
      await mkdir(path.join(pkg, 'bin'), { recursive: true })
      await writeFile(path.join(pkg, 'package.json'), JSON.stringify({ name: 'vite-plus' }))
      await writeFile(path.join(pkg, 'bin/vp'), scriptFor('vp'))
    }

    const unrelatedModules = path.join(root, 'unrelated/node_modules')

    await mkdir(path.join(unrelatedModules, 'vite-plus'), { recursive: true })
    await writeFile(path.join(unrelatedModules, 'vite-plus/package.json'), JSON.stringify({ name: 'vite-plus' }))

    await execFile(
      process.execPath,
      [
        '--import',
        import.meta.resolve('tsx'),
        '--input-type=module',
        '-e',
        `\
        import { inspectConfig } from ${JSON.stringify(new URL('inspect.ts', import.meta.url).href)};
        await inspectConfig(${JSON.stringify({ configFile, cwd, cache: false })});
        `,
      ],
      {
        cwd: root,
        env: { ...process.env, NODE_PATH: unrelatedModules, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
      },
    )

    if (vitePlus) {
      expect(await realpath(await readFile(commandCwd, 'utf-8'))).toBe(await realpath(cwd))
    }

    const recordedCalls = await readFile(calls, 'utf-8')
    const commands = recordedCalls
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as string[])

    expect(commands.filter((args) => args.includes('--rules'))).toEqual([
      command === 'vp' ? ['vp', 'lint', '--rules', '--format=json'] : ['oxlint', '--rules', '--format=json'],
    ])
  })
})
