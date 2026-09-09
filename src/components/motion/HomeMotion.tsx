'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

/**
 * 首页的入场编排与袋鼠的交互。**只有首页加载这一份 JS**（见 app/page.tsx）。
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
const DROP = 0.1
/**
 * 触地的时刻。整套入场里唯一需要精确对位的一帧 —— 白丘的扩散、袋鼠的挤压
 * 都挂在它上面。
 *
 * 从 0.72 提到 0.36 是有原因的。袋鼠显示高度 309px，早先落差 20%（61.8px）、
 * 时长 0.44s、`power2.in`，末速 `2d/T ≈ 281 px/s`；同样距离自由落体只要 0.058s、
 * 末速 2140 px/s —— 慢了 7.6 倍。那不是「落下」，是「被放下来」，
 * 后面那记挤压于是读作按表演出而不是撞出来的。现在落差 31%（96px）、时长 0.26s、
 * 曲线末段斜率 2.67，末速约 980 px/s，是原来的 3.5 倍。
 */
const LAND = 0.36
/** 旋转那条最慢的补间收干净的时刻，呼吸从这儿接上（LAND + 0.07 + 0.62） */
const SETTLE = 1.05

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

      /* 挤压、旋转、侧倾都绕「屁股」转。绕中心转的话它会像一张贴纸在打旋 */
      gsap.set(roo, { transformOrigin: '50% 100%' })

      /*
       * 下落曲线。控制点 (0.25,0.25) 与 (0.85,0.6)：初始斜率 y1/x1 = 1.0，
       * 末段斜率 (1−y2)/(1−x2) = 2.67 —— 一出现就以平均速度在动，撞进去时是
       * 平均速度的 2.67 倍。内置 ease 里没有这个形状（`.in` 全部零速起步）。
       * 在回调里注册而不是模块顶层：客户端组件在服务端也会被求值一次，
       * 插件注册留在浏览器侧更省心。
       */
      gsap.registerPlugin(CustomEase)
      const FALL = CustomEase.create('rooFall', 'M0,0 C0.25,0.25 0.85,0.6 1,1')

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
         * **云和正文都不参与入场。** 那片天从第一帧起就是成品，只有横漂（在 CSS 里）。
         *
         * 云试过两版都退了：先淡入 —— 三层全透明的那 0.6 秒里，本该被纸色云盖住的
         * 天与纸交界露成一道横贯全宽的直边；改成只做位移之后交界不再露，但宽屏上
         * 云的画布是横向拉伸的，那条云带本身就是一片大面积软过渡，整体上移就是
         * 一块白在缓慢挪动，更脏。天空是背景，不是演员。
         *
         * 正文也试过逐条上浮 —— 文章流不参与入场（逐条揭示要监听滚动，而这个站
         * 不监听滚动），于是有半秒钟「第一篇是空的、第二篇却好好地摆在下面」，
         * 中间一块两百多像素的白。装饰可以慢慢到位，读物不能。
         *
         * 所以整段入场只有两个演员：袋鼠，和它脚下那座白丘。
         */

        /*
         * 1 · 白丘先浮起来一点。它是 `.home__perch::before`，伪元素 GSAP 选不中，
         * 所以改成父元素上的两个自定义属性驱动（见 site.css）。
         * 比袋鼠早 0.04s —— 不然袋鼠落下时它已经在那儿等着了。
         */
        tl.fromTo(perch, { '--perch-o': 0, '--perch-s': 0.9 }, { '--perch-o': 1, '--perch-s': 1, duration: 0.34 }, 0.06)

        /*
         * 2 · 下落。这条曲线是整段里最关键的一处。
         *
         * **`.in` 系的内置 ease 全是零速起步**（power/expo/circ/sine 皆然），
         * 于是袋鼠会先在半空中静止一瞬再启动 —— 那正是「生硬」的最大来源：
         * 进场的东西应该自带速度。所以这里用 CustomEase 画一条初始斜率 1.0
         * （= 一出现就以平均速度在动）、末段斜率 2.67（撞进去）的曲线。
         * 换回 `power2.in` 试过，那一瞬的停顿肉眼可辨。
         *
         * 同时给它弧线和旋转：`xPercent` 从 3.5（≈10px）收回 0，`rotation` 从 −5°
         * 过冲到 +1.5°。位图刚体唯一能 articulate 的部件就是整体旋转 ——
         * 纯竖直平移读作沿轨道下降，加上这一点摆动才读作重心在转移。
         * 旋转中心是「屁股」（上面那句 transformOrigin），所以它像坐着的东西在晃。
         *
         * 透明度单独一条更快的补间，在下落前 40% 就收完：一个还半透明的东西
         * 砸到地上很怪，而且前 100ms 一只半透明且不动的袋鼠读作「贴图被打开」。
         */
        tl.fromTo(roo, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power1.out' }, DROP)
        tl.fromTo(
          roo,
          { yPercent: -31, xPercent: 3.5, rotation: -5, scaleY: 1.06, scaleX: 0.96 },
          {
            yPercent: 0,
            xPercent: 0,
            rotation: 1.5,
            scaleY: 1,
            scaleX: 1,
            duration: LAND - DROP,
            ease: FALL,
          },
          DROP,
        )

        /*
         * 3 · 触地。**整套动画的理由就在这两行**：落地的压强传到地面 ——
         * 袋鼠挤一下，白丘同时被压得往外扩一圈。两者对在同一帧上（实测如此），
         * 这是纯 CSS 做不到的事，也是当初引 GSAP 的唯一理由。
         */
        tl.to(roo, { scaleY: 0.9, scaleX: 1.08, duration: 0.07 }, LAND)
        tl.to(perch, { '--perch-s': 1.1, duration: 0.05 }, LAND)

        /*
         * 4 · 收势。**三样东西挂在三个不同时钟上**，这就是「跟随」：
         *   缩放 0.30s 先收干净（身体最快恢复形状）
         *   位置 0.16 + 0.20s 小反弹一次（质心继续往下再回来，只有缩放在弹是不够的）
         *   旋转 0.62s 最后才停（幅度最小、时间最长，读作余振）
         * 早先这三样共用一条 0.5s 的 elastic，同一刻一起收干净 —— 那是机械感的来源。
         * 白丘的回落 0.55s 比身体慢，读作地面在吸收。
         */
        tl.to(roo, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'back.out(2.2)' }, LAND + 0.07)
        tl.to(roo, { yPercent: -3, duration: 0.16, ease: 'power2.out' }, LAND + 0.07)
        tl.to(roo, { yPercent: 0, duration: 0.2, ease: 'power2.in' }, LAND + 0.23)
        tl.to(roo, { rotation: 0, duration: 0.62, ease: 'elastic.out(0.8, 0.5)' }, LAND + 0.07)
        tl.to(perch, { '--perch-s': 1, duration: 0.55, ease: 'power2.out' }, LAND + 0.05)
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
