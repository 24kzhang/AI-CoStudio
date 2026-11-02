import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { modelBaseUrl } from '../src/models.js'

test('模型网关读取本地配置，环境变量可覆盖且缺失时不使用固定服务器', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gallery-model-'))
  const path = join(directory, 'model.properties')
  try {
    writeFileSync(path, '# 模型网关\nMODEL_BASE_URL = http://model.example:30066/\n')
    assert.equal(modelBaseUrl({ GALLERY_MODEL_CONFIG: path }), 'http://model.example:30066')
    assert.equal(modelBaseUrl({ GALLERY_MODEL_CONFIG: path, MODEL_BASE_URL: 'https://override.example/' }), 'https://override.example')
    assert.equal(modelBaseUrl({ GALLERY_MODEL_CONFIG: join(directory, 'missing.properties') }), '')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
