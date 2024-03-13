<div align="center">
<img src="./assets/icon.png" height="95" />
<br />
<img src="https://img.shields.io/badge/dynamic/json?label=Release&query=version&url=https://raw.githubusercontent.com/Future-Scholars/paperlib/master/package.json" />
<img src="https://img.shields.io/github/license/Future-Scholars/paperlib" />
<img src="https://img.shields.io/github/stars/Future-Scholars/paperlib" />
<h2><a href="https://paperlib.app/" > Paperlib </a></h2>
An open-source academic paper management tool.
</div>

<p align='center'>
Join our <a href="https://discord.gg/4unrSRjcM9">Discord community</a>!
</p>

<p align='center'>
<a href='https://paperlib.app/en/'>Webpage</a> | <a href='https://paperlib.app/en/download.html'>Download</a> | <a href='https://paperlib.app/en/doc/getting-started.html'>Quick Start</a> | <a href='https://github.com/users/Future-Scholars/projects/1/views/1'>Roadmap</a>
</p>

![](./assets/ui.png)

---

📣 **I'm looking for someone to work with me on developing Paperlib.** 📣

If you are interested please contact me.

## Introduction

I'm a computer science PhD student. Conference papers are in major in my research community, which is different from other disciplines. Without DOI, ISBN, metadata of a lot of conference papers are hard to look up (e.g., NIPS, ICLR etc.). When I cite a publication in a draft paper, I need to manually search the publication information of it in Google Scholar or DBLP over and over again.

**Why not Zotero, Mendely?**

- A good metadata scraping capability is one of the core functions of a paper management tool. Unfortunately, no software in this world does this well, not even commercial software.

- A modern UI. No extra useless features.

What we need may be to: import a paper, scrape the metadata of it as accurately as possible, simply organise the library, and export it to BibTex when we are writing our papers.

That is Paperlib.

## Highlights

- Scrape paper’s metadata with many scrapers. Support writing your metadata scrapers. Tailored for many disciplines (still growing):

  - [x] **General**
    - [x] arXiv
    - [x] doi.org
    - [x] Semantic Scholar
    - [x] Crossref
    - [x] Google Scholar
    - [x] Springer
    - [x] Elseivier Scopus
  - [x] **Computer Science and Electronic Engineering**
    - [x] openreview.net
    - [x] IEEE
    - [x] DBLP
    - [x] Paper with Code (scrape available in the code repository)
  - [x] **Earth Science**
  - [x] **Physics**
    - [x] NASA Astrophysics Data System
  - [ ] **Chemistry**
    - [x] ChemRxiv
  - [ ] **Biology**

    - [x] BioRxiv / MedRxiv

  - ...

- Fulltext and advanced search.
- Smart filter.
- Rating, flag, tag, folder and markdown/plain text note.
- RSS feed subscription to follow the newest publications on your research topic.
- Locate and download PDF files from the web.
- macOS spotlight-like plugin to copy-paste references easily when writing a draft paper. Also supports MS Word.
- Cloud sync, supports macOS, Linux, and Windows.
- Beautiful and clean UI.
- Extensible. You can write your own extensions.

## Download and Install

<a href="https://paperlib.app/en/download.html" style="font-size: 16px"> » Download Here « </a>

### Windows

⚠️ You may notice that a warning shows when you install Paperlib on Windows. The reason is that there is no code signing in Paperlib because it is so expensive. The source code of Paperlib can be found in the electron branch. It won't hurt your PC and will never collect any personal information. Please make sure you are using HTTPS and our official webpage or Github to download the installer. When you install `latest.exe`, in the "Windows protected your PC" window, please click `More info` and `Run anyway`.

### macOS

⚠️ You may need to click the `preference` - `Security & Privacy` - `run anyway`.

### Linux

See [here](https://paperlib.app/en/download-linux.html).

## Quick Start

[Introduction (EN)](https://paperlib.app/en/doc/getting-started.html)  
[Introduction (CN)](https://paperlib.app/cn/doc/getting-started.html)

## Donate

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="./assets/wechat.png" alt="Buy Me A Coffee" height="174" width="174"></a>

## Sponsors

### Apple Silicon Build

<img src="https://user-images.githubusercontent.com/14183213/179353324-42ee9831-68a8-4816-97f5-cc7be7189ce8.png" style="width: 160px"/>

## Contribute to Paperlib

### Extensions

Please refer to [link](https://paperlib.app/en/extension-doc/) for the development document.

### New Features

I'm open to any new feature request, we can discuss it in the issue.

## License

[GPL-3.0 License](./LICENSE)
