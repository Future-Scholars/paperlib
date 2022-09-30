<div align="center">
<img src="./assets/icon.png" height="95" />
<br />
<img src="https://img.shields.io/badge/dynamic/json?label=Release&query=version&url=https://raw.githubusercontent.com/GeoffreyChen777/paperlib/master/package.json" />
<img src="https://img.shields.io/github/license/GeoffreyChen777/paperlib" />
<img src="https://img.shields.io/github/stars/GeoffreyChen777/paperlib" />
<h2><a href="https://paperlib.app/" > Paperlib </a></h2>
An open-source academic paper management tool.
</div>

<p align='center'>
<a href='https://paperlib.app/en/'>Webpage</a> | <a href='https://paperlib.app/en/download/'>Download</a> | <a href='https://paperlib.app/en/blog/intro/'>Quick Start</a> | <a href='https://github.com/users/GeoffreyChen777/projects/1/views/1'>Roadmap</a>
</p>

![](./assets/ui.png)

---


📣 **I'm looking for someone to work with me on developing Paperlib.** 📣

 If you are interested please contact me. 

## Introduction

I'm a computer science PhD student. Conference papers are in major in my research community, which is different from other disciplines. Without DOI, ISBN, metadata of a lot of conference papers are hard to lookup (e.g., NIPS, ICLR etc.). When I cite a publication in a draft paper, I need to manually search the publication information of it in Google Scholar or DBLP over and over again.

**Why not Zotero, Mendely?**

- A good metadata scraping capability is one of the core function of a paper management tool. Unfortunately, there is no software in this world that does this well, not even commercial software.

- A modern UI. No extra useless features.

What we need may be: import a paper, scrape the metadata of it as accurately as possible, simply organise the library, and export it to BibTex when we are writing our own papers.

That is Paperlib.


## Highlights
-   Scrape paper’s metadata with many scrapers. Support write your own metadata scrapers. Tailored for many disciplines (still growing):
    - [x] **General**
        - [x] arXiv
        - [x] doi.org
        - [x] Semantic Scholar
        - [x] Crossref
        - [x] Google Scholar
        - [ ] Springer (🚧 in progress...)
        - [ ] Elseivier Scopus (🚧 in progress...)
    - [x] **Computer Science and Electronic Engineering**
        - [x] openreview.net
        - [x] IEEE
        - [x] DBLP
        - [x] Paper with Code (scrape avaliable code repository)
    - [ ] **Earth Science** (🚧in progress...)
    - [ ] **Physics** (🚧in progress...)
        - [ ] NASA Astrophysics Data System (🚧in progress...)
        - [ ] SPIE: Inte. Society for Optics and Photonics (🚧in progress...)
    - ...
-   Fulltext and advanced search.
-   Rating, flag, tag, folder and markdown/plain text note.
-   RSS feed subscription to follow the newest publications in your research topic.
-   Locate and download PDF files from web.
-   MacOS spotlight-like plugin to copy paste reference easily when writing a draft paper.
-   Cloud sync, supports macOS and Windows.
-   Beautiful and clean UI.

## Download and Install

<a href="https://paperlib.app/en/download/" style="font-size: 16px"> » Download Here « </a>

### Windows

⚠️ You may notice that a warnning shows when you install Paperlib on Windows. The reason is that there is no code signing in Paperlib because it is so expensive. The source code of Paperlib can be found in the electron branch. It won't hurt your PC and will never collect any personal information. Please make sure you are using HTTPS and our official webpage or Github to download the installer. When you are installing 'latest.exe', in the Windows protected your PC window, please click 'More info' and 'Run anyway'.

### macOS

⚠️ You may need to click the 'preference - Security & Privacy - run anyway'.

## Quick Start

[Introduction (EN)](https://paperlib.app/en/blog/intro/)  
[Introduction (CN)](https://paperlib.app/cn/blog/intro/)

## Donate

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="./assets/wechat.png" alt="Buy Me A Coffee" height="174" width="174"></a>

## Sponsors

### Apple Silicon Build
<img src="https://user-images.githubusercontent.com/14183213/179353324-42ee9831-68a8-4816-97f5-cc7be7189ce8.png" style="width: 160px"/>


## Contribute to Paperlib

### Metadata Scrapers
My research topic is computer vision, which is only one piece of puzzle of the computer science. I tried to contact some friends to provide information about the paper matadata database in different disciplines. However, However, it does not cover all disciplines. If the [builtin metadata scrapers](https://github.com/GeoffreyChen777/paperlib/tree/master/app/repositories/scraper-repository/scrapers) are not suitable for your research, feel free to open an issue or a pull request.

### New Features

I'm open to any new feature request, we can discuss it in the issue.

## License

[GPL-3.0 License](./LICENSE)
