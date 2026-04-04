import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const databasePath = resolve(currentDirectory, '..', 'catalog-db.json')

export function loadDatabase() {
  const payload = readFileSync(databasePath, 'utf8')
  return JSON.parse(payload)
}
