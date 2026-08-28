'use client'

import { MoonIcon, SunIcon } from './Icons'

/** localStorage 的键。ThemeScript 里那段内联脚本用的是同一个字面量，改这里要一起改 */
const STORAGE_KEY = 'rooquiz-theme'

/**
 * 明暗切换按钮。
 *
 * 图标不由 React state 决定，而是两枚一起渲染、由 CSS 按 html[data-theme] 挑一枚显示
 * （见下面的 .theme-toggle 规则）。理由：当前主题只有浏览器知道（存在 localStorage 里，
 * 由 ThemeScript 在水合之前就写到 <html> 上了），服务端渲染时拿不到。
 * 若改用 state + useEffect，首帧一定是错的那一枚，水合后再跳一下 —— 正是要避免的闪烁。
 *
 * 同理 aria-label 也是固定的「切换深浅色」而不是「切换到深色」：
 * 后者的文案取决于当前主题，服务端同样写不出来。
 */
export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const root = document.documentElement
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // 隐私模式下 localStorage 会抛。切换本身仍然生效，只是不跨页记住
    }
  }

  return (
    <button type="button" onClick={toggle} className="head__icon theme-toggle" aria-label={label}>
      <span className="theme-toggle__light">
        <SunIcon />
      </span>
      <span className="theme-toggle__dark">
        <MoonIcon />
      </span>
    </button>
  )
}

/**
 * 在首帧之前把 data-theme 写到 <html> 上。必须放在 <body> 的最前面 ——
 * 那里它会在页面内容被解析出来之前同步执行，所以看不到「先亮一下再变暗」。
 *
 * 脚本里总是解析出一个确定的 light / dark 写上去（而不是「没存过就不写」），
 * 这样切换按钮只要读 data-theme 取反就行，不必再重复一遍系统偏好的判断逻辑。
 */
export function ThemeScript() {
  const script = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');document.documentElement.dataset.theme=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}})()`

  // 内容是上面这个常量字符串，不含任何外部输入
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
