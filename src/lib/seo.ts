import { publicEnv } from './env'

/** 相对路径 → 站点绝对 URL。全站对外链接都走这里，将来若改挂 rooquiz.com/blog 只需换环境变量。 */
export function absoluteUrl(path: string): string {
  return new URL(path, publicEnv.siteUrl).toString()
}
