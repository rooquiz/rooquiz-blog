import { isAuthorized, unauthorized } from '@/lib/api/auth'
import { triggerDeploy } from '@/lib/api/deploy'

export const dynamic = 'force-dynamic'

/**
 * 显式触发一次构建。
 * 批量写入的推荐姿势：逐篇 POST /api/posts 带 deploy:false，全部写完后调这里一次。
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized()

  const result = await triggerDeploy()
  return Response.json(result, { status: result.triggered ? 202 : 503 })
}
