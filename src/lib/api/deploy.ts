import 'server-only'

import { serverEnv } from '@/lib/env'

/**
 * 触发 Vercel 重新构建。
 * 批量写入时应当逐篇传 deploy:false，最后调一次 /api/deploy，
 * 否则每篇文章都会排一次构建。
 */
export async function triggerDeploy(): Promise<{ triggered: boolean; reason?: string }> {
  const hookUrl = serverEnv.deployHookUrl
  if (!hookUrl) return { triggered: false, reason: 'VERCEL_DEPLOY_HOOK_URL not configured' }

  const response = await fetch(hookUrl, { method: 'POST' })
  if (!response.ok) return { triggered: false, reason: `Deploy hook returned ${response.status}` }

  return { triggered: true }
}
