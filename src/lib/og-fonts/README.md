# OG 图用字体

`src/lib/og.tsx` 渲染 OG 图走 Satori，而 Satori 必须拿到字体二进制才能排版
（它不读 CSS，也不认 `next/font` 注入的变量），所以这两个文件必须提交进仓库。

- `figtree-800.ttf` —— Figtree ExtraBold，站内标题用的那一档
- `figtree-500.ttf` —— Figtree Medium，正文与元信息

站内只用 Figtree 这一款字（选它的理由见 `src/styles/globals.css` 顶部），
OG 图跟着用同一款的两个字重。取的是静态实例（各 ~39KB）：

```bash
curl -sL -o figtree-800.ttf \
  "https://cdn.jsdelivr.net/npm/@expo-google-fonts/figtree/Figtree_800ExtraBold.ttf"
curl -sL -o figtree-500.ttf \
  "https://cdn.jsdelivr.net/npm/@expo-google-fonts/figtree/Figtree_500Medium.ttf"
```

**为什么不从 Google Fonts 取**：`google/fonts` 仓库里 Figtree 只有可变字体
（`Figtree[wght].ttf`），而 Satori 拿到可变字体只会渲染它的默认实例（wght 400），
标题就永远粗不起来。`fonts.googleapis.com` 那条路给的是 woff2，Satori 也不支持。
`@expo-google-fonts/*` 这个 npm 包里是逐字重切好的静态 TTF，正合用。

**为什么不在构建期去网上拉**：OG 图是构建期产物，多一个网络依赖就多一种
「构建在 CI 里偶发失败」的方式，而这两个文件一年也不会动一次。
