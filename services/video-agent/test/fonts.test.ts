import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveFont } from '../src/fonts.js'

test('字体配置失效时使用可读的候选字体，并跳过目录', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gallery-font-'))
  const font = join(directory, 'font.ttf')
  try {
    writeFileSync(font, '字体测试文件')
    assert.equal(resolveFont(join(directory, 'missing.ttc'), [directory, font]), font)
    assert.equal(resolveFont(font, []), font)
    assert.throws(() => resolveFont(join(directory, 'missing.ttc'), [directory]),
      (error: any) => error.code === 'FONT_NOT_FOUND' && error.message.includes('VIDEO_FONT'))
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
