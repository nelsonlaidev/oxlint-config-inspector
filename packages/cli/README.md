# oxlint-config-inspector

[![Version](https://img.shields.io/npm/v/oxlint-config-inspector?style=flat&colorA=333333&colorB=000000)](https://npmx.dev/package/oxlint-config-inspector)
[![Downloads](https://img.shields.io/npm/dt/oxlint-config-inspector.svg?style=flat&colorA=333333&colorB=000000)](https://npmx.dev/package/oxlint-config-inspector)
[![License](https://img.shields.io/npm/l/oxlint-config-inspector?style=flat&colorA=333333&colorB=000000)](https://github.com/nelsonlaidev/oxlint-config-inspector/blob/main/LICENSE)

CLI tool for inspecting and browsing Oxlint configuration files.

## Requirements

- Node.js 22 or newer.
- The `oxlint` binary should be available on `PATH` for builtin rule metadata.
  If it is missing, the CLI logs an error and continues with configured,
  JavaScript plugin, and unknown rules only.

## Usage

Print the resolved inspection result as JSON:

```sh
oxlint-config-inspector inspect
```

Inspect a specific config:

```sh
oxlint-config-inspector inspect --config oxlint.config.ts
```

Write JSON to a file:

```sh
oxlint-config-inspector inspect --output inspect.json
```

Start the interactive web inspector:

```sh
oxlint-config-inspector dev
```

Build a static inspector site:

```sh
oxlint-config-inspector build --out-dir dist/oxlint-config-inspector
```

Serve the static site:

```sh
bunx serve dist/oxlint-config-inspector
```

## Commands

### `inspect`

Loads an Oxlint config, resolves supported `extends`, loads JavaScript plugin
metadata, and writes an `InspectConfigResult` JSON payload.

Options:

- `--config, -c`: path to an Oxlint config file.
- `--cwd`: directory to search from. Defaults to the current working directory.
- `--output, -o`: file path to write JSON output.
- `--pretty`: pretty-print JSON output. Defaults to `true`.

### `dev`

Starts the bundled React inspector app with a Vite dev server. The app serves a
fresh `/data.json` response from the current config and reloads when known config
files change.

Options:

- `--config, -c`: path to an Oxlint config file.
- `--cwd`: directory to search from. Defaults to the current working directory.
- `--host`: host to expose the dev server on.
- `--open, -o`: open the dev server in the browser on startup.
- `--port`: port to run the dev server on. Defaults to `3000`.

### `build`

Writes the bundled app and generated `data.json` to a static output directory.
The generated app uses hash-based routing, so it can be served by plain static
file servers without SPA fallback configuration.

Options:

- `--config, -c`: path to an Oxlint config file.
- `--cwd`: directory to search from. Defaults to the current working directory.
- `--out-dir, -o`: output directory. Defaults to
  `dist/oxlint-config-inspector`.
- `--pretty`: pretty-print `data.json`. Defaults to `true`.
