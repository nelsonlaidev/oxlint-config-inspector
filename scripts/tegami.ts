import { tegami } from 'tegami'
import { runCli } from 'tegami/cli'
import { github } from 'tegami/plugins/github'

const paper = tegami({
  plugins: [
    github({
      repo: 'nelsonlaidev/oxlint-config-inspector',
      versionPr: {
        base: 'main',
      },
    }),
  ],
  npm: {
    trustedPublish: {
      provider: 'github',
      workflow: 'publish.yml',
    },
  },
  groups: {
    inspector: {
      prerelease: 'beta',
    },
  },
  packages: {
    'oxlint-config-inspector': {
      group: 'inspector',
    },
    '@oxlint-config-inspector/core': {
      group: 'inspector',
    },
  },
})

await runCli(paper)
