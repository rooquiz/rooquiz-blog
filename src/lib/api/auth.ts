import 'server-only'

import { timingSafeEqual } from 'node:crypto'

import { serverEnv } from '@/lib/env'

/**
 * 写入类接口的 Bearer token 校验。
 * 用 timingSafeEqual 而不是 ===，避免按字节比较的时间差被用来逐位猜 token。
 */
export function isAuthorized(request: Request): boolean {
  const header = request.headers.get('authorization') ?? ''
  const presented = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!presented) return false

  const a = Buffer.from(presented)
  const b = Buffer.from(serverEnv.blogWriteToken)
  // 长度不同时 timingSafeEqual 会抛错，先比长度（长度本身不算秘密）
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}

export function unauthorized(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
