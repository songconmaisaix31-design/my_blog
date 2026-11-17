<div align="center">

# David Wang 的博客 · my_blog

A Hugo blog on the Stack v4 theme, deployed to GitHub Pages on every push, with a hand-written floating music player.

一个跑在 Stack v4 主题上的 Hugo 博客，每次推送自动部署到 GitHub Pages，右下角是手写的悬浮音乐播放器。

[![Build and deploy](https://github.com/songconmaisaix31-design/my_blog/actions/workflows/deploy.yml/badge.svg)](https://github.com/songconmaisaix31-design/my_blog/actions/workflows/deploy.yml)
[![Update theme](https://github.com/songconmaisaix31-design/my_blog/actions/workflows/update-theme.yml/badge.svg)](https://github.com/songconmaisaix31-design/my_blog/actions/workflows/update-theme.yml)
![Hugo](https://img.shields.io/badge/hugo-extended-blue)
![Theme](https://img.shields.io/badge/theme-Stack%20v4-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

> **How to read this page / 怎么读这页**
> English first, then the same content in Chinese — not a summary, not a separate half.
> 每段英文在前，同一内容的中文紧跟在后；不是摘要，也没有单独的「中文版」。

---

## At a glance · 一眼看懂

| | |
|---|---|
| **What<br/>是什么** | A personal blog: Hugo with the Stack v4 theme as a Hugo Module, Chinese locale, GitHub Pages deployment, plus a music player the theme does not ship.<br/>一个个人博客：Hugo + Stack v4 主题（Hugo Module 方式）、中文本地化、GitHub Pages 部署，外加主题本身没有的音乐播放器。 |
| **Where<br/>在哪** | `baseurl` in [`config/_default/config.toml`](config/_default/config.toml) is `https://davidwang.space/`. The custom domain itself was not verified from this checkout.<br/>`config/_default/config.toml` 里的 `baseurl` 是 `https://davidwang.space/`。这个自定义域名本身没有在本仓库里验证过。 |
| **Cost<br/>代价** | To build locally you need Hugo **extended**, Go (for Hugo Modules), and Dart Sass. There is no npm build step.<br/>本地构建需要 Hugo **extended**、Go（给 Hugo Modules 用）和 Dart Sass。没有 npm 构建步骤。 |
| **Not<br/>不是** | Not a theme, not a starter template: this is one site's configuration and content. Comments are off, and `content/` holds 2 posts.<br/>不是主题、不是起始模板：这是一个站点自己的配置和内容。评论是关掉的，`content/` 里只有 2 篇文章。 |

## What is customized here · 这里改了什么

The site began from CaiJimmy's [hugo-theme-stack-starter](https://github.com/CaiJimmy/hugo-theme-stack-starter). Everything below is what differs from it.

站点从 CaiJimmy 的 [hugo-theme-stack-starter](https://github.com/CaiJimmy/hugo-theme-stack-starter) 开始。下面这些是与它的差别。

| Area · 位置 | Change · 改动 | File · 文件 |
|---|---|---|
| Locale · 本地化 | `zh-cn`, `hasCJKLanguage = true`, Chinese date formats, custom sidebar subtitle.<br/>`zh-cn`、`hasCJKLanguage = true`、中文日期格式、自定义侧栏副标题。 | `config/_default/{config,params}.toml` |
| Background · 背景 | Fixed full-page background image with a light/dark overlay so text stays readable.<br/>固定整页背景图，配浅色/深色遮罩保证正文可读。 | `layouts/_partials/footer/custom.html` |
| Music player · 音乐播放器 | Floating bottom-right player: playlist from `data/music/generated.json`, three play modes, volume, persisted state.<br/>右下角悬浮播放器：歌单来自 `data/music/generated.json`，三种播放模式、音量、状态持久化。 | `assets/js/music-player.js`, `assets/scss/music-player.scss` |
| Playlist build · 歌单生成 | Scans `static/music/*/` and writes the JSON the template reads.<br/>扫描 `static/music/*/`，写出模板读取的 JSON。 | `scripts/sync_music.py` |
| Design tokens · 设计变量 | Site-wide CSS variables: card radius, tag pill, font size, line height, image height.<br/>全站 CSS 变量：卡片圆角、标签胶囊、字号、行高、封面高度。 | `assets/scss/custom.scss` |
| Favicon · 站点图标 | `/favicon.ico` injected in `<head>`.<br/>在 `<head>` 里注入 `/favicon.ico`。 | `layouts/_partials/head/custom.html` |

## Music player · 音乐播放器

One directory per track, then one script, then commit the generated JSON. The full contract lives in [`static/music/README.md`](static/music/README.md).

一首歌一个目录，跑一个脚本，再把生成的 JSON 提交。完整约定见 [`static/music/README.md`](static/music/README.md)。

```text
static/music/<track>/
├── music.mp3      # audio (mp3/m4a/ogg/wav/flac) · 音频
├── cover.webp     # optional cover (jpg/jpeg/png/webp/avif) · 可选封面
└── info.json      # title / artist / album / order · 元数据
```

```bash
python scripts/sync_music.py                 # regenerate the playlist · 重新生成歌单
python -m json.tool data/music/generated.json   # check it · 检查结果
hugo server -D                               # preview at http://localhost:1313 · 本地预览
```

`data/music/generated.json` is committed on purpose, so the GitHub Actions build needs no Python. Directories starting with `.` or `_`, and any name starting with `example` / `template` / `sample`, are skipped — `static/music/example-track/` is the reference sample. The repo currently ships one track.

`data/music/generated.json` 是故意提交进仓库的，这样 GitHub Actions 构建时不需要 Python。以 `.` 或 `_` 开头的目录，以及以 `example` / `template` / `sample` 开头的名字会被跳过——`static/music/example-track/` 就是参考样例。仓库目前带了一首歌。

## Quickstart · 快速开始

### Requirements · 环境要求

**Hugo extended** (the theme needs the extended build for SCSS), Go (Hugo Modules resolve the theme through `go.mod`), and Dart Sass if you build CSS yourself. The devcontainer already provides all three.

**Hugo extended**（主题的 SCSS 需要 extended 版）、Go（Hugo Modules 通过 `go.mod` 解析主题），自己构建 CSS 还需要 Dart Sass。仓库的 devcontainer 已经装好这三样。

### 1. Serve locally · 本地起服务

```bash
hugo server -D
# drafts included at http://localhost:1313 · 含草稿，地址 http://localhost:1313
```

`hugo server` fetches the theme module on first run, which needs network access once. This repository was not built while writing this page, so no build output is claimed.

`hugo server` 首次运行会去取主题模块，需要一次网络访问。写这页时没有构建本仓库，所以这里不声称任何构建结果。

### 2. Write a post · 写一篇文章

```bash
hugo new content post/<slug>/index.md
```

Posts use page bundles: `content/post/<slug>/index.md` plus `cover.jpg` in the same folder, with `title` / `description` / `date` / `categories` / `tags` in the front matter.

文章用 page bundle 形式：`content/post/<slug>/index.md`，封面图 `cover.jpg` 放在同一目录，front matter 里写 `title` / `description` / `date` / `categories` / `tags`。

## Deploy · 部署

Two workflows, both real files in this repo.

两个工作流，都是仓库里真实存在的文件。

| Workflow · 工作流 | Trigger · 触发 | Does · 作用 |
|---|---|---|
| [`deploy.yml`](.github/workflows/deploy.yml) | Push to `main` or `master`, or manual dispatch.<br/>推送 `main` 或 `master`，或手动触发。 | Installs Go, Node, Dart Sass and Hugo extended, runs `hugo --gc --minify --baseURL <pages-url>`, uploads `./public`, deploys to GitHub Pages.<br/>装 Go、Node、Dart Sass 和 Hugo extended，跑 `hugo --gc --minify --baseURL <pages-url>`，上传 `./public`，部署到 GitHub Pages。 |
| [`update-theme.yml`](.github/workflows/update-theme.yml) | Daily at `00:00 UTC`, or manual dispatch.<br/>每天 `00:00 UTC`，或手动触发。 | Runs `hugo mod get -u` and `hugo mod tidy`, then auto-commits "CI: Update theme".<br/>跑 `hugo mod get -u` 和 `hugo mod tidy`，然后自动提交 “CI: Update theme”。 |

One setting has to match: in the repository settings, Pages → Build and deployment → Source must be **GitHub Actions**, otherwise `deploy.yml` has nowhere to publish.

有一项设置必须对上：仓库设置里 Pages → Build and deployment → Source 必须选 **GitHub Actions**，否则 `deploy.yml` 没有发布目标。

## Update the theme manually · 手动升级主题

The daily workflow does this for you; run it yourself when you want the change in your own commit.

每日工作流已经帮你做了；想把它放进自己的提交里时手动跑。

```bash
hugo mod get -u github.com/CaiJimmy/hugo-theme-stack/v4
hugo mod tidy
```

The theme is pinned in [`go.mod`](go.mod) at `v4.0.3` and imported through [`config/_default/module.toml`](config/_default/module.toml). With Go modules, a new major version has to be switched by hand in `module.toml` — that is a limitation of the module mechanism, not something `hugo mod get -u` handles.

主题在 [`go.mod`](go.mod) 里固定在 `v4.0.3`，通过 [`config/_default/module.toml`](config/_default/module.toml) 引入。用 Go modules 时，新的 major 版本必须在 `module.toml` 里手动切换——这是模块机制的限制，`hugo mod get -u` 管不了。

## Repository layout · 仓库结构

```text
my_blog/
├── config/_default/          # config.toml, params.toml, module.toml, menus, markup · 站点配置
├── content/
│   ├── post/                 # 2 page bundles with covers · 两个带封面的文章包
│   └── page/                 # about, archives, links, search · 四个独立页
├── layouts/_partials/        # head + footer overrides (favicon, background, player) · 局部覆盖
├── assets/                   # scss tokens, music-player.js, avatar, background, icons · 资源
├── static/
│   ├── music/                # one folder per track + README + example-track · 歌曲目录
│   └── favicon.ico
├── data/music/generated.json # committed playlist · 提交进仓库的歌单
├── scripts/sync_music.py     # static/music/*/ -> generated.json · 生成歌单
├── .github/workflows/        # deploy.yml, update-theme.yml · 两个工作流
├── .devcontainer/            # Hugo extended + Node 22 + Go + Dart Sass · 开发容器
├── go.mod / go.sum           # theme module pin · 主题版本锁定
└── LICENSE                   # MIT
```

## Status & limits · 状态与边界

One commit; the site was imported as a snapshot on 2026-10-18, so earlier history is not here. The last recorded change was adding `favicon.ico` and injecting it in `<head>`.

单个提交；站点在 2026-10-18 作为快照导入，更早的历史不在仓库里。最后一条记录是加 `favicon.ico` 并在 `<head>` 里注入。

Known limits, stated rather than hidden · 边界写出来而不是藏起来：

- **Two posts · 只有两篇文章.** `content/post/` holds two bundles. The rest of the site is the starter template's pages, and `content/page/about.md` is still close to its placeholder text.
- **Comments off · 评论关闭.** `comments.enabled = false`, `disqusShortname` is empty, and no provider is configured.
- **The custom domain is unverified · 自定义域名未验证.** `baseurl` says `https://davidwang.space/`; DNS, HTTPS, and Pages settings live outside this repo.
- **The music player runs from one JSON file · 播放器只有一个数据源.** A track that is added without re-running `sync_music.py` and committing `data/music/generated.json` will not appear; nothing validates that the two agree.
- **No tests · 没有测试.** There is no test suite. The only automatic checks are the two workflows: one build-deploy, one theme bump.
- **MIT inherited · 继承的 MIT.** The license file is the starter template's (`© 2021 Jimmy Cai`), not a separate grant for this site's posts.

## License · 许可

MIT — see [`LICENSE`](LICENSE). The text is the starter template's original MIT grant (`Copyright (c) 2021 Jimmy Cai`), kept as-is; the posts themselves are the author's own writing.

MIT，见 [`LICENSE`](LICENSE)。文件是起始模板原来的 MIT 授权（`Copyright (c) 2021 Jimmy Cai`），原样保留；文章内容是作者自己写的。
