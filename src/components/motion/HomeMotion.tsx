'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

/**
 * 首页的入场编排与袋鼠的交互。**只有首页加载这一份 JS**（见 app/[locale]/page.tsx）。
 *
 * ── 为什么这一段值得上 GSAP ──
 * 站里绝大多数动画留在 `motion.css` 里，纯 CSS 更省。搬到 JS 只为三件 CSS 做不到的事：
 *   1. **落地的因果**：袋鼠触地那一帧，脚下白丘被压出去一圈、袋鼠自己挤一下。
 *      两者要对到 ±30ms，CSS 只能各写 delay，改一处就得重算另一处。
 *   2. **一条时间线管全部**：八个元素的先后关系写在下面那一段里，调节奏改一个数。
 *   3. **可中断的指针交互**：侧倾要「往新目标平滑改道」，CSS 的 transition 做不到。
 * 常驻的三层云横漂**没有**搬进来 —— 它在 CSS 里零成本，见下面「与 CSS 的分工」。
 *
 * ── 与 CSS 的分工（关键前提）──
 * `motion.css` 里的横漂用的是 `translate` **独立属性**，而 GSAP 写 `transform`。
 * CSS Transforms L2 规定两者分开合成（translate → rotate → scale → transform），
 * 所以**不是互相覆盖而是叠加**：云可以一边被 GSAP 抬起来、一边按 CSS 的周期横漂，
 * 各跑各的，谁也不用知道对方存在。这条也是当初那些 keyframes 写成
 * `translate:` 而不是 `transform:` 的好处，别改回简写。
 *
 * ── 首帧从哪来 ──
 * 起点（`opacity: 0` 等）由 CSS 在 `html[data-anim='js']` 下给出，整套机制见
 * `components/layout/motion-gate.tsx`。这里只做两件相关的事：
 *   - 读 `data-anim`：值是 `off` 说明兜底计时已经先把内容放出来了，这时再播入场
 *     就是「出现又消失」，所以直接跳到终态（`fresh`）；
 *   - 把它翻成 `run`：一举两得 —— 解除兜底计时，同时让 CSS 那条起点规则失效，
 *     之后由 GSAP 写下的行内样式说话。**必须排在所有 `mm.add()` 之后**：
 *     那些回调是同步执行的，得先让它们写完行内起点，再放开 CSS 的起点。
 * `useGSAP` 走的是 `useLayoutEffect`，在绘制前跑完，所以客户端路由再回首页时
 * 即便没有 CSS 起点也不会闪 —— 那时 `data-anim` 已经是 `run`，入场照样重播。
 */

/** 袋鼠离手的时刻 */
const DROP = 0.28
/**
 * 触地的时刻。整套入场里唯一需要精确对位的一帧 —— 白丘的扩散、袋鼠的挤压
 * 都挂在它上面。落在 0.72s 是有意的：主角就位卡在 1s 以内，读作「打开就在那儿」，
 * 再晚就成了「等它演完」。
 */
const LAND = 0.72
/** 回弹收干净的时刻，呼吸从这儿接上（LAND + 挤压 0.08 + 回弹 0.5） */
const SETTLE = 1.3

/** 指针侧倾的最大角度。它是坐着的，再大就成了「贴纸跟着鼠标转」 */
const TILT = 2.5

export function HomeMotion() {
  useGSAP(() => {
    const root = document.documentElement
    /*
     * 编排跨 `.sky`（装饰层，在 SiteFrame 里）和 `.home`（在 page.tsx 里）两棵子树，
     * 两者没有共同的客户端边界 —— 要拿到一个 ref 就得把 SiteFrame 整个变成
     * 客户端组件，代价远大于这一次 querySelector。所以本组件不渲染任何 DOM。
     */
    const home = document.querySelector<HTMLElement>('.frame--home')
    if (!home) return

    const fresh = root.dataset.anim !== 'off'
    const q = <T extends Element>(sel: string) => gsap.utils.toArray<T>(sel, home)

    const mm = gsap.matchMedia()

    /* -----------------------------------------------------------------------
     * 入场 + 常驻 + 彩蛋。整块关在「不介意动效」里 ——
     * 包括点一下弹一跳：那只袋鼠是 aria-hidden 的装饰，弹跳不是任何功能控件的反馈，
     * 减少动态时丢掉一个彩蛋不损失任何东西。
     * -------------------------------------------------------------------- */
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [roo] = q<HTMLElement>('.home__roo')
      const [perch] = q<HTMLElement>('.home__perch')
      if (!roo || !perch) return

      /* 挤压和侧倾都绕「屁股」转。绕中心转的话它会像一张贴纸在打旋 */
      gsap.set(roo, { transformOrigin: '50% 100%' })

      /*
       * 常驻呼吸。先建好、保持暂停，由下面时间线末尾那声 call 放行 ——
       * 留在 CSS 里就得手写一个和入场总长对齐的 delay，入场一改节奏就错位。
       */
      const bob = gsap.to(roo, {
        yPercent: -2.6,
        duration: 2.3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: true,
      })

      /*
       * `lazy: false` 不能删，它防的是一帧闪回（踩过一次，CDP 逐帧取样才看出来）。
       * GSAP 默认「惰性渲染」：`fromTo` 的起点不在建补间时写下去，而是攒到下一个
       * ticker tick 再写，好省一次布局。可下面那句 `data-anim = 'run'` 是同步执行的，
       * 于是夹出一帧「CSS 起点已失效、GSAP 起点还没写」的空档 —— 首页以终态闪一下，
       * 下一帧才被拽回起点。宽屏上多半采不到，390px 上稳定复现。
       */
      const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.out', lazy: false } })

      if (fresh) {
        /*
         * **云不参与入场。** 那片天从第一帧起就是成品，只有横漂（在 CSS 里）。
         *
         * 先淡入过一版：三层全透明的那 0.6 秒里，本该被纸色云盖住的天与纸交界
         * 露成一道横贯全宽的直边。改成只做位移（远 16 / 中 22 / 近 26 个单位）
         * 之后交界不再露，但宽屏上另一个问题浮出来 —— 云的画布是横向拉伸的，
         * 在 2000px 宽的屏上每团云被拉成扁而阔的椭圆，整条云带本来就是一片大面积
         * 软过渡；再让这片过渡整体上移，中段就是一整块白在缓慢挪动，很脏。
         *
         * 天空是背景，不是演员。入场从袋鼠开始。
         */

        /*
         * 1 · 白丘浮起。它是 `.home__perch::before`，伪元素 GSAP 选不中，
         * 所以改成父元素上的两个自定义属性驱动（见 site.css）。
         * 它比袋鼠先一点浮起来，不然袋鼠落下时它已经在那儿等着了。
         */
        tl.fromTo(perch, { '--perch-o': 0, '--perch-s': 0.86 }, { '--perch-o': 1, '--perch-s': 1 }, 0.18)

        /*
         * 2 · 袋鼠下落。透明度单独一条更快的补间：一个还半透明的东西砸到地上很怪，
         * 得在触地前就实。（同一条补间里没法给两个属性配不同的 ease。）
         */
        tl.fromTo(roo, { opacity: 0 }, { opacity: 1, duration: 0.26, ease: 'none' }, DROP)
        /* 加速下落 + 一点纵向拉伸，正好在触地那一帧回到中性 */
        tl.fromTo(
          roo,
          { yPercent: 20, scaleY: 1.04, scaleX: 0.97 },
          { yPercent: 0, scaleY: 1, scaleX: 1, duration: LAND - DROP, ease: 'power2.in' },
          DROP,
        )

        /*
         * 3 · 触地。**整套动画的理由就在这四行**：落地的压强传到地面 ——
         * 袋鼠挤一下再弹回来，白丘同时被压得往外扩一圈。
         * 一个位图角色因此有了重量；原来那条 `roo-drop` 只是「淡入 + 下落」，落点是空的。
         */
        tl.to(roo, { scaleY: 0.93, scaleX: 1.06, duration: 0.08 }, LAND)
        tl.to(roo, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.42)' }, LAND + 0.08)
        tl.to(perch, { '--perch-s': 1.08, duration: 0.1 }, LAND)
        tl.to(perch, { '--perch-s': 1, duration: 0.42 }, LAND + 0.1)

        /*
         * 4 · 到此为止 —— **正文与右栏不参与入场**，它们从第一帧就在那儿。
         *
         * 头条那几行逐条上浮试过一版：文章流不在 gate 里（它大半在折叠以下，
         * 逐条揭示要监听滚动，而这个站不监听滚动），于是有半秒钟「第一篇是空的、
         * 第二篇却好好地摆在下面」，中间一块两百多像素的白 —— 读者读作页面坏了，
         * 不是读作动画。装饰可以慢慢到位，读物不能。
         */
      }

      tl.call(() => bob.play(), undefined, fresh ? SETTLE : 0)

      /*
       * 点一下弹一跳。彩蛋，和商标里那颗袋鼠头 hover 一跳同级。
       * 不给 tabindex —— 它是装饰，不该出现在 Tab 序列里。
       * 呼吸和它抢同一个 yPercent，所以先按停、跳完再从头放；
       * 入场还没演完时不接受输入，否则两条补间会抢着写同一个 transform。
       */
      let hop: gsap.core.Timeline | null = null
      const onDown = () => {
        if (tl.isActive()) return
        hop?.kill()
        bob.pause()
        hop = gsap
          .timeline({ onComplete: () => bob.restart() })
          .to(roo, { yPercent: -9, scaleY: 1.05, scaleX: 0.96, duration: 0.22, ease: 'power2.out' })
          .to(roo, { yPercent: 0, scaleY: 1, scaleX: 1, duration: 0.46, ease: 'bounce.out' })
      }
      perch.addEventListener('pointerdown', onDown)

      /* 事件监听和这条 hop 都是回调里现建的，context 收不到，得自己收 */
      return () => {
        perch.removeEventListener('pointerdown', onDown)
        hop?.kill()
      }
    })

    /* -----------------------------------------------------------------------
     * 指针侧倾。查询是上面那条的子集，所以上面的 transformOrigin 一定先设好了。
     * 只在真有 hover 的设备上装：触屏上 pointermove 只在按住时来，
     * 表现是「必须先摸住它才会动」，不如不给。
     * -------------------------------------------------------------------- */
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const [roo] = q<HTMLElement>('.home__roo')
      const [perch] = q<HTMLElement>('.home__perch')
      if (!roo || !perch) return

      /* quickTo 而不是每次 gsap.to：它复用同一条补间，往新角度平滑改道，不会抖 */
      const tiltTo = gsap.quickTo(roo, 'rotation', { duration: 0.5, ease: 'power3' })
      const clamp = gsap.utils.clamp(-1, 1)

      const onMove = (event: PointerEvent) => {
        const box = perch.getBoundingClientRect()
        const half = box.width / 2
        if (!half) return
        tiltTo(clamp((event.clientX - (box.left + half)) / half) * TILT)
      }
      const onLeave = () => tiltTo(0)

      perch.addEventListener('pointermove', onMove)
      perch.addEventListener('pointerleave', onLeave)

      return () => {
        perch.removeEventListener('pointermove', onMove)
        perch.removeEventListener('pointerleave', onLeave)
      }
    })

    root.dataset.anim = 'run'

    return () => mm.revert()
  })

  return null
}
