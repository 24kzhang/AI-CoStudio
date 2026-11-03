import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { dataRoot } from '../src/config.js'
import { db } from '../src/db.js'
import { projectAssets } from '../src/assets.js'

test('跨系统迁移后复用本机视频和音轨缓存，不使用旧系统的绝对路径', async () => {
  const id = randomUUID(), directory = resolve(dataRoot, 'assets', id)
  const query = db.query
  await mkdir(directory, { recursive: true })
  try {
    await writeFile(resolve(directory, 'video.mp4'), '视频缓存')
    await writeFile(resolve(directory, 'source.wav'), '音轨缓存')
    const metadata = { id, kind: 'video', path: 'Z:\\旧工程\\video.mp4', audioPath: 'Z:\\旧工程\\source.wav', audioKey: '音轨对象' }
    db.query = (async () => [[{ metadata: JSON.stringify(metadata) }]]) as any
    const [asset] = await projectAssets(randomUUID())
    assert.equal(asset!.path, resolve(directory, 'video.mp4'))
    assert.equal(asset!.audioPath, resolve(directory, 'source.wav'))
  } finally {
    db.query = query
    await rm(directory, { recursive: true, force: true })
  }
})
