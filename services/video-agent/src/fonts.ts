import { accessSync, constants, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { ApiError } from './errors.js'

function systemFonts(): string[] {
  if (process.platform === 'win32') {
    const directory = resolve(process.env.WINDIR || 'C:/Windows', 'Fonts')
    return ['simhei.ttf', 'msyh.ttc', 'simsun.ttc'].map(name => resolve(directory, name))
  }
  if (process.platform === 'darwin') return [
    resolve(homedir(), 'Library/Fonts/notosanssc-regular.ttf'),
    '/Library/Fonts/Arial Unicode.ttf',
    '/System/Library/Fonts/PingFang.ttc',
    '/System/Library/Fonts/STHeiti Light.ttc',
  ]
  return [
    '/usr/share/fonts/truetype/noto/NotoSansSC-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
  ]
}

export function resolveFont(configured = process.env.VIDEO_FONT, candidates = systemFonts()): string {
  for (const path of [configured, ...candidates]) {
    if (!path?.trim()) continue
    try {
      accessSync(path, constants.R_OK)
      if (statSync(path).isFile()) return path
    } catch { /* 配置失效时继续检测本机中文字体。 */ }
  }
  throw new ApiError(422, 'FONT_NOT_FOUND', '找不到可读的中文字体，请将 VIDEO_FONT 配置为本机实际存在的中文字体文件后重试')
}
