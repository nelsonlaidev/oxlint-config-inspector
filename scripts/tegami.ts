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
        commit({ type }) {
          if (type === 'version-packages') {
            return { title: 'chore: version packages' }
          }

          return { title: 'chore: update publish lockfile' }
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
