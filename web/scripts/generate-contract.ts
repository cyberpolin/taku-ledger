import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stringify } from 'yaml'
import { openApiDocument } from '../src/contract/openapi.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const document = stringify(openApiDocument())

for (const target of ['contract/openapi.yaml', 'public/openapi.yaml']) {
  const path = resolve(root, target)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, document)
}
