<div align="center">

[English](./README.md) | **中文**

</div>
<div align="center">
<img src="./assets/icon.png" height="95" />
<br />
<img src="https://img.shields.io/badge/dynamic/json?label=Release&query=version&url=https://raw.githubusercontent.com/Future-Scholars/paperlib/master/package.json" />
<img src="https://img.shields.io/github/license/Future-Scholars/paperlib" />
<img src="https://img.shields.io/github/stars/Future-Scholars/paperlib" />
<h2><a href="https://paperlib.app/" > Paperlib </a></h2>
一个开源的学术论文管理工具。
</div>

<p align='center'>
加入我们的<a href="https://discord.gg/4unrSRjcM9"> Discord 社区</a>！
</p>


<p align='center'>
<a href='https://paperlib.app/en/'>网页</a> | <a href='https://paperlib.app/en/download.html'>下载</a> | <a href='https://paperlib.app/en/doc/getting-started.html'>快速开始</a> | <a href='https://github.com/users/Future-Scholars/projects/1/views/1'>路线图</a>
</p>

![](./assets/ui.png)

---

📣 **我正在寻找有人和我一起开发 Paperlib。** 📣

如果你有兴趣，请联系我。

## 简介

我是一名计算机科学博士生。在我的研究社区，会议论文是主要的形式，这与其他学科有所不同。很多会议论文很难查找到 DOI、ISBN、元数据（例如 NIPS、ICLR 等）。当我在草稿中引用一篇出版物时，我需要反复在 Google Scholar 或 DBLP 中手动搜索它的出版信息。

**为什么不用 Zotero, Mendely?**

- 元数据抓取能力是论文管理工具的核心功能之一。遗憾的是，世界上没有任何软件做得很好，甚至商业软件也不行。

- 现代的用户界面。没有额外的无用功能。

我们可能需要做的是：导入一篇论文，尽可能准确地抓取它的元数据，简单地组织库，并在我们写论文时将它导出到 BibTex。

那就是 Paperlib。

## 特点
- 使用多种抓取器抓取论文的元数据。支持编写您的元数据抓取器。为许多学科量身定制（还在增加中）：
    - [x] **通用**
        - [x] arXiv
        - [x] doi.org
        - [x] Semantic Scholar
        - [x] Crossref
        - [x] Google Scholar
        - [x] Springer
        - [x] Elseivier Scopus
    - [x] **计算机科学与电子工程**
        - [x] openreview.net
        - [x] IEEE
        - [x] DBLP
        - [x] Paper with Code (scrape available in the code repository)
    - [x] **地球科学**
    - [x] **物理学**
        - [x] NASA Astrophysics Data System
        - [x] SPIE: Inte. Society for Optics and Photonics
    - [ ] **化学**
        - [x] ChemRxiv
    - [ ] **生物学**
        - [x] BioRxiv / MedRxiv

    - ...
- 全文和高级搜索。
- 评级、标记、标签、文件夹和 markdown/纯文本注释。
- RSS 订阅，跟踪您的研究主题上的最新出版物。
- 从网络上找到并下载 PDF 文件。
- 类似于 macOS spotlight 的插件，便于在草稿中轻松复制粘贴引用。也支持 MS Word。
- 云同步，支持 macOS、Linux 和 Windows。
- 美观和清洁的 UI。

## 下载与安装

<a href="https://paperlib.app/en/download.html" style="font-size: 16px"> » 在这里下载 « </a>

### Windows

⚠️ 当你在 Windows 上安装 Paperlib 时，你可能会注意到一个警告。原因是 Paperlib 没有代码签名，因为它太昂贵了。Paperlib 的源代码可以在 electron branch 找到。它不会损害你的电脑，也永远不会收集任何个人信息。请确保你正在使用 HTTPS 和我们的官方网页或 Github 下载安装程序。当你安装 `latest.exe`时，在 "Windows protected your PC" 窗口中，请点击 `More info` 和 `Run anyway`。

### macOS

⚠️ 你可能需要点击 `preference` - `Security & Privacy` - `run anyway`。

### Linux

参见 [这里](https://paperlib.app/cn/download-linux.html)。

## 快速开始

[介绍 (EN)](https://paperlib.app/en/doc/getting-started.html)  
[介绍 (CN)](https://paperlib.app/cn/doc/getting-started.html)

## 捐赠

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="./assets/wechat.png" alt="Buy Me A Coffee" height="174" width="174"></a>

## 赞助

### Apple Silicon 构建
<img src="https://user-images.githubusercontent.com/14183213/179353324-42ee9831-68a8-4816-97f5-cc7be7189ce8.png" style="width: 160px"/>


## 为 Paperlib 做贡献

### 元数据抓取器
我的研究主题是计算机视觉，这只是计算机科学的一部分。我尝试联系一些朋友，提供不同学科的论文元数据数据库的信息。然而，然而，它并没有覆盖所有的学科。如果[内置元数据抓取器](https://github.com/Future-Scholars/paperlib/tree/master/app/repositories/scraper-repository/scrapers)不适合你的研究，随时开启一个问题或者拉取请求。

### 新功能

我对任何新功能请求都持开放态度，我们可以在问题中讨论。

## 许可

[GPL-3.0 License](./LICENSE)
