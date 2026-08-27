export interface TocEntry {
  id: string
  text: string
  depth: 2 | 3
}

/**
 * 从 MDX 原文里抽 h2/h3 做目录。
 *
 * 为什么不用 rehype 插件：compileMDX 只返回渲染好的 JSX，
 * 拿不到 rehype 阶段挂在 vfile.data 上的东西。与其为了取一份目录去魔改编译管线，
 * 不如直接扫一遍源文——slug 规则和 rehype-slug 对齐即可。
 */
export function extractToc(source: string): TocEntry[] {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '')
  const entries: TocEntry[] = []
  let inFence = false

  for (const line of body.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line)
    if (!match) continue

    const text = match[2].replace(/[*_`]/g, '')
    entries.push({ id: slugify(text), text, depth: match[1].length as 2 | 3 })
  }

  return entries
}

/** 与 rehype-slug 使用的 github-slugger 行为对齐（小写、去标点、空格转连字符、保留 CJK） */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}
