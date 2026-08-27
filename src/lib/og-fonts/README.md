# OG 图用字体

`src/lib/og.tsx` 渲染 OG 图走 Satori，而 Satori 必须拿到字体二进制才能排版
（它不读 CSS，也不认 `next/font` 注入的变量），所以这两个文件必须提交进仓库。

- `anybody-800.ttf` —— Anybody wdth 125 / wght 800 的静态实例，站点的展示字体
- `spacegrotesk-300.ttf` —— Space Grotesk 300，站点的正文字体

都是 Google Fonts 的 latin 子集静态实例（各 ~60KB）。取法：

```bash
# 注意别带现代浏览器的 User-Agent —— 带了 Google 会回 woff2，Satori 不支持
curl -s "https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@125,800&subset=latin" \
  | grep -o 'https://fonts.gstatic.com[^)]*' | head -1 | xargs curl -o anybody-800.ttf
```

为什么不在构建期去网上拉：OG 图是构建期产物，多一个网络依赖就多一种
「构建在 CI 里偶发失败」的方式，而这两个文件一年也不会动一次。
