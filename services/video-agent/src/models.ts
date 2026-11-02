import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export function modelBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.MODEL_BASE_URL) return env.MODEL_BASE_URL.trim().replace(/\/+$/, '')
  const path = env.GALLERY_MODEL_CONFIG || resolve(root, 'runtime-data/model.properties')
  if (!existsSync(path)) return ''
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const index = line.indexOf('=')
    if (index > 0 && line.slice(0, index).trim() === 'MODEL_BASE_URL') {
      return line.slice(index + 1).trim().replace(/\/+$/, '')
    }
  }
  return ''
}
