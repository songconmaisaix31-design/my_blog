---
title: "RE：从零开始的博客"
description: "折腾了两天把博客搭上线，过程中踩了不少坑。这篇顺手记一下，免得下次再踩。"
slug: "re-blog-from-zero"
date: 2026-08-20
image: cover.jpg
categories: ["教程"]
tags: ["Hugo", "GitHub Pages", "域名", "音乐播放器"]
draft: false
---

折腾了两天，博客总算能看了。本来没想写这篇，但中间踩的坑实在太多，有几个还特别邪门，不记下来下次还得再踩一遍。

技术栈没什么好纠结的：Hugo + Stack 主题 + GitHub Pages。理由就一句话，免费、够快、能挂自己的域名。主题用 Hugo Module 方式加载，好处是升级方便，坏处是本地构建得装 Go——这个后面再骂。

开头很顺。starter 模板的 GitHub Actions 已经配好了，push 到 master 自动构建部署。中文化也就是改几个文件：locale 设成 zh-cn、hasCJKLanguage 打开，标题副标题菜单改改，换上自己的头像和背景图。真正开始折磨人的是下面几件事。

## 头像只在首页显示

这个坑卡我最久。

现象特别怪：首页头像好好的，一进归档页、搜索页就裂了。我第一反应是路径写错了，翻来覆去查了好几遍，都没问题。

后来才搞明白，问题出在 `static/` 和 `assets/` 的区别上。我把头像放在了 `static/img/avatar.jpg`，但 Stack 主题渲染头像用的是 `resources.Get`，这玩意只认 `assets/` 目录。读不到的时候，主题就退回我写的原始路径 `img/avatar.jpg`——注意，前面没有斜杠。

于是首页因为恰好就在根目录，`img/avatar.jpg` 能解析对；子页面就变成了 `/archives/img/avatar.jpg` 这种鬼路径。最后把头像从 `static/` 挪到 `assets/`，问题当场没了。

说实话当时挺想骂人的。`static/` 和 `assets/` 表面看都是放资源的，结果一个是原样拷贝，一个走资源处理管线，完全两码事。这种坑不看源码根本想不到。

## 域名，和那个假 IP

绑域名本身不难。阿里云加几条解析记录，根域名用 A 记录指向 GitHub Pages 的四个 IP（`185.199.108~111.153`），`www` 用 CNAME。GitHub 那边设一下自定义域名，HTTPS 证书它自己就签好了。

难的是验证。我加完解析，本地 `nslookup` 一查，出来的 IP 是 `198.18.0.14`。这明显不对啊。我以为是阿里云那边没生效，来回查记录、改配置，折腾大半天。

最后发现是我自己电脑上的代理（Watt Toolkit）搞的鬼，它的 fake-IP 模式把本地所有 DNS 查询都劫持了。换公共 DoH 一查，解析其实早就生效了。合着我白折腾了一下午。

## 音乐播放器

这次最大的一块。需求就是右下角一个悬浮播放器，播本地音乐，能切歌、调进度、调音量、三种循环模式，刷新后状态还在。

实现上没引任何框架，原生 JS 加 SCSS，通过 Hugo 的模板覆盖机制塞进去，主题源码一行没动。加歌就靠一个 Python 脚本扫目录生成歌单 JSON，这样 CI 那边不用额外装 Python。

中间也踩了几个小坑，顺手记一下：

- 往页面注入歌单 JSON 时，我先用了 `jsonify | safeHTML`，结果输出被二次转义成 `"[{\"title\":...}]"` 这种鬼样子。查了半天才明白 `<script>` 里是 JS 上下文，得用 `safeJS` 才不会被包成字符串。
- 构建报 `.Site.Data` 弃用警告，Hugo 新版让改成 `hugo.Data`。
- 加了个邮箱入口，结果主题的图标集里压根没有 `mail.svg`，直接构建失败，还得自己补个图标。

## 本地构建要 Go

这个和播放器没关系，但挺坑的。因为主题是 Module 方式加载，本地 `hugo` 构建要调 `go` 去拉模块。我机器上 Go 是装了，但装在 `C:\Users\DW\go-sdk\go\bin`，不在 PATH 里，而且直连 Go 官方代理还会卡住。

每次构建前都得先跑这么一段：

```powershell
$env:PATH='C:\Users\DW\go-sdk\go\bin;'+$env:PATH
$env:GOPROXY='https://goproxy.cn,direct'
hugo server -D
```

第一次撞上那个报错的时候，我还以为 Hugo 坏了。

## 现在能用了

第一首歌放的是《Numb》，播放器跑得动，域名也是自己的了。

接下来才是最难的部分：持续写。这个我不立 flag 了，能写几篇算几篇。
