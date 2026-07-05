import type { TegamiPlugin } from 'tegami'

import { tegami } from 'tegami'
import { runCli } from 'tegami/cli'
import { github } from 'tegami/plugins/github'
import { x } from 'tinyexec'

const oxfmt: TegamiPlugin = {
  name: 'oxfmt',
  enforce: 'pre',
  async applyCliDraft() {
    await x('oxfmt', ['--write', '.'])
  },
}

const paper = tegami({
  plugins: [
    oxfmt,
    github({
      repo: 'nelsonlaidev/oxlint-config-inspector',
      versionPr: {
        base: 'main',
        create() {
          const version = this.graph.get('npm:oxlint-config-inspector')?.version
          return {
            title: version ? `chore: release ${version}` : 'chore: release',
          }
        },
      },
    }),
  ],
  npm: {
    client: 'pnpm',
    trustedPublish: {
      provider: 'github',
      workflow: 'publish.yml',
    },
  },
  groups: {
    'oxlint-config-inspector': {
      prerelease: 'beta',
      syncBump: true,
      syncGitTag: true,
    },
  },
  packages: {
    'oxlint-config-inspector': {
      group: 'oxlint-config-inspector',
    },
    '@oxlint-config-inspector/core': {
      group: 'oxlint-config-inspector',
    },
  },
})

await runCli(paper)
