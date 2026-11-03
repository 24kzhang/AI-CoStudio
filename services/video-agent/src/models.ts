import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function localModelProperties(env: NodeJS.ProcessEnv): Record<string, string> {
  const path = env.GALLERY_MODEL_CONFIG || resolve(root, 'runtime-data/model.properties')
  const properties: Record<string, string> = {}
  if (!existsSync(path)) return properties
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const index = line.indexOf('=')
    if (index > 0 && !line.trimStart().startsWith('#')) {
      properties[line.slice(0, index).trim()] = line.slice(index + 1).trim()
    }
  }
  return properties
}

export function modelBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.MODEL_BASE_URL?.trim() || localModelProperties(env).MODEL_BASE_URL || '').replace(/\/+$/, '')
}

export function videoLlmConfig(env: NodeJS.ProcessEnv = process.env) {
  const properties = localModelProperties(env)
  const value = (key: string) => env[key]?.trim() || properties[key] || ''
  return {
    llmUrl: value('VIDEO_LLM_URL').replace(/\/+$/, ''),
    llmKey: value('VIDEO_LLM_KEY'),
    llmModel: value('VIDEO_LLM_MODEL') || 'qwen3.8-flash',
  }
}
