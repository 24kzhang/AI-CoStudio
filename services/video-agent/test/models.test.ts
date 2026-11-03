import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { modelBaseUrl, videoLlmConfig } from '../src/models.js'

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

test('视频规划配置独立于生成网关，密钥和模型支持环境变量覆盖', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gallery-planner-'))
  const path = join(directory, 'model.properties')
  try {
    writeFileSync(path, 'MODEL_BASE_URL=http://model.example:30066\nVIDEO_LLM_URL=https://planner.example/v1/\nVIDEO_LLM_MODEL=qwen3.8-flash\nVIDEO_LLM_KEY=local-test-key\n')
    const env = { GALLERY_MODEL_CONFIG: path }
    assert.deepEqual(videoLlmConfig(env), {
      llmUrl: 'https://planner.example/v1', llmModel: 'qwen3.8-flash', llmKey: 'local-test-key',
    })
    assert.deepEqual(videoLlmConfig({ ...env, VIDEO_LLM_URL: 'https://override.example/v1/', VIDEO_LLM_MODEL: 'test-model', VIDEO_LLM_KEY: 'override-test-key' }), {
      llmUrl: 'https://override.example/v1', llmModel: 'test-model', llmKey: 'override-test-key',
    })
    assert.equal(modelBaseUrl(env), 'http://model.example:30066')
    assert.deepEqual(videoLlmConfig({ GALLERY_MODEL_CONFIG: join(directory, 'missing.properties') }), {
      llmUrl: '', llmKey: '', llmModel: 'qwen3.8-flash',
    })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
