/**
 * 环境变量集中出口。
 *
 * 与 topic-coaching 的 env.ts 有一处刻意不同：那边给了生产默认值，
 * 这里对服务端变量一律「缺失即抛错」——本站内容全靠构建期从 Supabase 拉，
 * 少一个 key 不会报错，只会静默产出一个空博客，那比构建失败更糟。
 */

/** 客户端也会读到的变量：必须是 NEXT_PUBLIC_ 前缀，构建期内联 */
export const publicEnv = {
  /** 本站规范域名 */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://blog.rooquiz.com',
  /** blog-media（public bucket）的公共 URL 前缀 */
  mediaBaseUrl: process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '',
} as const

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/** 服务端 / 构建期变量。只在 Route Handler 与 scripts/ 里调用，别在组件里碰。 */
export const serverEnv = {
  get supabaseUrl() {
    return required('SUPABASE_URL')
  },
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY')
  },
  get blogWriteToken() {
    return required('BLOG_WRITE_TOKEN')
  },
  /** Deploy Hook 允许缺失：本地开发时不触发构建 */
  get deployHookUrl() {
    return process.env.VERCEL_DEPLOY_HOOK_URL ?? ''
  },
} as const

/** Supabase 是否配全了。sync 脚本据此决定走远端还是回落到本地样例。 */
export function hasSupabaseCredentials(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
