import { cp, rm } from 'node:fs/promises'

const appDist = new URL('../../app/dist/', import.meta.url)
const target = new URL('../dist/app/', import.meta.url)

await rm(target, { force: true, recursive: true })
await cp(appDist, target, { recursive: true })
