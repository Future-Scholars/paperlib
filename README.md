<div align="center">
<img src="./assets/icon.png" height="95" />
<br />
<img src="https://img.shields.io/badge/dynamic/json?label=Release&query=version&url=https://raw.githubusercontent.com/GeoffreyChen777/paperlib/electron/package.json" />
<img src="https://img.shields.io/github/license/GeoffreyChen777/paperlib" />
<img src="https://img.shields.io/github/stars/GeoffreyChen777/paperlib" />
<h2><a href="https://paperlib.app/" > Paperlib </a></h2>
An open-source simple academic paper management tool for computer science.
</div>



![](./assets/ui.png)

<div align="center">

<a href="https://github.com/users/GeoffreyChen777/projects/1/views/1" style="font-size: 16px"> » Roadmap « </a>

</div>

---


⚠️ **I'm looking for someone who can help me:** ⚠️
- Test Paperlib on Apple Silicon
- Continue to develop the native SwiftUI version if you like Paperlib and are familiar with SwiftUI.

## Introduction

You may notice that conference papers are in major in our research community, which is different from other subjects. Without DOI, ISBN, metadata of a lot of conference papers are hard to lookup (e.g., NIPS, ICLR etc.). When we cite a publication in our draft paper, we need to manually search the publication information of it in Google Scholar or DBLP.

What we need may be: import a paper from a PDF file, scrape the metadata of it as accurately as possible, simply organise the library, and export it to BibTex when we are writing our own paper.

That is Paperlib.

*Why not Zotero, Mendely?*

They are both great tools. But, compatibility with all subjects means a compromise, especially the accurate metadata scraping. A modern UI. No extra useless features.

## Highlights

-   Scrape paper’s metadata and **code repository** from arXiv, doi.org, DBLP, openreview.net, IEEE, Google Scholar, and PaperwithCode etc. Tailored for computer science.
-   Fulltext and advanced search.
-   Rating, flag, tag, folder and note.
-   Cloud sync, supports macOS and Windows.

## Download and Install

<a href="https://paperlib.app/en/download/" style="font-size: 16px"> » Download Here « </a>

### Windows

You may notice that a warnning is shown when you download and install Paperlib on Windows. The reason is that the code signing certificate is so expensive. The source code of Paperlib can be found in the electron branch. It won't hurt your PC and will never collect any personal information. Just click 'show more' and keep the 'latest.exe'. When you are installing 'latest.exe', in the Windows protected your PC window, please click 'More info' and 'Run anyway'.

### macOS

You may need to click the 'preference - Security & Privacy - run anyway'.

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
My research topic is computer vision, which is only one piece of puzzle of the computer science. If the [builtin metadata scrapers](https://github.com/GeoffreyChen777/paperlib/tree/electron/packages/preload/repositories/scraper-repository/scrapers) are not suitable for your research, feel free to open an issue or pull request.

### New Features

I'm open to any new feature request, we can discuss it in the issue.

## License

[GPL-3.0 License](./LICENSE)
