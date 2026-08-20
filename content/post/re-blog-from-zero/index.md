---
title: "RE：从零开始的博客"
description: "从 Hugo 到 GitHub Pages 自定义域名，再到一个自研的右下角音乐播放器——记录我把个人博客从零搭起来的完整过程、踩过的坑和复盘。"
slug: "re-blog-from-zero"
date: 2026-08-20
categories: ["教程"]
tags: ["Hugo", "GitHub Pages", "域名", "音乐播放器"]
draft: false
---

建这个博客前后折腾了两天，从「用哪个框架」到「为什么头像只在首页显示」，再到「自己写一个音乐播放器」。趁热把它记下来，既是复盘，也是给以后想搭博客的自己（和任何人）留一份备忘。

## 为什么自己搭

现成的写作平台很多，但都不完全是我的：要么有平台烙印，要么不能挂自己的域名，要么改不了细节。我想要的是一个**完全属于自己、能挂自己域名、想加什么功能就加什么**的空间。于是选择了静态博客这条路。

## 技术选型

- **Hugo**：静态站点生成器，构建快，主题生态成熟。
- **Stack 主题**：干净克制，原生支持深浅色、搜索、归档，对 CJK（中文）友好。
- **GitHub Pages**：免费托管，配 GitHub Actions 自动部署。
- **阿里云域名** `davidwang.space`：几块钱一年的自定义域名，把站点从 `xxx.github.io/my_blog/` 变成自己的域名。

主题用 **Hugo Module** 方式加载（而不是把主题源码复制进仓库），好处是主题升级方便，坏处是——本地构建得装 Go（后面会讲）。

## 主线：从 clone 到上线

1. **初始化**：用 Stack 的 starter 模板，GitHub Actions 已经配好「push 到 master → 自动构建部署」。
2. **中文化**：`config.toml` 改 `locale = "zh-cn"`、`hasCJKLanguage = true`；`params.toml` 改副标题、头像、footer；`menu.toml` 加首页/归档/关于。
3. **个性化**：标题改成 `David Wang`，副标题「全栈探索中，谢谢关注喵~」，菜单精简，换了背景图和头像。
4. **绑定域名**：阿里云 DNS 加解析记录 + GitHub 侧设自定义域名，HTTPS 证书自动签发。
5. **音乐播放器**：自己写一个右下角悬浮播放器（重头戏，单独一节）。
6. **第一首歌**：《Numb》放进 `static/music/`，跑同步脚本，上线。

## 重头戏：自研音乐播放器

需求一句话：**右下角悬浮播放器，播本地音乐，能切歌、调进度、调音量、三种播放模式，刷新后恢复状态**。

架构分三层，全部通过 Hugo 的根目录覆盖机制实现，**一行主题源码都没改**：

```
scripts/sync_music.py         # 扫描 static/music/，生成歌单
data/music/generated.json     # 歌单数据（提交进 Git，CI 不用装 Python）
assets/js/music-player.js     # 原生 JS 播放器（零依赖）
assets/scss/music-player.scss # 样式（CSS 变量适配深浅色）
layouts/_partials/footer/custom.html  # 注入容器 + 歌单 JSON + 脚本
```

歌曲规范很简单：每首歌一个目录，`music.mp3` + 可选 `cover` + `info.json`。加歌就三步：

```bash
# 1. 把音频放进 static/music/<歌名>/
# 2. 生成歌单
python scripts/sync_music.py
# 3. 提交 歌曲目录 + generated.json
```

播放器用原生 JS 实现，不引框架；状态存 `localStorage`（key 带版本号 `br_music_player_v1`），刷新后恢复歌曲、进度、音量、模式，但**不自动播放**（尊重浏览器策略）。空歌单时直接不渲染，不报错。

## 踩过的坑（重点）

### 1. 头像只在首页显示，子页面全挂

这是最迷惑的一个。现象：首页头像正常，归档/搜索/关于页头像裂开。

排查后发现：头像放在了 `static/img/avatar.jpg`，而 Stack 主题渲染头像走的是 `resources.Get`（只从 `assets/` 目录读资源）。读不到时，主题回退成原始相对路径 `img/avatar.jpg`——**没有前导斜杠**。首页因为路径恰好在根目录所以能显示，子页面 `img/avatar.jpg` 被解析成 `/archives/img/avatar.jpg` 这种错误路径。

**修复**：把头像从 `static/img/` 移到 `assets/img/`，让主题的 `resources.Get` 正常读到，生成根相对路径 `/img/avatar.jpg`，处处可用。

> 教训：`static/` 和 `assets/` 是两套管线——`static/` 原样拷贝，`assets/` 走 Hugo 资源处理。凡是主题用 `resources.Get` 读的东西，都要放 `assets/`。

### 2. 歌单 JSON 注入 `<script>` 被二次转义

往页面注入歌单时，我先写了 `{{ $playlist | jsonify | safeHTML }}`，结果输出变成了 `"[{\"title\":...}]"`——JSON 被包成了字符串还转了义。

原因是 `<script>` 标签内部是 **JS 上下文**，Hugo 会把非 `safeJS` 的内容按 JS 字符串转义。改成 `{{ $playlist | jsonify | safeJS }}` 才得到干净的 `[{...}]`。

### 3. `.Site.Data` 弃用警告

Hugo v0.156 起 `.Site.Data` 被弃用，构建时警告「Use hugo.Data instead」。改成 `hugo.Data.music.generated` 后警告消失。版本升级是持续的债。

### 4. 本地构建要装 Go + 换 GOPROXY

因为主题是 Hugo Module 方式加载，`hugo` 构建时要调 `go` 拉模块。我机器上 Go 装在 `C:\Users\DW\go-sdk\go\bin`（不在 PATH），而且直连 `proxy.golang.org` 会卡住。每次构建前要：

```powershell
$env:PATH='C:\Users\DW\go-sdk\go\bin;'+$env:PATH
$env:GOPROXY='https://goproxy.cn,direct'
hugo server -D
```

### 5. 域名解析与代理 DNS 劫持

根域名绑 GitHub Pages 要用 **A 记录**指向 GitHub 的四个 IP（`185.199.108~111.153`），`www` 用 **CNAME** 指向 `xxx.github.io`。用阿里云 CLI 加完解析后，本地 `nslookup` 出来的却是 `198.18.0.14`——这是个假 IP。查了半天，原来是本地代理（Watt Toolkit）的 fake-IP 模式劫持了 DNS。换公共 DoH 查询才确认解析是对的。

### 6. 主题缺 `mail.svg` 图标

菜单加了邮箱入口，用 `icon = "mail"`，构建直接报错：主题的图标集里没有 `mail.svg`。补了一个 Tabler 风格的 `mail.svg` 到 `assets/icons/` 解决。

## 复盘

**学到的东西**：
- Hugo 的 `static/` 和 `assets/` 两套资源管线，以及 Hugo Pipes（minify/fingerprint）；
- GitHub Pages 自定义域名的 DNS 细节（根域名 A 记录 vs 子域名 CNAME）；
- 原生 `<audio>` 的播放控制、`play()` Promise、`localStorage` 状态恢复；
- 用模板注入 JSON 的转义陷阱（`safeHTML` vs `safeJS`）。

**还没做的**：
- PJAX：站内跳转时音乐不断播（播放器要放到替换容器之外）；
- 更多歌曲、更好的封面管理；
- 写更多文章，把博客真正用起来。

---

这就是「从零开始」的全过程。博客这东西，最难的不是搭起来，而是**持续写下去**。这篇是第一篇，希望不是最后一篇。
