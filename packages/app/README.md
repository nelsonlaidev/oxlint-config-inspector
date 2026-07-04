# @oxlint-config-inspector/app

[![License](https://img.shields.io/badge/license-MIT-000000?style=flat&colorA=333333)](https://github.com/nelsonlaidev/oxlint-config-inspector/blob/main/LICENSE)

Private React/Vite app bundled into the `oxlint-config-inspector` CLI.

This package is not intended to be published or consumed directly. The CLI build
copies this app's production `dist/` output into `packages/cli/dist/app`, then
serves it from the `dev` command or copies it from the `build` command.

## Development

The app expects an inspection payload at `data.json`. When running the app
standalone with Vite, generate the file first:

```sh
pnpm build --filter=oxlint-config-inspector
node packages/cli/bin/oxlint-config-inspector.mjs inspect --output packages/app/public/data.json
pnpm --filter @oxlint-config-inspector/app dev
```
