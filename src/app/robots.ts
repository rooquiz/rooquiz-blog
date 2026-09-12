import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

export const dynamic = 'force-static'

/**
 * 搜索页与临时验证页不该被抓；`/api/` 那四个端点是写入与计数，不是内容。
 * 注意 disallow 只挡抓取、不挡收录 —— 这两页同时在 metadata 里写了 noindex。
 */
const DISALLOW = ['/search', '/kitchen-sink', '/api/']

/**
 * 生成式检索的抓取端。它们本来就落在 `*` 那条里（全站 allow），
 * 单列一组是为了把「欢迎来抓」这件事写成显式的：
 * 这类 UA 一旦在 robots 里没有自己的组，很多合规检查会按「未表态」处理，
 * 而站点方将来若从别处复制一份带默认 deny 的 robots，这组能挡住那次事故。
 *
 * 名单按厂商分：抓取用的 bot 与「用户点开链接时代取」的 agent 都要在
 * （ChatGPT-User / Claude-User / Perplexity-User 是后者，它们不遵守前者的规则）。
 */
const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'meta-externalagent',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'DuckAssistBot',
  'MistralAI-User',
  'YouBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_AGENTS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
