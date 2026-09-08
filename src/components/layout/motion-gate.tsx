/**
 * 首页入场动画的「首帧闸门」。
 *
 * 问题：入场动画的起点（`opacity: 0`）由 GSAP 在水合之后写下，而那时首页已经以
 * 终态画过一帧了 —— 直接 `gsap.set` 会看到一次闪回。要想第一帧就是动画起点，
 * 起点必须由 CSS 给出；可一旦把 `opacity: 0` 无条件写进 CSS，JS 挂掉的那一刻
 * 首页内容就永久消失了。`motion.css` 顶部那段注释讲的就是这类事故。
 *
 * 所以起点写在 `html[data-anim='js']` 下面，由这段脚本决定它成不成立：
 *
 *   （无 JS）  属性从未写上   → 起点规则不匹配 → 内容照常显示，只是不动
 *   'js'      脚本已跑、动画未接手 → 起点成立，第一帧就是动画起点
 *   'off'     水合超过 WATCHDOG_MS → 起点作废，内容立刻显示（见下）
 *   'run'     GSAP 已接手       → 起点作废，改由它写的行内样式说话
 *
 * `off` 那一档是给慢设备兜底的：低端机上水合可能要好几秒，没有它首页就白着几秒。
 * 它同时是给 `HomeMotion` 的信号 —— 读到 `off` 说明内容已经露过脸了，
 * 这时再播入场就是「出现又消失」，所以它会直接跳到终态（见 HomeMotion 里的 `fresh`）。
 *
 * 400ms 是这么定的：正常静态页水合在 100ms 上下，留两倍余量；而真兜底时
 * 400ms 的延迟人眼读作「页面刚加载完」，不是「内容闪了一下」。
 *
 * 必须紧跟 `<ThemeScript />` 排在 `<body>` 最前面：再往后就会先画一帧未 gate 的内容。
 * 和 ThemeScript 分成两个脚本而不是合并成一条，是因为职责本来就是两件事
 * （一个决定明暗、一个决定动画起点），各不到 200 字节，合并省不下什么。
 */

/** 水合超时兜底。改这个数不用动 CSS —— 起点规则只认属性值，不认时长 */
const WATCHDOG_MS = 400

export function MotionGateScript() {
  const script = `(function(){var r=document.documentElement;r.dataset.anim='js';setTimeout(function(){if(r.dataset.anim==='js')r.dataset.anim='off'},${WATCHDOG_MS})})()`

  // 内容是上面这个常量字符串，不含任何外部输入
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
